import { NextRequest, NextResponse } from 'next/server';
import { scoreWithFallbacks } from '@/lib/gemini';
import { SignalResponses } from '@/lib/supabase/types';

function isSignalResponses(value: unknown): value is SignalResponses {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return ['sleep', 'appetite', 'withdrawal', 'trauma', 'activities', 'hopelessness', 'substance', 'self_harm'].every((key) => {
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

    const result = await scoreWithFallbacks(body.responses);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Scoring failed' }, { status: 500 });
  }
}
