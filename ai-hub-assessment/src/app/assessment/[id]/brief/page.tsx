'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';

interface SessionStatus {
  status: string;
  lockExpiresAt?: string;
  isLocked?: boolean;
}

export default function BriefScreen({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/assessment/session');
        if (res.ok) {
          const data = await res.json();
          setSessionStatus(data);
        }
      } catch (e) {
        console.error('Failed to check session:', e);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const isLocked = sessionStatus?.isLocked;
  const lockExpiresAt = sessionStatus?.lockExpiresAt ? new Date(sessionStatus.lockExpiresAt) : null;
  const canRetakeDate = lockExpiresAt?.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="max-w-3xl mx-auto pt-8 animate-fade-in-up">
      <h1 className="text-3xl font-bold mb-6">What to Expect</h1>

      {isLocked && (
        <GlassPanel className="p-6 mb-6 border-l-4 border-l-amber-500 bg-amber-500/5">
          <div className="flex gap-4">
            <div className="text-2xl">🔒</div>
            <div>
              <h3 className="font-semibold text-amber-300 mb-1">Assessment Locked</h3>
              <p className="text-amber-100 text-sm mb-2">
                You can retake this assessment once every 30 days to allow time to apply and reflect on the feedback.
              </p>
              <p className="text-amber-200 font-semibold text-sm">
                Available again: <strong>{canRetakeDate}</strong>
              </p>
            </div>
          </div>
        </GlassPanel>
      )}

      <GlassPanel className="p-8 mb-6">
        <ul className="space-y-4 text-gray-300">
          <li className="flex items-start gap-3">
            <span className="text-primary mt-0.5">📋</span>
            <span>Every question is a <strong className="text-white">workplace scenario</strong> — no textbook definitions or trivia.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary mt-0.5">📊</span>
            <span>Questions use <strong className="text-white">partial credit scoring</strong> — choosing a "good" answer still earns points.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary mt-0.5">🏷️</span>
            <span>You'll see which <strong className="text-white">dimension</strong> each question belongs to as you go.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary mt-0.5">💡</span>
            <span>After answering, you can view <strong className="text-white">instant feedback</strong> with scoring rationale and practical tips. Your results page includes a full learning path.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary mt-0.5">🔧</span>
            <span>Technical questions (3 of 30) involve M365 Copilot workflows and require <strong className="text-white">selecting 2 answers</strong>.</span>
          </li>
        </ul>
      </GlassPanel>

      <h2 className="text-2xl font-bold mb-4">Proficiency Bands</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <GlassPanel className="p-6 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🔍</span>
            <h3 className="text-lg font-bold text-amber-300">AI Explorer</h3>
          </div>
          <p className="text-sm text-gray-300 mb-2">Below 80%</p>
          <p className="text-sm text-gray-400">
            You're on the path — keep building your AI judgment. You'll receive targeted recommendations for each dimension.
          </p>
        </GlassPanel>

        <GlassPanel className="p-6 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🏆</span>
            <h3 className="text-lg font-bold text-emerald-300">AI Enthusiast</h3>
          </div>
          <p className="text-sm text-gray-300 mb-2">80% and above</p>
          <p className="text-sm text-gray-400">
            Badge granted! You demonstrate strong AI competency. Share your expertise with peers and mentor others.
          </p>
        </GlassPanel>
      </div>

      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.push(`/assessment/${params.id}/welcome`)}>
          ← Back
        </Button>
        <Button 
          onClick={() => router.push(`/assessment/${params.id}/survey`)} 
          className="px-8"
          disabled={isLocked || loading}
        >
          {loading ? 'Loading...' : isLocked ? 'Assessment Locked' : 'Start Assessment →'}
        </Button>
      </div>
    </div>
  );
}
