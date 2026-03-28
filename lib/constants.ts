import { RiskLevel, SignalResponses } from './supabase/types';

export const SIGNALS = [
  { key: 'sleep', weight: 2, label_en: 'Sleep changes', label_ne: 'निद्रामा परिवर्तन' },
  { key: 'appetite', weight: 2, label_en: 'Appetite changes', label_ne: 'खानामा परिवर्तन' },
  { key: 'withdrawal', weight: 3, label_en: 'Social withdrawal', label_ne: 'सामाजिक अलगाव' },
  { key: 'trauma', weight: 3, label_en: 'Recent loss or trauma', label_ne: 'हालैको क्षति वा आघात' },
  { key: 'activities', weight: 3, label_en: 'Stopped daily activities', label_ne: 'दैनिक काम बन्द' },
  { key: 'hopelessness', weight: 4, label_en: 'Expressed hopelessness', label_ne: 'निराशा व्यक्त गरेको' },
  { key: 'substance', weight: 3, label_en: 'Alcohol/substance use increase', label_ne: 'मदिरा वा लागुपदार्थ सेवन बढेको' },
  { key: 'self_harm', weight: 5, label_en: 'Self-harm indicators', label_ne: 'आत्मघाती संकेत' },
] as const;

export const RESPONSE_OPTIONS = [
  { value: 0, label_en: 'Not observed', label_ne: 'देखिएन' },
  { value: 1, label_en: 'Mild / sometimes', label_ne: 'हल्का' },
  { value: 2, label_en: 'Significant / often', label_ne: 'ठूलो' },
  { value: 3, label_en: 'Severe / persistent', label_ne: 'गम्भीर' },
] as const;

export const EMPTY_RESPONSES: SignalResponses = {
  sleep: 0,
  appetite: 0,
  withdrawal: 0,
  trauma: 0,
  activities: 0,
  hopelessness: 0,
  substance: 0,
  self_harm: 0,
};

export const RISK_CONFIG: Record<RiskLevel, {
  color: string;
  textColor: string;
  borderColor: string;
  hex: string;
  label_en: string;
  label_ne: string;
  range: string;
}> = {
  low: { color: 'bg-emerald-100', textColor: 'text-emerald-800', borderColor: 'border-emerald-300', hex: '#10b981', label_en: 'Low', label_ne: 'कम', range: '0-30' },
  moderate: { color: 'bg-amber-100', textColor: 'text-amber-800', borderColor: 'border-amber-300', hex: '#f59e0b', label_en: 'Moderate', label_ne: 'मध्यम', range: '31-60' },
  high: { color: 'bg-orange-100', textColor: 'text-orange-800', borderColor: 'border-orange-300', hex: '#f97316', label_en: 'High', label_ne: 'उच्च', range: '61-80' },
  critical: { color: 'bg-red-100', textColor: 'text-red-800', borderColor: 'border-red-300', hex: '#ef4444', label_en: 'Critical', label_ne: 'गम्भीर', range: '81-100' },
};

export const RISK_GRADIENT = {
  0: '#10b981',
  30: '#84cc16',
  50: '#eab308',
  65: '#f97316',
  80: '#ef4444',
  100: '#991b1b',
};

export const APP_COPY = {
  offline: {
    en: "You're offline - visits will sync when reconnected.",
    ne: 'तपाईं अफलाइन हुनुहुन्छ - भ्रमणहरू जडान भएपछि सिङ्क हुनेछन्।',
  },
};