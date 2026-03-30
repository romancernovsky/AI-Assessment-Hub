'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface AssessmentTimerProps {
  onTimeExpired: () => void;
}

export default function AssessmentTimer({ onTimeExpired }: AssessmentTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const expiredRef = useRef(false);

  const fetchTimer = useCallback(async () => {
    try {
      const res = await fetch('/api/assessment/timer');
      if (!res.ok) return;
      const data = await res.json();
      setRemainingSeconds(data.remainingSeconds);
      if (data.expired && !expiredRef.current) {
        expiredRef.current = true;
        onTimeExpired();
      }
    } catch {
      // Silently ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, [onTimeExpired]);

  // Initial fetch
  useEffect(() => {
    fetchTimer();
  }, [fetchTimer]);

  // Local countdown tick — always running
  useEffect(() => {
    if (remainingSeconds === null) return;

    intervalRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev === null || prev <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onTimeExpired();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [remainingSeconds !== null, onTimeExpired]);

  // Periodic server sync every 60s
  useEffect(() => {
    const sync = setInterval(fetchTimer, 60000);
    return () => clearInterval(sync);
  }, [fetchTimer]);

  if (loading || remainingSeconds === null) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Clock className="w-4 h-4 animate-pulse" />
        <span>Loading...</span>
      </div>
    );
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isLow = remainingSeconds <= 300; // 5 minutes
  const isCritical = remainingSeconds <= 60; // 1 minute

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 border rounded text-sm font-mono transition-colors ${
        isCritical
          ? 'border-red-500 bg-red-500/10 text-red-500 animate-pulse'
          : isLow
          ? 'border-amber-500 bg-amber-500/10 text-amber-500'
          : 'border-border bg-card text-foreground'
      }`}
    >
      {isCritical ? (
        <AlertTriangle className="w-4 h-4" />
      ) : (
        <Clock className="w-4 h-4" />
      )}
      <span className="min-w-[3.5rem] text-center">{timeStr}</span>
    </div>
  );
}
