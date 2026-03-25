'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface ResultsData {
  attemptId: string;
  overallScore: number;
  dimScores: Record<string, number>;
  badge: string;
  badgeExpiresAt: string | null;
  lockExpiresAt: string | null;
  completionTime: number | null;
  answers: Record<string, { selected: string | string[]; score: number }>;
  questions: any[];
  dimensions: any[];
  competencies: any[];
}

export default function Results() {
  const router = useRouter();
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch('/api/assessment/results');
        if (res.ok) {
          const d = await res.json();
          setData(d);
        } else {
          router.push('/dashboard');
        }
      } catch (e) {
        console.error(e);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [router]);

  if (loading) return <div className="text-center py-20 animate-pulse">Loading Results...</div>;
  if (!data) return null;

  const { overallScore, dimScores, badge, badgeExpiresAt, lockExpiresAt, completionTime, answers, questions, dimensions, competencies } = data;
  const isEnthusiast = badge === 'AI Enthusiast';

  // Radar chart data
  const radarData = dimensions.map((dim: any) => ({
    dimension: dim.short || dim.name,
    score: dimScores[dim.key] || 0,
    fullMark: 100,
  }));

  // Build learning path — all questions where score < 1.0
  const learningPath = questions
    .filter((q: any) => {
      const answer = answers[q.id];
      return answer && answer.score < 1;
    })
    .map((q: any) => {
      const answer = answers[q.id];
      const dim = dimensions.find((d: any) => d.key === q.dimension);
      const compCode = q.competency ? q.competency.split(',')[0].trim() : '';
      const comp = competencies.find((c: any) => c.code === compCode);

      // Determine user's answer text and best answer text
      const optionMap: Record<string, string> = {
        'A': q.optionA,
        'B': q.optionB,
        'C': q.optionC,
        'D': q.optionD,
      };
      const scoreMap: Record<string, number> = {
        'A': q.scoreA,
        'B': q.scoreB,
        'C': q.scoreC,
        'D': q.scoreD,
      };

      const selectedLetters = Array.isArray(answer.selected) ? answer.selected : [answer.selected];
      const userAnswerTexts = selectedLetters.map((l: string) => `${l}: ${optionMap[l.toUpperCase()] || ''}`);

      const bestLetters = Object.entries(scoreMap)
        .filter(([_, score]) => score === 1)
        .map(([letter]) => letter);
      const bestAnswerTexts = bestLetters.map(l => `${l}: ${optionMap[l] || ''}`);

      return {
        ...q,
        dimName: dim?.name || q.dimension,
        dimIcon: dim?.icon || '',
        dimColor: dim?.color || '#888',
        userScore: answer.score,
        userAnswer: userAnswerTexts,
        bestAnswer: bestAnswerTexts,
        compGuidance: comp?.guidance || '',
        compToolHint: comp?.toolHint || '',
      };
    })
    .sort((a: any, b: any) => a.userScore - b.userScore);

  // Strongest and weakest dimensions
  const dimScoreEntries = dimensions
    .map((d: any) => ({ ...d, score: dimScores[d.key] || 0 }))
    .sort((a: any, b: any) => b.score - a.score);
  const strongest = dimScoreEntries[0];
  const weakest = dimScoreEntries[dimScoreEntries.length - 1];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up pb-16">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Assessment Complete</h1>
        <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
          {overallScore}%
        </div>
        <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-lg font-semibold ${
          isEnthusiast
            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
            : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
        }`}>
          <span className="text-xl">{isEnthusiast ? '🏆' : '🔍'}</span>
          {badge}
        </div>
        <p className={`mt-3 text-sm ${isEnthusiast ? 'text-emerald-400' : 'text-gray-400'}`}>
          {isEnthusiast
            ? `Badge granted! · Completed in ${completionTime || '?'} min`
            : `Reach 80% to earn AI Enthusiast badge · Completed in ${completionTime || '?'} min`
          }
        </p>
        {(data as any).bankVersionId && (
          <p className="mt-2 text-xs text-primary opacity-60">
            Assessment Version: v{(data as any).bankVersionId} {(data as any).bankVersionDescription ? `(${(data as any).bankVersionDescription})` : ''}
          </p>
        )}
      </div>

      {/* Radar Chart */}
      <GlassPanel className="p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Dimension Profile</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
                tickCount={5}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#22b8a0"
                fill="#22b8a0"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </GlassPanel>

      {/* Strengths & Growth */}
      {strongest && weakest && strongest.key !== weakest.key && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <GlassPanel className="p-6 border-l-4 border-l-emerald-500">
            <h3 className="text-lg font-bold text-emerald-300 mb-2">{strongest.icon} Strongest: {strongest.name}</h3>
            <p className="text-3xl font-bold text-white mb-1">{strongest.score}%</p>
            <p className="text-xs text-gray-400">Your top-performing dimension</p>
          </GlassPanel>
          <GlassPanel className="p-6 border-l-4 border-l-amber-500">
            <h3 className="text-lg font-bold text-amber-300 mb-2">{weakest.icon} Growth Area: {weakest.name}</h3>
            <p className="text-3xl font-bold text-white mb-1">{weakest.score}%</p>
            <p className="text-xs text-gray-400">Focus your development here</p>
          </GlassPanel>
        </div>
      )}

      {/* Dimension Education Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {dimensions.map((dim: any) => {
          const score = dimScores[dim.key] || 0;
          const passed = score >= 80;
          return (
            <GlassPanel key={dim.key} className="p-7">
              {/* Score bar */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{dim.icon}</span>
                  <span className="font-bold text-white">{dim.name}</span>
                </div>
                <Badge color={passed ? 'success' : 'warning'} className="text-xs">
                  {score}% · {Math.round(dim.weight * 100)}% weight
                </Badge>
              </div>

              {/* Progress bar with 80% threshold */}
              <div className="relative w-full h-2.5 bg-white/10 rounded-full mb-5">
                <div
                  className="h-2.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${score}%`,
                    backgroundColor: passed ? '#34d399' : dim.color || '#f59e0b'
                  }}
                />
                {/* 80% threshold marker */}
                <div className="absolute top-0 h-full w-0.5 bg-white/30" style={{ left: '80%' }} />
                <div className="absolute -top-5 text-[9px] text-gray-500" style={{ left: '78%' }}>80%</div>
              </div>

              <p className="text-xs text-gray-400 mb-3">
                <strong className="text-gray-300">What this measures:</strong> {dim.focus}
              </p>

              {passed ? (
                <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/20">
                  <p className="text-xs text-emerald-300 font-semibold mb-1">Where you are:</p>
                  <p className="text-xs text-gray-300">{dim.target}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-500/20">
                    <p className="text-xs text-amber-300 font-semibold mb-1">Where you should aim:</p>
                    <p className="text-xs text-gray-300">{dim.target}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-900/20 border border-orange-500/20">
                    <p className="text-xs text-orange-300 font-semibold mb-1">Your development focus:</p>
                    <p className="text-xs text-gray-300">{dim.developing}</p>
                  </div>
                </div>
              )}
            </GlassPanel>
          );
        })}
      </div>


      {/* Learning Path */}
      {learningPath.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Your Learning Path</h2>
          <p className="text-sm text-gray-400 mb-6">Every question where you didn't score full marks.</p>

          <div className="space-y-4">
            {learningPath.map((q: any) => (
              <GlassPanel key={q.id} className="p-7">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: q.dimColor + '20', color: q.dimColor, border: `1px solid ${q.dimColor}40` }}>
                    {q.dimIcon} {q.dimName}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-primary/20 text-primary border border-primary/30">
                    {q.level}
                  </span>
                  <span className="text-sm text-white font-semibold flex-1">{q.title}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    q.userScore >= 0.5 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {Math.round(q.userScore * 100)}%
                  </span>
                </div>

                {/* User answer vs best answer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div className="p-3 rounded-lg bg-rose-900/10 border border-rose-500/20">
                    <p className="text-xs text-rose-300 font-semibold mb-1">Your Answer</p>
                    {q.userAnswer.map((a: string, i: number) => (
                      <p key={i} className="text-xs text-gray-300 line-clamp-2">{a}</p>
                    ))}
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-900/10 border border-emerald-500/20">
                    <p className="text-xs text-emerald-300 font-semibold mb-1">Best Answer</p>
                    {q.bestAnswer.map((a: string, i: number) => (
                      <p key={i} className="text-xs text-gray-300 line-clamp-2">{a}</p>
                    ))}
                  </div>
                </div>

                {/* Why this matters */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-primary uppercase">Why this matters: </span>
                    <span className="text-gray-300">{q.rationale}</span>
                  </div>
                  {q.compGuidance && (
                    <div>
                      <span className="font-bold text-accent uppercase">The Principle: </span>
                      <span className="text-gray-300">{q.compGuidance}</span>
                    </div>
                  )}
                  {q.compToolHint && (
                    <div>
                      <span className="font-bold text-teal-300 uppercase">💡 Next Step: </span>
                      <span className="text-gray-300">{q.compToolHint}</span>
                    </div>
                  )}
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4 mt-8">
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    </div>
  );
}
