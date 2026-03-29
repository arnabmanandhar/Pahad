import { MAX_WEIGHTED_SUM, RECOMMENDED_ACTION_COPY, SIGNALS } from './constants';
import { RecommendedAction, RiskLevel, ScoreResponse, SignalResponses } from './supabase/types';

function scoreToRiskLevel(score: number): RiskLevel {
  if (score <= 24) return 'low';
  if (score <= 49) return 'moderate';
  if (score <= 74) return 'high';
  return 'critical';
}

function riskLevelRank(level: RiskLevel) {
  return { low: 0, moderate: 1, high: 2, critical: 3 }[level];
}

function maxRiskLevel(left: RiskLevel, right: RiskLevel): RiskLevel {
  return riskLevelRank(left) >= riskLevelRank(right) ? left : right;
}

function recommendedActionFor(level: RiskLevel): RecommendedAction {
  if (level === 'critical') return 'urgent_escalation';
  if (level === 'high') return 'refer_health_post';
  return 'monitor';
}

function buildKeySignals(responses: SignalResponses) {
  return SIGNALS
    .map((signal) => ({
      key: signal.key,
      label_en: signal.label_en,
      label_ne: signal.label_ne,
      value: responses[signal.key as keyof SignalResponses] ?? 0,
      weighted: (responses[signal.key as keyof SignalResponses] ?? 0) * signal.weight,
    }))
    .filter((signal) => signal.value >= 2)
    .sort((a, b) => b.weighted - a.weighted)
    .slice(0, 4);
}

function buildExplanation(level: RiskLevel, action: RecommendedAction, keySignals: ReturnType<typeof buildKeySignals>) {
  const englishSignals = keySignals.map((signal) => signal.label_en).join(', ');
  const nepaliSignals = keySignals.map((signal) => signal.label_ne).join(', ');
  const detailEn = RECOMMENDED_ACTION_COPY[action].detail_en;
  const detailNe = RECOMMENDED_ACTION_COPY[action].detail_ne;

  if (keySignals.length === 0) {
    return {
      explanation_en: `This household currently shows only limited mental health warning signs. ${detailEn}`,
      explanation_ne: `यस व्यक्तिमा अहिले थोरै मात्र मानसिक स्वास्थ्य सम्बन्धी चेतावनी संकेत देखिएका छन्। ${detailNe}`,
    };
  }

  if (level === 'critical') {
    return {
      explanation_en: `This family may need urgent support because strong danger signals were observed: ${englishSignals}. ${detailEn}`,
      explanation_ne: `यो परिवारलाई तुरुन्त सहयोग आवश्यक पर्न सक्छ, किनभने यी गम्भीर जोखिम संकेतहरू देखिएका छन्: ${nepaliSignals}। ${detailNe}`,
    };
  }

  if (level === 'high') {
    return {
      explanation_en: `This family may need clinic follow-up because several serious signals were observed: ${englishSignals}. ${detailEn}`,
      explanation_ne: `यो परिवारलाई स्वास्थ्य संस्थामा थप मूल्यांकन आवश्यक पर्न सक्छ, किनभने यी गम्भीर संकेतहरू देखिएका छन्: ${nepaliSignals}। ${detailNe}`,
    };
  }

  return {
    explanation_en: `This family may need extra support because these signals were observed: ${englishSignals}. ${detailEn}`,
    explanation_ne: `यो परिवारलाई थप सहयोग आवश्यक पर्न सक्छ, किनभने यी संकेतहरू देखिएका छन्: ${nepaliSignals}। ${detailNe}`,
  };
}

export function deterministicScore(responses: SignalResponses): ScoreResponse {
  const rawSum = SIGNALS.reduce((acc, signal) => acc + (responses[signal.key as keyof SignalResponses] ?? 0) * signal.weight, 0);
  const score = Math.round((rawSum / MAX_WEIGHTED_SUM) * 100);

  let riskLevel = scoreToRiskLevel(score);

  if (responses.self_harm >= 1 || responses.wish_to_die >= 1) {
    riskLevel = 'critical';
  }

  if (responses.psychosis === 3) {
    riskLevel = maxRiskLevel(riskLevel, 'high');
  }

  if (responses.wish_to_die === 3) {
    riskLevel = 'critical';
  }

  const action = recommendedActionFor(riskLevel);
  const keySignals = buildKeySignals(responses);
  const { explanation_en, explanation_ne } = buildExplanation(riskLevel, action, keySignals);

  return {
    score,
    risk_level: riskLevel,
    explanation_en,
    explanation_ne,
    key_signals: keySignals.map((signal) => signal.label_en),
    confidence: 78,
    scoring_method: 'fallback',
    recommended_action: action,
  };
}