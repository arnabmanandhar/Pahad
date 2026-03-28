import { ScoreResponse, SignalResponses } from './supabase/types';
import { RESPONSE_OPTIONS, SIGNALS } from './constants';
import { deterministicScore } from './scoring';

function validateScoreResponse(candidate: unknown): ScoreResponse {
  if (!candidate || typeof candidate !== 'object') {
    throw new Error('Invalid score response');
  }

  const value = candidate as Partial<ScoreResponse>;
  if (
    typeof value.score !== 'number' ||
    !['low', 'moderate', 'high', 'critical'].includes(String(value.risk_level)) ||
    typeof value.explanation_en !== 'string' ||
    typeof value.explanation_ne !== 'string' ||
    !Array.isArray(value.key_signals) ||
    typeof value.confidence !== 'number'
  ) {
    throw new Error('Malformed score response');
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(value.score))),
    risk_level: value.risk_level as ScoreResponse['risk_level'],
    explanation_en: value.explanation_en,
    explanation_ne: value.explanation_ne,
    key_signals: value.key_signals.map(String).slice(0, 3),
    confidence: Math.max(0, Math.min(100, Math.round(value.confidence))),
    scoring_method: 'llm',
  };
}

function buildSignalLines(responses: SignalResponses) {
  return SIGNALS.map((signal) => {
    const val = responses[signal.key as keyof SignalResponses] ?? 0;
    const label = RESPONSE_OPTIONS.find((option) => option.value === val)?.label_en ?? 'Not observed';
    return `- ${signal.label_en}: ${label} (${val}/3)`;
  }).join('\n');
}

export async function scoreWithGemini(responses: SignalResponses): Promise<ScoreResponse> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  const prompt = `You are a community mental health screening assistant trained on WHO mhGAP guidelines. You help community health workers in Nepal identify households that may need professional mental health support.\n\nObserved signals:\n${buildSignalLines(responses)}\n\nRespond with valid JSON only with keys score, risk_level, explanation_en, explanation_ne, key_signals, confidence.`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 400,
        responseMimeType: 'application/json',
      },
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Gemini HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return validateScoreResponse(JSON.parse(text));
}

export async function scoreWithMiniMax(responses: SignalResponses): Promise<ScoreResponse> {
  if (!process.env.MINIMAX_API_KEY) {
    throw new Error('Missing MINIMAX_API_KEY');
  }

  const res = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'MiniMax-Text-01',
      temperature: 0,
      max_tokens: 400,
      messages: [
        { role: 'system', content: 'You are a WHO mhGAP community mental health screening assistant. Return JSON only.' },
        { role: 'user', content: `Score the following observations and return JSON with keys score, risk_level, explanation_en, explanation_ne, key_signals, confidence.\n\n${buildSignalLines(responses)}` },
      ],
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`MiniMax HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  const clean = String(text ?? '').replace(/```json|```/g, '').trim();
  return validateScoreResponse(JSON.parse(clean));
}

export async function scoreWithFallbacks(responses: SignalResponses): Promise<ScoreResponse> {
  try {
    return await scoreWithGemini(responses);
  } catch {
    try {
      return await scoreWithMiniMax(responses);
    } catch {
      return deterministicScore(responses);
    }
  }
}
