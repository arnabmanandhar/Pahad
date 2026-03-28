import { SIGNALS } from './constants';
import { ScoreResponse, SignalResponses } from './supabase/types';

const MAX_WEIGHTED_SUM = SIGNALS.reduce((acc, signal) => acc + signal.weight * 3, 0);

export function deterministicScore(responses: SignalResponses): ScoreResponse {
  const weightedSum = SIGNALS.reduce((acc, signal) => {
    return acc + (responses[signal.key as keyof SignalResponses] ?? 0) * signal.weight;
  }, 0);

  const score = Math.round((weightedSum / MAX_WEIGHTED_SUM) * 100);
  const risk_level = score <= 30 ? 'low' : score <= 60 ? 'moderate' : score <= 80 ? 'high' : 'critical';

  const key_signals = SIGNALS
    .map((signal) => ({
      label: signal.label_en,
      label_ne: signal.label_ne,
      value: responses[signal.key as keyof SignalResponses] ?? 0,
      weight: signal.weight,
    }))
    .filter((signal) => signal.value >= 2)
    .sort((a, b) => b.value * b.weight - a.value * a.weight)
    .slice(0, 3);

  const keySignalLabels = key_signals.map((signal) => signal.label);

  return {
    score,
    risk_level,
    explanation_en: keySignalLabels.length
      ? `Score calculated using standard WHO mhGAP screening weights. The strongest observed signals were ${keySignalLabels.join(', ')}.`
      : 'Score calculated using standard WHO mhGAP screening weights. No significant signals were recorded during this visit.',
    explanation_ne: key_signals.length
      ? `????? ???? WHO mhGAP ????????? ?????? ?????? ???? ???? ?????? ??? ????? ???????? ${key_signals.map((signal) => signal.label_ne).join(', ')} ????`
      : '????? ???? WHO mhGAP ????????? ?????? ?????? ???? ???? ?????? ??? ?? ??????? ???? ?????????? ????? ?????? ??????',
    key_signals: keySignalLabels,
    confidence: 70,
    scoring_method: 'fallback',
  };
}
