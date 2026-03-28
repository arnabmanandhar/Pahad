'use client';

import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { Visit } from '@/lib/supabase/types';

export function TrendSparkline({ visits }: { visits: Visit[] }) {
  const data = [...visits]
    .sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime())
    .slice(-6)
    .map((visit) => ({ score: visit.total_score, date: visit.visit_date }));

  if (data.length < 2) return <span className="text-xs text-slate-400">-</span>;

  const latest = data[data.length - 1].score;
  const previous = data[data.length - 2].score;
  const stroke = latest > previous + 5 ? '#ef4444' : latest < previous - 5 ? '#10b981' : '#94a3b8';

  return (
    <div className="flex items-center gap-2">
      <div style={{ width: 84, height: 28 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="score" dot={false} strokeWidth={2} stroke={stroke} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} formatter={(value) => [String(value), 'Score']} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <span className="text-xs font-semibold" style={{ color: stroke }}>
        {latest > previous + 5 ? 'up' : latest < previous - 5 ? 'down' : 'stable'}
      </span>
    </div>
  );
}
