import { Area, Household, Profile, SignalResponses, Visit } from '@/lib/supabase/types';
import { EMPTY_RESPONSES } from '@/lib/constants';

const now = new Date();

const isoDate = (offsetDays: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

const createdAt = (offsetDays: number) => new Date(now.getTime() + offsetDays * 86400000).toISOString();

const signalSets: Record<'low' | 'moderate' | 'high' | 'critical', SignalResponses> = {
  low: { ...EMPTY_RESPONSES, sleep: 1 },
  moderate: { ...EMPTY_RESPONSES, sleep: 2, appetite: 1, withdrawal: 1, trauma: 1, activities: 1 },
  high: { ...EMPTY_RESPONSES, sleep: 2, appetite: 2, withdrawal: 2, trauma: 2, activities: 2, hopelessness: 2 },
  critical: { ...EMPTY_RESPONSES, sleep: 3, appetite: 3, withdrawal: 3, trauma: 2, activities: 3, hopelessness: 3, substance: 2, self_harm: 1 },
};

const riskContent = {
  low: {
    level: 'low' as const,
    confidence: 80,
    explanation_en: 'Mostly stable presentation with only mild stress signs noted during the visit.',
    explanation_ne: 'Mostly stable presentation with only mild stress signs noted during the visit.',
    key_signals: ['Sleep changes'],
    notes: 'Routine monitoring visit',
  },
  moderate: {
    level: 'moderate' as const,
    confidence: 84,
    explanation_en: 'Several moderate stress signals were observed, so closer follow-up would be helpful.',
    explanation_ne: 'Several moderate stress signals were observed, so closer follow-up would be helpful.',
    key_signals: ['Sleep changes', 'Stopped daily activities'],
    notes: 'Household would benefit from follow-up this month',
  },
  high: {
    level: 'high' as const,
    confidence: 88,
    explanation_en: 'Multiple high-risk signals are clustering together, especially reduced functioning and withdrawal.',
    explanation_ne: 'Multiple high-risk signals are clustering together, especially reduced functioning and withdrawal.',
    key_signals: ['Expressed hopelessness', 'Social withdrawal'],
    notes: 'Supervisor review recommended',
  },
  critical: {
    level: 'critical' as const,
    confidence: 93,
    explanation_en: 'Immediate follow-up is needed due to severe distress indicators and possible self-harm risk.',
    explanation_ne: 'Immediate follow-up is needed due to severe distress indicators and possible self-harm risk.',
    key_signals: ['Self-harm indicators', 'Expressed hopelessness'],
    notes: 'Urgent escalation recommended',
  },
};

const areaSeeds = [
  { id: 'area-1', district: 'Sindhupalchok', ward: 3, lat: 27.9547, lng: 85.6895, name: 'Ward 3, Sindhupalchok', name_ne: 'Ward 3, Sindhupalchok' },
  { id: 'area-2', district: 'Sindhupalchok', ward: 5, lat: 27.8883, lng: 85.7117, name: 'Ward 5, Sindhupalchok', name_ne: 'Ward 5, Sindhupalchok' },
  { id: 'area-3', district: 'Kavrepalanchowk', ward: 7, lat: 27.6588, lng: 85.5384, name: 'Ward 7, Kavrepalanchowk', name_ne: 'Ward 7, Kavrepalanchowk' },
  { id: 'area-4', district: 'Kathmandu', ward: 11, lat: 27.7172, lng: 85.324, name: 'Ward 11, Kathmandu', name_ne: 'Ward 11, Kathmandu' },
  { id: 'area-5', district: 'Kaski', ward: 8, lat: 28.2096, lng: 83.9856, name: 'Ward 8, Pokhara', name_ne: 'Ward 8, Pokhara' },
  { id: 'area-6', district: 'Rupandehi', ward: 4, lat: 27.7006, lng: 83.4483, name: 'Ward 4, Butwal', name_ne: 'Ward 4, Butwal' },
  { id: 'area-7', district: 'Kailali', ward: 13, lat: 28.7014, lng: 80.5966, name: 'Ward 13, Dhangadhi', name_ne: 'Ward 13, Dhangadhi' },
  { id: 'area-8', district: 'Sunsari', ward: 6, lat: 26.812, lng: 87.2833, name: 'Ward 6, Dharan', name_ne: 'Ward 6, Dharan' },
  { id: 'area-9', district: 'Dhanusha', ward: 9, lat: 26.7288, lng: 85.925, name: 'Ward 9, Janakpur', name_ne: 'Ward 9, Janakpur' },
  { id: 'area-10', district: 'Surkhet', ward: 10, lat: 28.6019, lng: 81.6339, name: 'Ward 10, Birendranagar', name_ne: 'Ward 10, Birendranagar' },
  { id: 'area-11', district: 'Jhapa', ward: 2, lat: 26.6607, lng: 87.6849, name: 'Ward 2, Bhadrapur', name_ne: 'Ward 2, Bhadrapur' },
  { id: 'area-12', district: 'Banke', ward: 18, lat: 28.05, lng: 81.6167, name: 'Ward 18, Nepalgunj', name_ne: 'Ward 18, Nepalgunj' },
  { id: 'area-13', district: 'Mustang', ward: 2, lat: 28.7815, lng: 83.7186, name: 'Ward 2, Jomsom', name_ne: 'Ward 2, Jomsom' },
  { id: 'area-14', district: 'Kanchanpur', ward: 5, lat: 28.9633, lng: 80.1771, name: 'Ward 5, Mahendranagar', name_ne: 'Ward 5, Mahendranagar' },
  { id: 'area-15', district: 'Bara', ward: 7, lat: 27.017, lng: 84.867, name: 'Ward 7, Kalaiya', name_ne: 'Ward 7, Kalaiya' },
  { id: 'area-16', district: 'Tanahu', ward: 6, lat: 27.9767, lng: 84.2669, name: 'Ward 6, Damauli', name_ne: 'Ward 6, Damauli' },
];

export const demoAreas: Area[] = areaSeeds.map((area, index) => ({
  id: area.id,
  name: area.name,
  name_ne: area.name_ne,
  district: area.district,
  ward_number: area.ward,
  center_lat: area.lat,
  center_lng: area.lng,
  geojson_feature_id: null,
  created_at: createdAt(-(30 - index)),
}));

const profileSeeds = [
  { id: 'chw-1', email: 'chw1@demo.com', full_name: 'Sunita Rai', area_id: 'area-1' },
  { id: 'chw-2', email: 'chw2@demo.com', full_name: 'Bikram Tamang', area_id: 'area-3' },
  { id: 'chw-3', email: 'chw3@demo.com', full_name: 'Maya Gurung', area_id: 'area-5' },
  { id: 'chw-4', email: 'chw4@demo.com', full_name: 'Saraswati Karki', area_id: 'area-7' },
  { id: 'chw-5', email: 'chw5@demo.com', full_name: 'Ramesh Yadav', area_id: 'area-9' },
  { id: 'chw-6', email: 'chw6@demo.com', full_name: 'Deepa Oli', area_id: 'area-10' },
  { id: 'chw-7', email: 'chw7@demo.com', full_name: 'Arjun Chaudhary', area_id: 'area-12' },
  { id: 'chw-8', email: 'chw8@demo.com', full_name: 'Pema Lama', area_id: 'area-13' },
];

export const demoProfiles: Profile[] = [
  ...profileSeeds.map((profile, index) => ({
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    avatar_url: null,
    role: 'chw' as const,
    area_id: profile.area_id,
    created_at: createdAt(-(25 - index)),
  })),
  {
    id: 'sup-1',
    email: 'supervisor@demo.com',
    full_name: 'Dr. Rajesh Shrestha',
    avatar_url: null,
    role: 'supervisor',
    area_id: null,
    created_at: createdAt(-20),
  },
];

const householdSeeds = [
  { id: 'hh-001', code: 'HH-001', head_name: 'Hari Bahadur Tamang', area_id: 'area-1', chw: 'chw-1', score: 18, level: 'low', trend: 'stable', status: 'active' },
  { id: 'hh-002', code: 'HH-002', head_name: 'Sita Devi Shrestha', area_id: 'area-1', chw: 'chw-1', score: 46, level: 'moderate', trend: 'stable', status: 'active' },
  { id: 'hh-003', code: 'HH-003', head_name: 'Bishnu Prasad Poudel', area_id: 'area-2', chw: 'chw-1', score: 79, level: 'high', trend: 'worsening', status: 'active' },
  { id: 'hh-004', code: 'HH-004', head_name: 'Kamala Lama', area_id: 'area-3', chw: 'chw-2', score: 41, level: 'moderate', trend: 'improving', status: 'active' },
  { id: 'hh-005', code: 'HH-005', head_name: 'Gita Karki', area_id: 'area-3', chw: 'chw-2', score: 68, level: 'high', trend: 'worsening', status: 'reviewed' },
  { id: 'hh-006', code: 'HH-006', head_name: 'Suman Maharjan', area_id: 'area-4', chw: 'chw-2', score: 34, level: 'moderate', trend: 'stable', status: 'active' },
  { id: 'hh-007', code: 'HH-007', head_name: 'Nirmala Gurung', area_id: 'area-5', chw: 'chw-3', score: 72, level: 'high', trend: 'stable', status: 'active' },
  { id: 'hh-008', code: 'HH-008', head_name: 'Tek Bahadur BK', area_id: 'area-5', chw: 'chw-3', score: 89, level: 'critical', trend: 'worsening', status: 'referred' },
  { id: 'hh-009', code: 'HH-009', head_name: 'Pushpa Thapa', area_id: 'area-6', chw: 'chw-3', score: 27, level: 'low', trend: 'improving', status: 'active' },
  { id: 'hh-010', code: 'HH-010', head_name: 'Laxmi Chaudhary', area_id: 'area-7', chw: 'chw-4', score: 61, level: 'high', trend: 'worsening', status: 'active' },
  { id: 'hh-011', code: 'HH-011', head_name: 'Mohan Bista', area_id: 'area-7', chw: 'chw-4', score: 23, level: 'low', trend: 'stable', status: 'active' },
  { id: 'hh-012', code: 'HH-012', head_name: 'Anita Rai', area_id: 'area-8', chw: 'chw-4', score: 52, level: 'moderate', trend: 'stable', status: 'active' },
  { id: 'hh-013', code: 'HH-013', head_name: 'Ram Prasad Yadav', area_id: 'area-9', chw: 'chw-5', score: 67, level: 'high', trend: 'worsening', status: 'reviewed' },
  { id: 'hh-014', code: 'HH-014', head_name: 'Mina Devi Mandal', area_id: 'area-9', chw: 'chw-5', score: 82, level: 'critical', trend: 'worsening', status: 'active' },
  { id: 'hh-015', code: 'HH-015', head_name: 'Saraswati KC', area_id: 'area-10', chw: 'chw-6', score: 58, level: 'moderate', trend: 'improving', status: 'active' },
  { id: 'hh-016', code: 'HH-016', head_name: 'Dhan Bahadur Roka', area_id: 'area-10', chw: 'chw-6', score: 76, level: 'high', trend: 'stable', status: 'referred' },
  { id: 'hh-017', code: 'HH-017', head_name: 'Khem Raj Adhikari', area_id: 'area-11', chw: 'chw-6', score: 39, level: 'moderate', trend: 'stable', status: 'active' },
  { id: 'hh-018', code: 'HH-018', head_name: 'Parbati Oli', area_id: 'area-12', chw: 'chw-7', score: 64, level: 'high', trend: 'worsening', status: 'active' },
  { id: 'hh-019', code: 'HH-019', head_name: 'Kiran Khanal', area_id: 'area-12', chw: 'chw-7', score: 29, level: 'low', trend: 'improving', status: 'active' },
  { id: 'hh-020', code: 'HH-020', head_name: 'Pasang Sherpa', area_id: 'area-13', chw: 'chw-8', score: 47, level: 'moderate', trend: 'stable', status: 'active' },
  { id: 'hh-021', code: 'HH-021', head_name: 'Tsering Gurung', area_id: 'area-13', chw: 'chw-8', score: 69, level: 'high', trend: 'stable', status: 'active' },
  { id: 'hh-022', code: 'HH-022', head_name: 'Sabitri Bhatta', area_id: 'area-14', chw: 'chw-4', score: 36, level: 'moderate', trend: 'stable', status: 'active' },
  { id: 'hh-023', code: 'HH-023', head_name: 'Naresh Rana', area_id: 'area-14', chw: 'chw-4', score: 85, level: 'critical', trend: 'worsening', status: 'active' },
  { id: 'hh-024', code: 'HH-024', head_name: 'Shambhu Shah', area_id: 'area-15', chw: 'chw-5', score: 63, level: 'high', trend: 'worsening', status: 'active' },
  { id: 'hh-025', code: 'HH-025', head_name: 'Rita Devi', area_id: 'area-15', chw: 'chw-5', score: 33, level: 'moderate', trend: 'improving', status: 'reviewed' },
  { id: 'hh-026', code: 'HH-026', head_name: 'Hemanta Poudel', area_id: 'area-16', chw: 'chw-3', score: 54, level: 'moderate', trend: 'stable', status: 'active' },
  { id: 'hh-027', code: 'HH-027', head_name: 'Sabina Ale', area_id: 'area-16', chw: 'chw-3', score: 71, level: 'high', trend: 'worsening', status: 'active' },
  { id: 'hh-028', code: 'HH-028', head_name: 'Bimala Shahi', area_id: 'area-6', chw: 'chw-7', score: 21, level: 'low', trend: 'stable', status: 'active' },
] as const;

export const demoHouseholds: Household[] = householdSeeds.map((household, index) => ({
  id: household.id,
  code: household.code,
  head_name: household.head_name,
  area_id: household.area_id,
  assigned_chw_id: household.chw,
  latest_risk_score: household.score,
  latest_risk_level: household.level,
  risk_trend: household.trend as Household['risk_trend'],
  status: household.status as Household['status'],
  created_at: createdAt(-(18 - index)),
}));

export const demoVisits: Visit[] = demoHouseholds.flatMap((household, index) => {
  const riskTier = household.latest_risk_level;
  const content = riskContent[riskTier];
  const responses = signalSets[riskTier];
  const previousScore = Math.max(8, household.latest_risk_score - (household.risk_trend === 'worsening' ? 8 : household.risk_trend === 'improving' ? -6 : 2));
  const previousLevel = previousScore <= 30 ? 'low' : previousScore <= 60 ? 'moderate' : previousScore <= 80 ? 'high' : 'critical';

  return [
    {
      id: `visit-${index + 1}-a`,
      household_id: household.id,
      chw_id: household.assigned_chw_id,
      visit_date: isoDate(-(28 - (index % 6))),
      responses: signalSets[previousLevel],
      total_score: previousScore,
      risk_level: previousLevel,
      confidence: Math.max(72, content.confidence - 6),
      explanation_en: `Previous screening baseline for ${household.code}. Monitoring was continued based on earlier observations.`,
      explanation_ne: `Previous screening baseline for ${household.code}. Monitoring was continued based on earlier observations.`,
      key_signals: riskContent[previousLevel].key_signals,
      notes: 'Baseline household follow-up',
      scoring_method: 'fallback',
      created_at: createdAt(-(28 - (index % 6))),
    },
    {
      id: `visit-${index + 1}-b`,
      household_id: household.id,
      chw_id: household.assigned_chw_id,
      visit_date: isoDate(-(10 - (index % 5))),
      responses,
      total_score: household.latest_risk_score,
      risk_level: household.latest_risk_level,
      confidence: content.confidence,
      explanation_en: content.explanation_en,
      explanation_ne: content.explanation_ne,
      key_signals: content.key_signals,
      notes: content.notes,
      scoring_method: household.latest_risk_level === 'low' ? 'fallback' : 'llm',
      created_at: createdAt(-(10 - (index % 5))),
    },
  ];
});
