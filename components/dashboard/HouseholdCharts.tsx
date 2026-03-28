'use client';

import { Bar, BarChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SIGNALS } from '@/lib/constants';
import { SignalResponses, Visit } from '@/lib/supabase/types';

export function VisitSignalRadar({ responses }: { responses: SignalResponses }) {
  const data = SIGNALS.map((signal) => ({ subject: signal.label_en, value: responses[signal.key as keyof SignalResponses] }));
  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid stroke="#cbd5e1" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
          <Radar dataKey="value" stroke="#0f766e" fill="#14b8a6" fillOpacity={0.45} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VisitSignalBars({ responses }: { responses: SignalResponses }) {
  const data = SIGNALS.map((signal) => ({ name: signal.label_en, value: responses[signal.key as keyof SignalResponses] }));
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 24, right: 8 }}>
          <XAxis type="number" domain={[0, 3]} hide />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#0f766e" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HouseholdTrendChart({ visits }: { visits: Visit[] }) {
  const data = visits.map((visit) => ({ date: visit.visit_date, score: visit.total_score }));
  return (
    <div style={{ width: '100%', height: 180 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="score" fill="#0f766e" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
