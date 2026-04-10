'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import AssessmentTimer from '@/components/AssessmentTimer';
import { CheckCircle2, XCircle, ThumbsUp, ThumbsDown, MessageSquare, ChevronLeft, ChevronRight, Lightbulb, Brain } from 'lucide-react';

interface QuestionOption {
  letter: string;
  text: string;
  score: number;
}

interface Question {
  id: string;
  title: string;
  scenario: string;
  dimension: string;
  dimensionName: string;
  dimensionIcon: string;
  level: string;
  competency: string;
  competencyName: string;
  format: 'single' | 'multi';
  selectCount: number;
  options: QuestionOption[];
  rationale: string;
  correct: string;
  guidance: string;
  toolHint: string;
}

interface DimensionInfo {
  key: string;
  name: string;
  weight: number;
  color: string;
  bg: string;
  icon: string;
  short: string;
}

export default function AssessmentQuiz() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dimensions, setDimensions] = useState<DimensionInfo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // Per-question state
  const [selectedSingle, setSelectedSingle] = useState<Record<string, string>>({});
  const [selectedMulti, setSelectedMulti] = useState<Record<string, string[]>>({});
  const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({});
  const [feedbackLocked, setFeedbackLocked] = useState<Record<string, boolean>>({});
  const [savedAnswers, setSavedAnswers] = useState<Record<string, boolean>>({});

  // Reaction state
  const [reactions, setReactions] = useState<Record<string, { vote: string | null; comment: string }>>({});
  const [showCommentBox, setShowCommentBox] = useState<Record<string, boolean>>({});

  // Timer expired state
  const [timeExpired, setTimeExpired] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [pendingNavUrl, setPendingNavUrl] = useState<string | null>(null);
  const autoSubmitRef = useRef(false);
  // Track whether exit was intentional (Finish / Time expired)
  const intentionalExitRef = useRef(false);

  useEffect(() => {
    async function init() {
      try {
        // Ensure we have an active session
        const sessionRes = await fetch('/api/assessment/session');
        const sessionData = await sessionRes.json();
        let attemptId = sessionData.sessionId;

        if (sessionData.status === 'not_started') {
          const startRes = await fetch('/api/assessment/session', { method: 'POST' });
          if (!startRes.ok) {
            const d = await startRes.json();
            setError(d.message || 'Failed to start session');
            setLoading(false);
            return;
          }
          const startData = await startRes.json();
          attemptId = startData.sessionId;
        } else if (sessionData.status === 'completed') {
          router.push('/results');
          return;
        }

        // Resume the timer clock on the server
        await fetch('/api/assessment/timer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'enter' }),
        });

        // Fetch questions selected for this attempt
        const qRes = await fetch(`/api/assessment/questions${attemptId ? `?attemptId=${attemptId}` : ''}`);
        const qData = await qRes.json();

        if (qRes.ok && qData.questions?.length > 0) {
          setQuestions(qData.questions);
          setDimensions(qData.dimensions || []);
        } else {
          setError(qData.message || 'No questions available.');
        }
      } catch (err) {
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  // Abandon assessment on unintentional navigation away
  useEffect(() => {
    const abandonAssessment = () => {
      if (intentionalExitRef.current) return;
      const payload = JSON.stringify({ action: 'abandon' });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/assessment/timer', new Blob([payload], { type: 'application/json' }));
      }
    };

    // Browser refresh / tab close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (intentionalExitRef.current) return;
      e.preventDefault();
      abandonAssessment();
    };

    // Browser back / forward button — push guard entry
    const guardState = { assessmentGuard: true };
    window.history.pushState(guardState, '');

    const handlePopState = (e: PopStateEvent) => {
      if (intentionalExitRef.current) return;
      // Re-push guard state to prevent leaving, show warning
      window.history.pushState(guardState, '');
      setPendingNavUrl('__back__');
      setShowLeaveWarning(true);
    };

    // Intercept clicks on in-app links (Next.js <Link>, <a> tags)
    const handleLinkClick = (e: MouseEvent) => {
      if (intentionalExitRef.current) return;
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript')) return;
      // Only intercept same-origin navigation
      if (target.hostname && target.hostname !== window.location.hostname) return;
      // Don't intercept the current page
      if (href === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingNavUrl(href);
      setShowLeaveWarning(true);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleLinkClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleLinkClick, true);
      // Component unmount without intentional exit = navigation away in SPA
      abandonAssessment();
    };
  }, []);

  const currentQ = questions[currentIndex];

  // Get the user's selection for current question
  const getSelected = useCallback(() => {
    if (!currentQ) return null;
    if (currentQ.format === 'multi') {
      return selectedMulti[currentQ.id] || [];
    }
    return selectedSingle[currentQ.id] || null;
  }, [currentQ, selectedSingle, selectedMulti]);

  const hasSelection = useCallback(() => {
    if (!currentQ) return false;
    if (currentQ.format === 'multi') {
      return (selectedMulti[currentQ.id] || []).length === currentQ.selectCount;
    }
    return !!selectedSingle[currentQ.id];
  }, [currentQ, selectedSingle, selectedMulti]);

  const handleSelectSingle = (letter: string) => {
    if (!currentQ || feedbackLocked[currentQ.id]) return;
    setSelectedSingle(prev => ({ ...prev, [currentQ.id]: letter }));
  };

  const handleSelectMulti = (letter: string) => {
    if (!currentQ || feedbackLocked[currentQ.id]) return;
    setSelectedMulti(prev => {
      const current = prev[currentQ.id] || [];
      if (current.includes(letter)) {
        return { ...prev, [currentQ.id]: current.filter(l => l !== letter) };
      }
      if (current.length < currentQ.selectCount) {
        return { ...prev, [currentQ.id]: [...current, letter] };
      }
      return prev;
    });
  };

  const saveAnswer = async () => {
    if (!currentQ || savedAnswers[currentQ.id]) return;
    setSubmitting(true);
    try {
      const selected = currentQ.format === 'multi'
        ? selectedMulti[currentQ.id]
        : selectedSingle[currentQ.id];

      await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: currentQ.id, selected })
      });
      setSavedAnswers(prev => ({ ...prev, [currentQ.id]: true }));
    } catch (err) {
      // Answer save failed silently — user can retry
    } finally {
      setSubmitting(false);
    }
  };

  const handleShowFeedback = async () => {
    if (!currentQ) return;
    // Save answer first if not yet saved
    if (!savedAnswers[currentQ.id]) {
      await saveAnswer();
    }
    setShowFeedback(prev => ({ ...prev, [currentQ.id]: true }));
    setFeedbackLocked(prev => ({ ...prev, [currentQ.id]: true }));
  };

  const handleNext = async () => {
    if (!currentQ) return;
    // Save answer if not yet saved
    if (!savedAnswers[currentQ.id] && hasSelection()) {
      await saveAnswer();
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    if (!currentQ) return;
    // Save answer if not yet saved
    if (!savedAnswers[currentQ.id] && hasSelection()) {
      await saveAnswer();
    }

    intentionalExitRef.current = true;
    setFinishing(true);
    try {
      await fetch('/api/assessment/complete', { method: 'POST' });
      router.push('/results');
    } catch (err) {
      intentionalExitRef.current = false;
      setError('Failed to complete assessment.');
      setFinishing(false);
    }
  };

  const handleTimeExpired = useCallback(async () => {
    if (autoSubmitRef.current) return;
    autoSubmitRef.current = true;
    intentionalExitRef.current = true;
    setTimeExpired(true);
    setFinishing(true);
    try {
      // Save current answer if possible
      const q = questions[currentIndex];
      if (q) {
        const sel = q.format === 'multi' ? selectedMulti[q.id] : selectedSingle[q.id];
        if (sel && !savedAnswers[q.id]) {
          await fetch('/api/assessment/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionId: q.id, selected: sel })
          });
        }
      }
      await fetch('/api/assessment/complete', { method: 'POST' });
      router.push('/results');
    } catch {
      setError('Failed to auto-submit assessment.');
      setFinishing(false);
    }
  }, [questions, currentIndex, selectedMulti, selectedSingle, savedAnswers, router]);

  const confirmLeave = () => {
    intentionalExitRef.current = true;
    setShowLeaveWarning(false);
    // Abandon the assessment
    fetch('/api/assessment/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'abandon' }),
    }).catch(() => {});
    if (pendingNavUrl === '__back__') {
      window.history.go(-2); // go back past the guard entry
    } else if (pendingNavUrl) {
      router.push(pendingNavUrl);
    }
  };

  const cancelLeave = () => {
    setShowLeaveWarning(false);
    setPendingNavUrl(null);
  };

  const handleReaction = async (vote: string) => {
    if (!currentQ) return;
    const current = reactions[currentQ.id] || { vote: null, comment: '' };
    const newVote = current.vote === vote ? null : vote;
    setReactions(prev => ({
      ...prev,
      [currentQ.id]: { ...current, vote: newVote }
    }));

    try {
      await fetch('/api/assessment/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: currentQ.id, vote: newVote })
      });
    } catch (err) {
      // Reaction save failed silently
    }
  };

  const handleComment = async () => {
    if (!currentQ) return;
    const current = reactions[currentQ.id];
    if (!current?.comment) return;

    try {
      await fetch('/api/assessment/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: currentQ.id, comment: current.comment })
      });
    } catch (err) {
      // Comment save failed silently
    }
  };

  if (loading) return (
    <div className="text-center py-20 animate-pulse text-muted-foreground">
      <div className="text-2xl mb-2">Loading Assessment...</div>
      <div className="text-sm text-muted-foreground">Preparing your 30 scenario questions</div>
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto p-8 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-200">
      <h2 className="text-xl font-bold mb-3">Unable to Load Assessment</h2>
      <p>{error}</p>
      <button onClick={() => router.push('/dashboard')} className="mt-6 text-sm underline text-muted-foreground hover:text-foreground">
        Return to Dashboard
      </button>
    </div>
  );

  if (questions.length === 0) return (
    <div className="text-center py-20 text-muted-foreground">
      No questions available. Please contact an administrator.
    </div>
  );

  // Get current question's selection
  const selected = getSelected();
  const isMulti = currentQ.format === 'multi';
  const isFeedbackShowing = showFeedback[currentQ.id] || false;
  const isLocked = feedbackLocked[currentQ.id] || false;
  const isLastQuestion = currentIndex === questions.length - 1;

  // Dimension progress tracking
  const dimProgress: Record<string, { answered: number; total: number }> = {};
  for (const dim of dimensions) {
    const dimQs = questions.filter(q => q.dimension === dim.key);
    const answered = dimQs.filter(q => savedAnswers[q.id] || selectedSingle[q.id] || (selectedMulti[q.id]?.length || 0) > 0).length;
    dimProgress[dim.key] = { answered, total: dimQs.length };
  }

  // Current question's dimension position
  const dimQuestions = questions.filter(q => q.dimension === currentQ.dimension);
  const dimIndex = dimQuestions.indexOf(currentQ) + 1;

  const globalProgress = ((Object.keys(savedAnswers).length) / questions.length) * 100;

  // Find the dimension info for current question
  const currentDim = dimensions.find(d => d.key === currentQ.dimension);

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up pb-16">
      {/* Time Expired Overlay */}
      {timeExpired && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-card border border-border p-8 max-w-md text-center">
            <h2 className="text-xl font-bold text-foreground mb-3">Time&apos;s Up!</h2>
            <p className="text-muted-foreground mb-4">
              Your 30-minute assessment time has expired. Your answers are being submitted automatically.
            </p>
            <div className="text-sm text-muted-foreground animate-pulse">Submitting...</div>
          </div>
        </div>
      )}

      {/* Leave Warning Dialog */}
      {showLeaveWarning && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-card border border-border p-8 max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-3">Leave Assessment?</h2>
            <p className="text-muted-foreground mb-2">
              If you leave now, your assessment will restart from the beginning.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              All your answers and remaining time will be lost. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={cancelLeave}>
                Stay on Assessment
              </Button>
              <Button onClick={confirmLeave} className="bg-red-600 hover:bg-red-700 text-white">
                Leave &amp; Discard
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{currentQ.dimensionIcon}</span>
          <div>
            <span className="font-semibold text-foreground">{currentQ.dimensionName}</span>
            <span className="text-muted-foreground text-sm ml-2">Q{dimIndex} of {dimQuestions.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AssessmentTimer onTimeExpired={handleTimeExpired} />
          <Badge color="info" className="text-sm px-4 py-1.5">
            {currentIndex + 1} / {questions.length}
          </Badge>
        </div>
      </div>

      {/* Global Progress Bar */}
      <div className="w-full bg-border h-1.5 mb-3">
        <div
          className="bg-[#ff4e00] h-1.5 transition-all duration-700"
          style={{ width: `${globalProgress}%` }}
        />
      </div>

      {/* Dimension Mini Progress */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {dimensions.map(dim => {
          const prog = dimProgress[dim.key];
          const pct = prog ? (prog.answered / prog.total) * 100 : 0;
          const isActive = dim.key === currentQ.dimension;
          return (
            <div key={dim.key} className={`text-center ${isActive ? 'opacity-100' : 'opacity-50'}`}>
              <div className="text-xs text-muted-foreground mb-1 truncate">{dim.icon} {dim.short}</div>
              <div className="h-1 bg-border">
                <div
                  className="h-1 transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: dim.color || '#ff4e00'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-8 border border-border bg-card">
        {/* Question Header */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary/20 text-primary border border-primary/30">
            {currentQ.level}
          </span>
          <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground border border-border">
            {currentQ.competencyName || currentQ.competency}
          </span>
          {isMulti && (
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#ff4e00]/15 text-[#ff4e00] border border-[#ff4e00]/25">
              Select exactly {currentQ.selectCount} answers
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl font-medium text-foreground mb-3">{currentQ.title}</h2>

        {/* Scenario */}
        <div className="mb-8">
          <p className="text-muted-foreground leading-relaxed">{currentQ.scenario}</p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {currentQ.options.map((option, i) => {
            const letter = option.letter;
            const isSelected = isMulti
              ? (selected as string[] || []).includes(letter)
              : selected === letter;

            let cls = 'text-left p-4 border transition-all duration-200 w-full ';

            if (!isFeedbackShowing) {
              cls += isSelected
                ? 'bg-primary/20 border-primary text-foreground'
                : 'bg-muted border-border hover:bg-border text-muted-foreground hover:text-foreground';
            } else {
              // Feedback mode: show scores
              if (option.score === 1) {
                cls += 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-200';
              } else if (isSelected && option.score < 1) {
                cls += 'bg-rose-500/15 border-rose-500/50 text-rose-700 dark:text-rose-200';
              } else {
                cls += 'bg-muted border-border text-muted-foreground';
              }
            }

            return (
              <button
                key={letter}
                disabled={isLocked}
                onClick={() => isMulti ? handleSelectMulti(letter) : handleSelectSingle(letter)}
                className={cls}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold opacity-50 uppercase mt-0.5 shrink-0 w-5">
                    {isMulti ? (
                      <span className={`inline-flex items-center justify-center w-4 h-4 rounded border ${
                      isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                      }`}>
                        {isSelected && '✓'}
                      </span>
                    ) : (
                      `${letter}.`
                    )}
                  </span>
                  <span className="flex-1">{option.text}</span>
                  {isFeedbackShowing && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${
                      option.score === 1 ? 'bg-emerald-500/20 text-emerald-300' :
                      option.score >= 0.5 ? 'bg-yellow-500/20 text-yellow-300' :
                      option.score > 0 ? 'bg-orange-500/20 text-orange-300' :
                      'bg-white/5 text-gray-500'
                    }`}>
                      {Math.round(option.score * 100)}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback Panel */}
        {isFeedbackShowing && (
          <div className="mt-6 space-y-4 animate-fade-in-up">
            {/* Scoring Rationale */}
            <div className="p-5 bg-primary/10 border border-primary/20">
              <h3 className="text-sm font-medium text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4" /> Scoring Rationale
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{currentQ.rationale}</p>
            </div>

            {/* Competency Guidance */}
            {currentQ.guidance && (
            <div className="p-5 bg-accent/10 border border-accent/20">
              <h3 className="text-sm font-medium text-accent uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> Principle
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{currentQ.guidance}</p>
              </div>
            )}

            {/* Tool Hint */}
            {currentQ.toolHint && (
              <div className="p-5 bg-teal-500/10 dark:bg-teal-900/20 border border-teal-500/20">
                <h3 className="text-sm font-medium text-teal-600 dark:text-teal-300 uppercase tracking-wider mb-2">
                  🛠️ Try it now
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{currentQ.toolHint}</p>
              </div>
            )}

            {/* Reaction Bar */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Rate this question:</span>
                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => handleReaction('up')}
                    className={`flex items-center gap-1 transition-colors ${
                      reactions[currentQ.id]?.vote === 'up' ? 'text-emerald-400' : 'hover:text-emerald-400'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReaction('down')}
                    className={`flex items-center gap-1 transition-colors ${
                      reactions[currentQ.id]?.vote === 'down' ? 'text-rose-400' : 'hover:text-rose-400'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowCommentBox(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))}
                    className="flex items-center gap-1 hover:text-blue-400 transition-colors ml-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs">Comment</span>
                  </button>
                </div>
              </div>

              {showCommentBox[currentQ.id] && (
                <div className="mt-3">
                  <textarea
                    className="w-full h-20 bg-card border border-border p-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                    placeholder="Share your thoughts on this question — was it clear? Relevant to your work? Any suggestions?"
                    value={reactions[currentQ.id]?.comment || ''}
                    onChange={(e) => setReactions(prev => ({
                      ...prev,
                      [currentQ.id]: { ...prev[currentQ.id], vote: prev[currentQ.id]?.vote || null, comment: e.target.value }
                    }))}
                    onBlur={handleComment}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>

          <div className="flex items-center gap-3">
            {hasSelection() && !isFeedbackShowing && (
              <Button
                variant="ghost"
                onClick={handleShowFeedback}
                disabled={submitting}
                className="text-sm"
              >
                Show Feedback
              </Button>
            )}

            {isLastQuestion ? (
              <Button
                onClick={handleFinish}
                disabled={!hasSelection() || finishing}
                className="flex items-center gap-1"
              >
                {finishing ? 'Completing...' : 'Finish Assessment'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!hasSelection()}
                className="flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
