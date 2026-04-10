"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, XCircle, ArrowLeft, Filter, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function ReviewClient({ attempt, questions, answers, reactions, feedbackMode = false }: any) {
  const [filter, setFilter] = useState<string>("All");
  const [localReactions, setLocalReactions] = useState<Record<string, { vote: string | null; comment: string }>>(
    () => {
      const map: Record<string, { vote: string | null; comment: string }> = {};
      reactions.forEach((r: any) => {
        map[r.questionId] = { vote: r.vote, comment: r.comment || "" };
      });
      return map;
    }
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedComment, setExpandedComment] = useState<string | null>(null);

  const dimensions = Array.from(new Set(questions.map((q: any) => q.dimension)));

  const filteredQuestions = filter === "All" 
    ? questions 
    : questions.filter((q: any) => q.dimension === filter);

  const handleVote = async (questionId: string, vote: string) => {
    const current = localReactions[questionId];
    const newVote = current?.vote === vote ? null : vote;
    setLocalReactions(prev => ({ ...prev, [questionId]: { ...prev[questionId], vote: newVote, comment: prev[questionId]?.comment || "" } }));
    setSavingId(questionId);
    try {
      await fetch("/api/assessment/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: attempt.attemptId, questionId, vote: newVote }),
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleCommentSubmit = async (questionId: string) => {
    const comment = localReactions[questionId]?.comment || "";
    setSavingId(questionId);
    try {
      await fetch("/api/assessment/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: attempt.attemptId, questionId, comment }),
      });
    } finally {
      setSavingId(null);
      setExpandedComment(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium">
            {feedbackMode ? "Assessment Feedback" : "Assessment Review"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {feedbackMode
              ? "Provide feedback on each question. Your answers are locked."
              : "Review your answers, see correct responses, and read explanations."}
          </p>
        </div>
        <Link href="/results">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border hover:border-[#ff4e00]/30 transition-all text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="border border-border p-4 flex flex-wrap gap-2 items-center bg-card">
        <Filter className="w-4 h-4 text-muted-foreground mr-2" />
        <button
          onClick={() => setFilter("All")}
          className={`px-4 py-1.5 text-sm font-medium transition-all ${filter === "All" ? "bg-[#ff4e00]/10 text-[#ff4e00] border border-[#ff4e00]/30" : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent"}`}
        >
          All Dimensions
        </button>
        {dimensions.map((dim: any) => (
          <button
            key={dim}
            onClick={() => setFilter(dim)}
            className={`px-4 py-1.5 text-sm font-medium transition-all ${filter === dim ? "bg-[#ff4e00]/10 text-[#ff4e00] border border-[#ff4e00]/30" : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent"}`}
          >
            {dim}
          </button>
        ))}
      </div>

      {/* Review List */}
      <div className="space-y-6">
        {filteredQuestions.map((question: any, index: number) => {
          const userAnswerData = answers[question.id];
          const optionMap: Record<string, string> = { A: question.optionA, B: question.optionB, C: question.optionC, D: question.optionD };
          const scoreMap: Record<string, number> = { A: question.scoreA, B: question.scoreB, C: question.scoreC, D: question.scoreD };
          const selectedLetters = userAnswerData ? (Array.isArray(userAnswerData.selected) ? userAnswerData.selected : [userAnswerData.selected]) : [];
          const isCorrect = userAnswerData?.score === 1;
          const userAnswerText = selectedLetters.map((l: string) => `${l}: ${optionMap[l.toUpperCase()] || ''}`).join('; ');
          const bestLetters = Object.entries(scoreMap).filter(([_, s]) => s === 1).map(([l]) => l);
          const bestAnswerText = bestLetters.map(l => `${l}: ${optionMap[l] || ''}`).join('; ');
          const reaction = localReactions[question.id];

          return (
            <div key={question.id} className={`border border-border p-6 border-l-4 bg-card ${isCorrect ? "border-l-emerald-500" : "border-l-rose-500"}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <Badge color="info" className="border-[#ff4e00]/30 text-[#ff4e00]">
                    Q{index + 1}
                  </Badge>
                  <Badge color="info" className="text-muted-foreground">
                    {question.dimension}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                   {isCorrect ? (
                     <Badge color="success" className="flex items-center gap-1.5 px-3 py-1">
                       <CheckCircle2 className="w-4 h-4" /> Correct
                     </Badge>
                   ) : (
                     <Badge color="warning" className="flex items-center gap-1.5 px-3 py-1 bg-muted text-foreground border-border">
                       <XCircle className="w-4 h-4" /> Incorrect
                     </Badge>
                   )}
                </div>
              </div>

              <h3 className="text-xl font-medium mb-6">{question.scenario || question.title}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {/* User's Answer */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground tracking-wider">Your Answer</h4>
                  <div className={`p-4 border ${isCorrect ? "border-border bg-muted/50 border-l-2 border-l-[#ff4e00] text-foreground" : "border-border bg-muted/50 border-l-2 border-l-border text-foreground"}`}>
                    {userAnswerText || <span className="italic text-muted-foreground">No answer provided</span>}
                  </div>
                </div>

                {/* Correct Answer (if user got it wrong) */}
                {!isCorrect && bestAnswerText && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground tracking-wider">Correct Answer</h4>
                    <div className="p-4 border border-border bg-muted/50 border-l-2 border-l-[#ff4e00] text-foreground">
                      {bestAnswerText}
                    </div>
                  </div>
                )}
              </div>

              {/* Rationale & Feedback */}
              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <div>
                   <h4 className="text-sm font-medium text-[#ff4e00] mb-2">Rationale</h4>
                   <p className="text-muted-foreground">{question.rationale}</p>
                </div>
                
                <div className="p-4 bg-[#ff4e00]/5 border border-[#ff4e00]/15">
                   <h4 className="text-sm font-medium text-[#ff4e00] mb-1">Guiding Principle</h4>
                   <p className="text-muted-foreground text-sm">{question.competency}</p>
                </div>
              </div>

              {/* Feedback controls */}
              {feedbackMode ? (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">Rate this question:</span>
                    <button
                      onClick={() => handleVote(question.id, "up")}
                      disabled={savingId === question.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border transition-all ${reaction?.vote === "up" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" : "border-border text-muted-foreground hover:border-emerald-500/30 hover:text-emerald-600"}`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Helpful
                    </button>
                    <button
                      onClick={() => handleVote(question.id, "down")}
                      disabled={savingId === question.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border transition-all ${reaction?.vote === "down" ? "bg-rose-500/10 border-rose-500/30 text-rose-600" : "border-border text-muted-foreground hover:border-rose-500/30 hover:text-rose-600"}`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> Confusing
                    </button>
                    <button
                      onClick={() => setExpandedComment(expandedComment === question.id ? null : question.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border transition-all ${expandedComment === question.id || reaction?.comment ? "bg-[#ff4e00]/10 border-[#ff4e00]/30 text-[#ff4e00]" : "border-border text-muted-foreground hover:border-[#ff4e00]/30 hover:text-[#ff4e00]"}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Comment
                    </button>
                  </div>
                  {expandedComment === question.id && (
                    <div className="mt-3 flex gap-2">
                      <textarea
                        value={reaction?.comment || ""}
                        onChange={(e) => setLocalReactions(prev => ({ ...prev, [question.id]: { ...prev[question.id], vote: prev[question.id]?.vote || null, comment: e.target.value } }))}
                        placeholder="Share your thoughts on this question..."
                        className="flex-1 p-3 text-sm border border-border bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-[#ff4e00]/30"
                        rows={2}
                      />
                      <button
                        onClick={() => handleCommentSubmit(question.id)}
                        disabled={savingId === question.id}
                        className="self-end px-4 py-2 text-sm bg-[#ff4e00] text-white hover:bg-[#ff4e00]/90 transition-all disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                reaction && (reaction.vote || reaction.comment) && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground/60">Your feedback on this question:</span>
                    {reaction.vote === "up" ? "👍 Helpful" : reaction.vote === "down" ? "👎 Confusing/Incorrect" : ""}
                    {reaction.comment && <span className="italic">&quot;{reaction.comment}&quot;</span>}
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
