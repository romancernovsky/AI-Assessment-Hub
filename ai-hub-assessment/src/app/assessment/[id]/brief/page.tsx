'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface SessionStatus {
  status: string;
  lockExpiresAt?: string;
  isLocked?: boolean;
}

export default function BriefScreen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
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
        // Session check failed — continue with default state
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
        <div className="p-6 mb-6 border-l-2 border-l-[#ff4e00] bg-muted/50 border border-border">
          <div className="flex gap-4">
            <div className="text-2xl">🔒</div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Assessment Locked</h3>
              <p className="text-muted-foreground text-sm mb-2">
                You can retake this assessment once every 30 days to allow time to apply and reflect on the feedback.
              </p>
              <p className="text-foreground font-semibold text-sm">
                Available again: <strong>{canRetakeDate}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-8 mb-6 border border-border bg-card">
        <ul className="space-y-4 text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="text-primary mt-0.5">📋</span>
            <span>Every question is a <strong className="text-foreground">workplace scenario</strong> — no textbook definitions or trivia.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary mt-0.5">📊</span>
            <span>Questions use <strong className="text-foreground">partial credit scoring</strong> — choosing a "good" answer still earns points.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary mt-0.5">🏷️</span>
            <span>You'll see which <strong className="text-foreground">dimension</strong> each question belongs to as you go.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary mt-0.5">💡</span>
            <span>After answering, you can view <strong className="text-foreground">instant feedback</strong> with scoring rationale and practical tips. Your results page includes a full learning path.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary mt-0.5">🔧</span>
            <span>Technical questions (3 of 28) involve M365 Copilot workflows and require <strong className="text-foreground">selecting 2 answers</strong>.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary mt-0.5">⏱️</span>
            <span>You have a <strong className="text-foreground">30-minute time limit</strong>. Please allocate 30 uninterrupted minutes — the timer runs continuously once you begin. If time runs out, your answers are submitted automatically.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary mt-0.5">⚠️</span>
            <span>If you <strong className="text-foreground">navigate away or close the browser</strong> during the assessment, your attempt will be discarded and you will need to start over.</span>
          </li>
        </ul>
      </div>

      <h2 className="text-2xl font-bold mb-4">Proficiency Bands</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-6 border-l-2 border-l-border border border-border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🔍</span>
            <h3 className="text-lg font-medium text-foreground">AI Explorer</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-2">Below 90%</p>
          <p className="text-sm text-muted-foreground">
            You're on the path — keep building your AI judgment. You'll receive targeted recommendations for each dimension.
          </p>
        </div>

        <div className="p-6 border-l-2 border-l-[#ff4e00] border border-border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🏆</span>
            <h3 className="text-lg font-medium text-[#ff4e00]">AI Enthusiast</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-2">90% and above</p>
          <p className="text-sm text-muted-foreground">
            Badge granted! You demonstrate strong AI competency. Share your expertise with peers and mentor others.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.push(`/assessment/${id}/welcome`)}>
          ← Back
        </Button>
        <Button 
          onClick={() => router.push(`/assessment/${id}/survey`)} 
          className="px-8"
          disabled={isLocked || loading}
        >
          {loading ? 'Loading...' : isLocked ? 'Assessment Locked' : 'Start Assessment →'}
        </Button>
      </div>
    </div>
  );
}
