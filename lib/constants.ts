import { RecommendedAction, RiskLevel, SignalResponses } from './supabase/types';

export const SIGNALS = [
  {
    key: 'sleep',
    weight: 2,
    label_en: 'Sleep changes',
    label_ne: 'निद्रामा परिवर्तन',
    question_en: 'Has sleep changes been observed in this person?',
    question_ne: 'प्र. १: के यस व्यक्तिको निद्रामा परिवर्तन देखिएको छ?',
  },
  {
    key: 'appetite',
    weight: 2,
    label_en: 'Appetite or weight changes',
    label_ne: 'खाना वा तौलमा परिवर्तन',
    question_en: 'Have appetite or weight changes been observed?',
    question_ne: 'प्र. २: के यस व्यक्तिले खाना खान छाडेको वा वजन घटेको/बढेको देखिन्छ?',
  },
  {
    key: 'activities',
    weight: 3,
    label_en: 'Stopped daily activities',
    label_ne: 'दैनिक काम बन्द',
    question_en: 'Has this person stopped daily activities or household work?',
    question_ne: 'प्र. ३: के यस व्यक्तिले दैनिक काम वा घरको काम गर्न छाडेको छ?',
  },
  {
    key: 'hopelessness',
    weight: 4,
    label_en: 'Hopelessness or sadness',
    label_ne: 'निराशा वा उदासी',
    question_en: 'Has this person expressed hopelessness, worthlessness, or sadness?',
    question_ne: 'प्र. ४: के यस व्यक्तिले निराशा, बेकार वा उदासी व्यक्त गरेको छ?',
  },
  {
    key: 'withdrawal',
    weight: 3,
    label_en: 'Social withdrawal',
    label_ne: 'सामाजिक अलगाव',
    question_en: 'Has social withdrawal or isolation been observed in this person?',
    question_ne: 'प्र. ५: के यस व्यक्तिले सामाजिक सम्पर्क घटाएको वा घरभित्रै एक्लै बस्ने गरेको देखिन्छ?',
  },
  {
    key: 'trauma',
    weight: 3,
    label_en: 'Recent loss or trauma',
    label_ne: 'हालसालैको क्षति वा आघात',
    question_en: 'Has this person recently experienced a loss, disaster, or trauma?',
    question_ne: 'प्र. ६: के यस व्यक्तिले हालसालै कुनै क्षति, विपद, वा मानसिक आघात भोगेको छ?',
  },
  {
    key: 'fear',
    weight: 3,
    label_en: 'Fear or flashbacks',
    label_ne: 'डर वा फ्ल्यासब्याक',
    question_en: 'Have visible fear, flashbacks, or extreme startle responses been observed?',
    question_ne: 'प्र. ७: के यस व्यक्तिमा डर, भयका लक्षण, वा अचानक चम्किने प्रतिक्रिया देखिएको छ?',
  },
  {
    key: 'psychosis',
    weight: 4,
    label_en: 'Psychosis signs',
    label_ne: 'मनोविक्षिप्त संकेत',
    question_en: 'Has talking to self, strange beliefs, or confused speech been observed?',
    question_ne: 'प्र. ८: के यस व्यक्तिले आफैसँग कुरा गर्ने, अनौठो विश्वास राख्ने, वा अस्पष्ट बोली बोल्ने गरेको देखिन्छ?',
  },
  {
    key: 'substance',
    weight: 3,
    label_en: 'Substance use increase',
    label_ne: 'मदिरा वा लागुपदार्थ सेवन बढेको',
    question_en: 'Has an increase in alcohol or substance use been observed in this person?',
    question_ne: 'प्र. ९: के यस व्यक्तिको मदिरा वा लागु पदार्थ सेवन बढेको देखिन्छ?',
  },
  {
    key: 'family_neglect',
    weight: 3,
    label_en: 'Family neglect due to substance',
    label_ne: 'लागुपदार्थका कारण परिवारको हेरचाहमा कमी',
    question_en: 'Has this person been observed neglecting their family due to substance use?',
    question_ne: 'प्र. १०: के यस व्यक्तिले मदिरा वा लागु पदार्थका कारण परिवारको हेरचाह गर्न छाडेको देखिन्छ?',
  },
  {
    key: 'self_harm',
    weight: 5,
    label_en: 'Self-harm indicators',
    label_ne: 'आत्मघाती चोट वा संकेत',
    question_en: 'Has self-harm indicators been observed?',
    question_ne: 'प्र. ११: के यस व्यक्तिमा आत्मघाती चोट वा संकेतहरू देखिएका छन्?',
  },
  {
    key: 'wish_to_die',
    weight: 6,
    label_en: 'Wish to die',
    label_ne: 'मर्न चाहेको अभिव्यक्ति',
    question_en: 'Has this person expressed a wish to die or not exist?',
    question_ne: 'प्र. १२: के यस व्यक्तिले मर्न चाहेको वा जिउन नचाहेको व्यक्त गरेको छ?',
  },
] as const;

export const RESPONSE_OPTIONS = [
  { value: 0, label_en: 'Not observed', label_ne: 'देखिएन' },
  { value: 1, label_en: 'Mild / sometimes', label_ne: 'हल्का / कहिलेकाहीं' },
  { value: 2, label_en: 'Significant / often', label_ne: 'ठूलो / धेरैजसो' },
  { value: 3, label_en: 'Severe / persistent', label_ne: 'गम्भीर / लगातार' },
] as const;

export const EMPTY_RESPONSES: SignalResponses = {
  sleep: 0,
  appetite: 0,
  activities: 0,
  hopelessness: 0,
  withdrawal: 0,
  trauma: 0,
  fear: 0,
  psychosis: 0,
  substance: 0,
  family_neglect: 0,
  self_harm: 0,
  wish_to_die: 0,
};

export const MAX_WEIGHTED_SUM = SIGNALS.reduce((acc, signal) => acc + signal.weight * 3, 0);

export const RISK_CONFIG: Record<
  RiskLevel,
  {
    color: string;
    textColor: string;
    borderColor: string;
    hex: string;
    label_en: string;
    label_ne: string;
    range: string;
  }
> = {
  low: { color: 'bg-emerald-100', textColor: 'text-emerald-800', borderColor: 'border-emerald-300', hex: '#10b981', label_en: 'Low', label_ne: 'कम', range: '0-24' },
  moderate: { color: 'bg-amber-100', textColor: 'text-amber-800', borderColor: 'border-amber-300', hex: '#f59e0b', label_en: 'Moderate', label_ne: 'मध्यम', range: '25-49' },
  high: { color: 'bg-orange-100', textColor: 'text-orange-800', borderColor: 'border-orange-300', hex: '#f97316', label_en: 'High', label_ne: 'उच्च', range: '50-74' },
  critical: { color: 'bg-red-100', textColor: 'text-red-800', borderColor: 'border-red-300', hex: '#ef4444', label_en: 'Critical', label_ne: 'गम्भीर', range: '75-100' },
};

export const RISK_GRADIENT = {
  0: '#10b981',
  24: '#84cc16',
  49: '#eab308',
  74: '#f97316',
  100: '#ef4444',
};

export const RECOMMENDED_ACTION_COPY: Record<RecommendedAction, { label_en: string; label_ne: string; detail_en: string; detail_ne: string }> = {
  monitor: {
    label_en: 'Monitor at home',
    label_ne: 'घरमै निगरानी',
    detail_en: 'Continue routine follow-up and repeat the screening during the next household visit.',
    detail_ne: 'नियमित अनुगमन जारी राख्नुहोस् र अर्को घरभ्रमणमा पुनः स्क्रिनिङ गर्नुहोस्।',
  },
  refer_health_post: {
    label_en: 'Refer to nearest health post',
    label_ne: 'नजिकको स्वास्थ्य चौकीमा पठाउनुहोस्',
    detail_en: 'This person should receive a second-stage assessment at the nearest health post or clinic.',
    detail_ne: 'यस व्यक्तिले नजिकको स्वास्थ्य चौकी वा क्लिनिकमा दोस्रो चरणको मूल्यांकन लिनुपर्छ।',
  },
  urgent_escalation: {
    label_en: 'Urgent escalation',
    label_ne: 'तत्काल जोखिम सूचना',
    detail_en: 'Notify the supervisor and nearest health post immediately for urgent safety follow-up.',
    detail_ne: 'तत्काल सुरक्षा अनुगमनका लागि सुपरभाइजर र नजिकको स्वास्थ्य चौकीलाई तुरुन्त जानकारी दिनुहोस्।',
  },
};

export const APP_COPY = {
  offline: {
    en: "You're offline - visits will sync when reconnected.",
    ne: 'तपाईं अफलाइन हुनुहुन्छ - इन्टरनेट आएपछि भ्रमणहरू सिङ्क हुनेछन्।',
  },
};