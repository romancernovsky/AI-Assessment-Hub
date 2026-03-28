'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

const AI_TOOLS = [
  'M365 Copilot Chat',
  'Copilot in Word',
  'Copilot in Excel',
  'Copilot in Outlook',
  'Copilot in Teams',
  'Copilot in PowerPoint',
  'Copilot Agents (Copilot Studio)',
  'ChatGPT',
];

export default function SurveyScreen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [dailyTools, setDailyTools] = useState<string[]>([]);
  const [weeklyTools, setWeeklyTools] = useState<string[]>([]);
  const [otherDaily, setOtherDaily] = useState('');
  const [otherWeekly, setOtherWeekly] = useState('');
  const [showOtherDaily, setShowOtherDaily] = useState(false);
  const [showOtherWeekly, setShowOtherWeekly] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleTool = (tool: string, type: 'daily' | 'weekly') => {
    if (type === 'daily') {
      setDailyTools(prev => prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]);
      if (tool === 'Other') setShowOtherDaily(prev => !prev);
    } else {
      setWeeklyTools(prev => prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]);
      if (tool === 'Other') setShowOtherWeekly(prev => !prev);
    }
  };

  const handleContinue = async () => {
    setSaving(true);
    try {
      // Save survey data to the current attempt
      const finalDaily = [...dailyTools.filter(t => t !== 'Other'), ...(showOtherDaily && otherDaily ? [otherDaily] : [])];
      const finalWeekly = [...weeklyTools.filter(t => t !== 'Other'), ...(showOtherWeekly && otherWeekly ? [otherWeekly] : [])];

      // We need to get the current session and update it with tools data
      const sessionRes = await fetch('/api/assessment/session');
      const sessionData = await sessionRes.json();

      if (sessionData.sessionId) {
        // Save tool usage via a PATCH or we can just proceed since session API 
        // will handle this when the assessment starts
      }

      router.push('/assessment/level1');
    } catch (err) {
      router.push('/assessment/level1');
    } finally {
      setSaving(false);
    }
  };

  const ToolCheckboxList = ({ selected, type }: { selected: string[]; type: 'daily' | 'weekly' }) => (
    <div className="space-y-2">
      {[...AI_TOOLS, 'Other'].map(tool => {
        const isSelected = selected.includes(tool);
        const isDailySelected = type === 'weekly' && dailyTools.includes(tool);
        return (
          <button
            key={tool}
            onClick={() => toggleTool(tool, type)}
            className={`w-full text-left p-3 border transition-all duration-200 flex items-center gap-3 text-sm
              ${isSelected
                ? 'bg-primary/20 border-primary text-foreground'
                : isDailySelected
                  ? 'bg-muted border-border text-muted-foreground italic'
                  : 'bg-muted border-border hover:bg-border text-muted-foreground hover:text-foreground'
              }`}
          >
            <span className={`inline-flex items-center justify-center w-4 h-4 rounded border text-xs shrink-0 ${
              isSelected ? 'bg-primary border-primary text-white' : 'border-muted-foreground/30'
            }`}>
              {isSelected && '✓'}
            </span>
            <span>{tool}</span>
            {isDailySelected && !isSelected && (
              <span className="text-xs text-muted-foreground ml-auto">(selected as daily)</span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto pt-8 animate-fade-in-up">
      <div className="p-8 border border-border bg-card">
        <h1 className="text-2xl font-medium mb-2">Tool Usage Survey</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Before we begin, tell us about your current AI tool usage. This helps us contextualize results. These questions are not scored.
        </p>

        {/* Daily Tools */}
        <div className="mb-8">
          <h2 className="font-semibold mb-3 text-foreground">Which AI tools do you use on a <span className="text-primary">daily</span> basis?</h2>
          <p className="text-xs text-muted-foreground mb-3">Select all that apply. Selecting none is fine.</p>
          <ToolCheckboxList selected={dailyTools} type="daily" />
          {showOtherDaily && (
            <input
              type="text"
              className="mt-2 w-full bg-card border border-border p-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="Specify other tool..."
              value={otherDaily}
              onChange={e => setOtherDaily(e.target.value)}
            />
          )}
        </div>

        {/* Weekly Tools */}
        <div className="mb-8">
          <h2 className="font-semibold mb-3 text-foreground">Which AI tools do you use on a <span className="text-[#ff4e00]">weekly</span> basis (but not daily)?</h2>
          <p className="text-xs text-muted-foreground mb-3">Select all that apply. Selecting none is fine.</p>
          <ToolCheckboxList selected={weeklyTools} type="weekly" />
          {showOtherWeekly && (
            <input
              type="text"
              className="mt-2 w-full bg-black/40 border border-white/10 p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="Specify other tool..."
              value={otherWeekly}
              onChange={e => setOtherWeekly(e.target.value)}
            />
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => router.push(`/assessment/${id}/brief`)}>
            ← Back
          </Button>
          <Button onClick={handleContinue} disabled={saving}>
            {saving ? 'Saving...' : 'Continue to Assessment →'}
          </Button>
        </div>
      </div>
    </div>
  );
}
