'use client';

import { useRouter } from 'next/navigation';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';

const dimensions = [
  { icon: '🧠', name: 'AI Mindset', weight: 35, count: 9, color: '#22b8a0' },
  { icon: '⚡', name: 'Applied Skills', weight: 30, count: 9, color: '#6a9bcc' },
  { icon: '🔗', name: 'Domain Integration', weight: 25, count: 9, color: '#4a9e6e' },
  { icon: '🔧', name: 'Technical Proficiency', weight: 10, count: 3, color: '#e8b931' },
];

export default function WelcomeScreen({ params }: { params: { id: string } }) {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto pt-8 animate-fade-in-up">
      <GlassPanel className="p-10 text-center">
        <h1 className="text-4xl font-bold mb-4 aura-text-gradient">
          AI Competency Assessment
        </h1>
        <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-xl mx-auto">
          Discover your AI strengths across four dimensions. This assessment measures how you think about and apply AI — not which buttons you know.
        </p>

        {/* Four Dimension Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {dimensions.map(dim => (
            <div
              key={dim.name}
              className="p-4 rounded-xl border border-white/10 bg-white/[0.03] text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{dim.icon}</span>
                <span className="font-semibold text-white text-sm">{dim.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span style={{ color: dim.color }} className="font-bold">{dim.weight}% weight</span>
                <span>·</span>
                <span>{dim.count} questions</span>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="flex justify-center gap-6 mb-8 text-sm text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="text-white font-bold">30</span> Questions
          </span>
          <span className="text-gray-600">|</span>
          <span>~30 min</span>
          <span className="text-gray-600">|</span>
          <span>L1 + L2</span>
          <span className="text-gray-600">|</span>
          <span>Scenario-based</span>
        </div>

        <Button 
          onClick={() => router.push(`/assessment/${params.id}/brief`)} 
          className="px-8 py-3 text-lg"
        >
          Begin Assessment →
        </Button>
      </GlassPanel>
    </div>
  );
}
