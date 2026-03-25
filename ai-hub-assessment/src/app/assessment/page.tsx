'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
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
          setSessionInfo(data);
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
    return <div className="text-center py-20 animate-pulse">Loading Your Assessment...</div>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-xl bg-red-900/40 border border-red-500/50 text-red-200">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-4xl mb-8">Assessment Portal</h1>
      <GlassCard className="max-w-3xl mx-auto">
        <div className="p-8 flex flex-col gap-6">
        {sessionInfo?.status === 'not_started' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold">AI Competency Assessment</h2>
            <p className="text-gray-300">
              This assessment measures your practical AI judgment across four dimensions — 
              AI Mindset, Applied Skills, Domain Integration, and Technical Proficiency. 
              It consists of 30 scenario-based questions with partial credit scoring and takes approximately 30 minutes.
            </p>
            <Button onClick={() => router.push(`/assessment/${sessionInfo.sessionId || 'new'}/welcome`)} className="w-fit">
              Start Assessment
            </Button>
          </div>
        )}

        {sessionInfo?.status === 'in_progress' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-yellow-500">Assessment In Progress</h2>
            <p className="text-gray-300">
              You have an unfinished assessment. Pick up where you left off.
            </p>
            <Button onClick={() => router.push('/assessment/level1')} className="w-fit">
              Resume Assessment
            </Button>
          </div>
        )}

        {sessionInfo?.status === 'completed' && (() => {
          const lockExpiresAt = sessionInfo.lockExpiresAt ? new Date(sessionInfo.lockExpiresAt) : null;
          const retakeDateFormatted = lockExpiresAt?.toLocaleDateString('en-US', {
            weekday: 'long', month: 'short', day: 'numeric', year: 'numeric'
          });
          return (
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-green-400">Assessment Completed!</h2>
              <p className="text-gray-300">
                You have completed the assessment. View your results to see your dimension profile and learning path.
              </p>
              {sessionInfo.isLocked && retakeDateFormatted && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <span className="text-xl">🔒</span>
                  <div>
                    <p className="text-amber-300 font-semibold text-sm">Retake Locked for 30 Days</p>
                    <p className="text-amber-100 text-sm mt-0.5">
                      Next available: <strong>{retakeDateFormatted}</strong>
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-4">
                <Button onClick={() => router.push('/results')} className="w-fit">
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
      </GlassCard>
    </div>
  );
}
