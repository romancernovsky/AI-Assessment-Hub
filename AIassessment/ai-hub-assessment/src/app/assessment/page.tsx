'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function Assessment() {
  const router = useRouter();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/assessment/session');
        const data = await res.json();
        
        if (res.ok) {
          // Any in_progress attempt found on this page is orphaned
          // (user navigated away from the quiz). Clean it up.
          if (data.status === 'in_progress') {
            await fetch('/api/assessment/timer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'abandon' }),
            });
            setSessionInfo({ status: 'not_started' });
          } else {
            setSessionInfo(data);
          }
        } else {
          setError(data.message || 'Error loading session');
        }
      } catch (e) {
        setError('Unexpected error communicating with the server.');
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  if (loading) {
    return <div className="text-center py-20 animate-pulse text-muted-foreground">Loading Your Assessment...</div>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-muted/50 border-l-2 border-l-destructive border border-border text-foreground">
        <h2 className="text-xl font-medium mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-4xl font-medium mb-8">Assessment Portal</h1>
      <div className="border border-border bg-card max-w-3xl mx-auto">
        <div className="p-8 flex flex-col gap-6">
        {sessionInfo?.status === 'not_started' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-medium">AI Competency Assessment</h2>
            <p className="text-muted-foreground">
              This assessment measures your practical AI judgment across four dimensions — 
              AI Mindset, Applied Skills, Domain Integration, and Technical Proficiency. 
              It consists of 28 scenario-based questions with partial credit scoring and a 30-minute time limit.
            </p>
            <Button onClick={() => router.push(`/assessment/${sessionInfo.sessionId || 'new'}/welcome`)} className="w-fit">
              Start Assessment
            </Button>
          </div>
        )}

        {sessionInfo?.status === 'completed' && (() => {
          const lockExpiresAt = sessionInfo.lockExpiresAt ? new Date(sessionInfo.lockExpiresAt) : null;
          const retakeDateFormatted = lockExpiresAt?.toLocaleDateString('en-US', {
            weekday: 'long', month: 'short', day: 'numeric', year: 'numeric'
          });
          const isLocked = sessionInfo.isLocked;

          return (
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-medium text-foreground">Assessment Completed!</h2>
              <p className="text-muted-foreground">
                You have completed the assessment. View your results to see your dimension profile and learning path.
              </p>

              {isLocked && retakeDateFormatted && (
                <div className="flex items-start gap-3 p-4 border-l-2 border-l-[#ff4e00] border border-border bg-muted/50">
                  <span className="text-xl">🔒</span>
                  <div>
                    <p className="text-foreground font-medium text-sm">Retake Locked for 30 Days</p>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      Next available: <strong>{retakeDateFormatted}</strong>
                    </p>
                  </div>
                </div>
              )}

              {!isLocked && (
                <div className="flex items-start gap-3 p-4 border-l-2 border-l-foreground border border-border bg-muted/50">
                  <span className="text-xl">🔓</span>
                  <div>
                    <p className="text-foreground font-medium text-sm">Assessment Available</p>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      The 30-day cooldown has passed. You can retake the assessment.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                {!isLocked && (
                  <Button onClick={async () => {
                    try {
                      const res = await fetch('/api/assessment/session', { method: 'POST' });
                      const data = await res.json();
                      if (res.ok && data.sessionId) {
                        router.push(`/assessment/${data.sessionId}/welcome`);
                      } else {
                        setError(data.message || 'Could not start a new session');
                      }
                    } catch {
                      setError('Unexpected error starting assessment');
                    }
                  }} className="w-fit">
                    Start New Assessment
                  </Button>
                )}
                <Button onClick={() => router.push('/results')} variant={isLocked ? 'filled' : 'ghost'} className="w-fit">
                  View Results
                </Button>
                <Button variant="ghost" onClick={() => router.push('/dashboard')} className="w-fit">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          );
        })()}
        </div>
      </div>
    </div>
  );
}
