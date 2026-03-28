'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface RadarDataItem {
  dimension: string;
  score: number;
  fullMark: number;
}

export default function ResultsRadarChart({ data }: { data: RadarDataItem[] }) {
  if (data.length < 3) return null;

  return (
    <div className="flex justify-center mb-8">
      <div className="w-full max-w-md" style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="var(--color-border, #e5e5e5)" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: 'var(--color-foreground, #141413)', fontSize: 12, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: 'var(--color-muted-foreground, #888)', fontSize: 10 }}
              tickCount={5}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#ff4e00"
              fill="#ff4e00"
              fillOpacity={0.18}
              strokeWidth={2}
            />
            <Tooltip
              formatter={(value: any) => [`${value}%`, 'Score']}
              contentStyle={{
                backgroundColor: 'var(--color-card, #fff)',
                border: '1px solid var(--color-border, #e5e5e5)',
                borderRadius: 0,
                fontSize: 12,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
