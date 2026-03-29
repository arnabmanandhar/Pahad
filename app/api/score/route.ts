import { NextRequest, NextResponse } from 'next/server';
import { deterministicScore } from '@/lib/scoring';
import { SignalResponses } from '@/lib/supabase/types';

const SIGNAL_KEYS: Array<keyof SignalResponses> = [
  'sleep',
  'appetite',
  'activities',
  'hopelessness',
  'withdrawal',
  'trauma',
  'fear',
  'psychosis',
  'substance',
  'family_neglect',
  'self_harm',
  'wish_to_die',
];

function isSignalResponses(value: unknown): value is SignalResponses {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return SIGNAL_KEYS.every((key) => {
    const entry = candidate[key];
    return typeof entry === 'number' && entry >= 0 && entry <= 3;
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!isSignalResponses(body.responses)) {
      return NextResponse.json({ error: 'Missing or invalid responses' }, { status: 400 });
    }

    const result = deterministicScore(body.responses);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Scoring failed' }, { status: 500 });
  }
}
