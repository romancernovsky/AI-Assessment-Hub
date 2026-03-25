'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [results, setResults] = useState<any>(null);
  const [sessionStatus, setSessionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [resultsRes, sessionRes] = await Promise.all([
          fetch('/api/assessment/results'),
          fetch('/api/assessment/session')
        ]);
        if (resultsRes.ok) setResults(await resultsRes.json());
        if (sessionRes.ok) setSessionStatus(await sessionRes.json());
      } catch (e) {
        console.error('Error fetching dashboard data:', e);
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') fetchData();
  }, [status]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="space-y-3 w-64">
          <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-white/10 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-white/10 rounded animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'contentAdmin';
  const isEnthusiast = results?.badge === 'AI Enthusiast';

  return (
    <div className="animate-fade-in-up space-y-8 pb-12">
      {/* Page header */}
      <div className="pt-2">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
          Welcome,{' '}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {session?.user?.name?.split(' ')[0] || 'User'}
          </span>
        </h1>
        <p className="text-gray-400 text-lg">View your assessment progress and results.</p>
      </div>

      {/* Main cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assessment Card */}
        <GlassCard>
          <div className="flex flex-col h-full gap-6 p-8">
            {/* Card header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">My Assessment</h2>
                <p className="text-gray-400 text-sm mt-1">AI Competency Measurement</p>
              </div>
            </div>

            <p className="text-gray-300 leading-relaxed">
              Measure your AI competency across four dimensions — AI Mindset, Applied Skills,
              Domain Integration, and Technical Proficiency. 30 scenario-based questions, ~30 minutes.
            </p>

            {sessionStatus?.isLocked && (
              <div className="p-4 rounded-xl bg-amber-500/8 border border-amber-500/25">
                <p className="font-semibold text-amber-300 flex items-center gap-2 mb-1">
                  <span>🔒</span> Assessment Locked
                </p>
                <p className="text-amber-400/70 text-sm">
                  You can retake starting{' '}
                  <span className="text-amber-300 font-medium">
                    {new Date(sessionStatus.lockExpiresAt).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </p>
              </div>
            )}

            <div className="mt-auto">
              <Button
                onClick={() => router.push('/assessment')}
                className="w-full justify-center py-3 text-base"
                variant={sessionStatus?.isLocked ? 'ghost' : 'default' as any}
              >
                {sessionStatus?.isLocked ? 'View Lock Status' : 'Go to Assessment Portal'}
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Results Card */}
        <GlassCard>
          <div className="flex flex-col h-full gap-6 p-8">
            {/* Card header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">My Results</h2>
                <p className="text-gray-400 text-sm mt-1">Performance overview</p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-white/10 rounded-lg w-1/3" />
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-5 bg-white/10 rounded-full" />
                ))}
              </div>
            ) : results ? (
              <div className="space-y-5">
                {/* Score & Badge row */}
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {results.overallScore}%
                  </div>
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${
                    isEnthusiast
                      ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-300'
                      : 'bg-amber-500/15 border border-amber-500/35 text-amber-300'
                  }`}>
                    <span>{isEnthusiast ? '🏆' : '🔍'}</span>
                    {results.badge}
                  </div>
                </div>

                {/* Dimension bars – larger, more breathing room */}
                {results.dimensions && (
                  <div className="space-y-3.5">
                    {results.dimensions.map((dim: any) => {
                      const score = results.dimScores?.[dim.key] || 0;
                      return (
                        <div key={dim.key} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{dim.icon}</span>
                              <span className="text-gray-300 font-medium">{dim.name}</span>
                            </div>
                            <span className={`text-sm font-semibold tabular-nums ${score >= 80 ? 'text-emerald-400' : 'text-gray-300'}`}>
                              {score}%
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-white/8 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${score}%`,
                                backgroundColor: score >= 80 ? '#34d399' : (dim.color || '#f59e0b')
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {results.completionTime && (
                  <div className="flex justify-between items-center pt-1 border-t border-white/8 text-xs text-gray-500">
                    <span>Completed in {results.completionTime} min</span>
                    {results.bankVersionId && (
                      <span className="text-primary/60">
                        v{results.bankVersionId}{results.bankVersionDescription ? ` (${results.bankVersionDescription})` : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                  Your results and skill profile will appear here once you complete the assessment.
                </p>
              </div>
            )}

            <div className="mt-auto">
              {results ? (
                <Button onClick={() => router.push('/results')} className="w-full justify-center py-3 text-base">
                  View Full Results
                </Button>
              ) : (
                <Button disabled variant="ghost" className="w-full justify-center py-3 text-base opacity-40">
                  Not Available Yet
                </Button>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="glass-panel border border-primary/25 bg-primary/5 rounded-2xl p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">Admin Controls</h2>
              <p className="text-gray-400 text-sm mt-1">Manage the Question Bank, monitor sessions, and review analytics.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Question Bank', path: '/admin/bank', icon: '📚' },
              { label: 'Users', path: '/admin/users', icon: '👥' },
              { label: 'Analytics', path: '/admin/analytics', icon: '📊' },
              { label: 'Feedback', path: '/admin/feedback', icon: '💬' },
            ].map(({ label, path, icon }) => (
              <button
                key={path}
                onClick={() => router.push(path)}
                className="flex items-center gap-3 px-5 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/40 transition-all duration-200 text-sm font-semibold text-gray-200 hover:text-white group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform duration-200">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
