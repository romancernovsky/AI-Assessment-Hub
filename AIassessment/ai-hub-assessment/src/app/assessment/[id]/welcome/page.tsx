'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

const dimensions = [
  { icon: '🧠', name: 'AI Mindset', weight: 35, count: 10, color: '#ff4e00' },
  { icon: '⚡', name: 'Applied Skills', weight: 30, count: 8, color: '#6a9bcc' },
  { icon: '🔗', name: 'Domain Integration', weight: 25, count: 7, color: '#788c5d' },
  { icon: '🔧', name: 'Technical Proficiency', weight: 10, count: 3, color: '#d97757' },
];

export default function WelcomeScreen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto pt-8 animate-fade-in-up">
      <div className="p-10 text-center border border-border bg-card">
        <h1 className="text-4xl font-medium mb-4 text-[#ff4e00]">
          AI Competency Assessment
        </h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl mx-auto">
          Discover your AI strengths across four dimensions. This assessment measures how you think about and apply AI — not which buttons you know.
        </p>

        {/* Four Dimension Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {dimensions.map(dim => (
            <div
              key={dim.name}
              className="p-4 border border-border bg-card text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{dim.icon}</span>
                <span className="font-semibold text-foreground text-sm">{dim.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span style={{ color: dim.color }} className="font-bold">{dim.weight}% weight</span>
                <span>·</span>
                <span>{dim.count} questions</span>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="flex justify-center gap-6 mb-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="text-foreground font-medium">28</span> Questions
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1.5">
            <span className="text-foreground font-medium">30 min</span> Time Limit
          </span>
          <span className="text-border">|</span>
          <span>Scenario-based</span>
        </div>

        <Button 
          onClick={() => router.push(`/assessment/${id}/brief`)} 
          className="px-8 py-3 text-lg"
        >
          Begin Assessment →
        </Button>
      </div>
    </div>
  );
}
