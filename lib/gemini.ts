import { deterministicScore } from './scoring';
import { ScoreResponse, SignalResponses } from './supabase/types';

export async function scoreWithGemini(responses: SignalResponses): Promise<ScoreResponse> {
  return deterministicScore(responses);
}

export async function scoreWithMiniMax(responses: SignalResponses): Promise<ScoreResponse> {
  return deterministicScore(responses);
}

export async function scoreWithFallbacks(responses: SignalResponses): Promise<ScoreResponse> {
  return deterministicScore(responses);
}
