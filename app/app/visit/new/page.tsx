'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Search } from 'lucide-react';
import { ConsentBanner } from '@/components/shared/ConsentBanner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RiskBadge } from '@/components/ui/Badge';
import { SignalCard } from '@/components/visits/SignalCard';
import { RiskExplanation } from '@/components/visits/RiskExplanation';
import { EMPTY_RESPONSES } from '@/lib/constants';
import { Database, ScoreResponse, SignalResponses } from '@/lib/supabase/types';
import { demoHouseholds } from '@/lib/demo-data';
import { createSupabaseBrowserClient, hasSupabaseEnv } from '@/lib/supabase/client';

export default function NewVisitPage() {
  const supabase = hasSupabaseEnv() ? createSupabaseBrowserClient() : null;
  const [query, setQuery] = useState('');
  const [selectedHouseholdId, setSelectedHouseholdId] = useState(demoHouseholds[0]?.id ?? '');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [responses, setResponses] = useState<SignalResponses>(EMPTY_RESPONSES);
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState(false);

  const households = useMemo(
    () => demoHouseholds.filter((household) => `${household.code} ${household.head_name}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  const selectedHousehold = demoHouseholds.find((household) => household.id === selectedHouseholdId) ?? households[0];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const scoreRes = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responses }),
    });

    const scoreData = (await scoreRes.json()) as ScoreResponse;
    setResult(scoreData);

    if (selectedHousehold && supabase) {
      const visitPayload: Database['public']['Tables']['visits']['Insert'] = {
        household_id: selectedHousehold.id,
        chw_id: selectedHousehold.assigned_chw_id,
        visit_date: visitDate,
        responses,
        total_score: scoreData.score,
        risk_level: scoreData.risk_level,
        confidence: scoreData.confidence,
        explanation_en: scoreData.explanation_en,
        explanation_ne: scoreData.explanation_ne,
        key_signals: scoreData.key_signals,
        notes,
        scoring_method: scoreData.scoring_method,
      };

      await supabase.from('visits').insert(visitPayload as never);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <ConsentBanner />
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Select household</label>
              <div className="mt-2 rounded-3xl border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by code or name" className="w-full bg-transparent text-sm outline-none" />
                </div>
                <div className="mt-3 max-h-56 space-y-2 overflow-auto">
                  {households.map((household) => (
                    <button
                      key={household.id}
                      type="button"
                      onClick={() => setSelectedHouseholdId(household.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${selectedHouseholdId === household.id ? 'border-brand bg-brand-soft/40' : 'border-slate-200 dark:border-slate-800'}`}
                    >
                      <div>
                        <p className="font-semibold text-ink dark:text-white">{household.code}: {household.head_name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Area {household.area_id}</p>
                      </div>
                      <RiskBadge level={household.latest_risk_level} score={household.latest_risk_score} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Visit date</label>
              <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950" />
              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Selected household</p>
                <p className="mt-2 text-xl font-semibold text-ink dark:text-white">{selectedHousehold?.head_name}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedHousehold?.code}</p>
                {selectedHousehold ? <div className="mt-3"><RiskBadge level={selectedHousehold.latest_risk_level} score={selectedHousehold.latest_risk_score} /></div> : null}
              </div>
            </div>
          </div>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(EMPTY_RESPONSES) as Array<keyof SignalResponses>).map((signalKey) => (
            <SignalCard key={signalKey} signalKey={signalKey} value={responses[signalKey]} onChange={(value) => setResponses((current) => ({ ...current, [signalKey]: value }))} />
          ))}
        </div>
        <Card>
          <button type="button" onClick={() => setExpandedNotes((current) => !current)} className="flex w-full items-center justify-between text-left">
            <div>
              <p className="text-lg font-semibold text-ink dark:text-white">Additional notes</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Optional context for the supervisor or next CHW visit.</p>
            </div>
            <ChevronDown className={`h-5 w-5 transition ${expandedNotes ? 'rotate-180' : ''}`} />
          </button>
          {expandedNotes ? <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-4 min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950" placeholder="Describe any other observations..." /> : null}
        </Card>
        <Button type="submit" loading={loading} className="w-full py-4 text-base">{loading ? 'Syncing visit...' : 'Submit & Score'}</Button>
      </form>
      {result ? (
        <div className="space-y-4">
          <RiskExplanation visit={result} lang="en" />
          <div className="flex flex-wrap gap-3">
            <Link href="/app"><Button variant="secondary">Back to Home</Button></Link>
            <Link href="/app/visits"><Button>View Full Details</Button></Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}