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
  moderate: { ...EMPTY_RESPONSES, sleep: 2, appetite: 1, activities: 1, withdrawal: 1, trauma: 1 },
  high: { ...EMPTY_RESPONSES, sleep: 2, appetite: 2, activities: 2, hopelessness: 2, withdrawal: 2, trauma: 2, fear: 1, substance: 1 },
  critical: { ...EMPTY_RESPONSES, sleep: 3, appetite: 3, activities: 3, hopelessness: 3, withdrawal: 3, trauma: 2, fear: 2, psychosis: 2, substance: 2, family_neglect: 2, self_harm: 1, wish_to_die: 1 },
};

const areaSeeds = [
  { id: 'area-1', name: 'Ward 3, Sindhupalchok', district: 'Sindhupalchok', ward: 3, lat: 27.9547, lng: 85.6895 },
  { id: 'area-2', name: 'Ward 5, Sindhupalchok', district: 'Sindhupalchok', ward: 5, lat: 27.8883, lng: 85.7117 },
  { id: 'area-3', name: 'Ward 7, Kavrepalanchowk', district: 'Kavrepalanchowk', ward: 7, lat: 27.6588, lng: 85.5384 },
  { id: 'area-4', name: 'Ward 11, Kathmandu', district: 'Kathmandu', ward: 11, lat: 27.7172, lng: 85.324 },
  { id: 'area-5', name: 'Ward 8, Pokhara', district: 'Kaski', ward: 8, lat: 28.2096, lng: 83.9856 },
  { id: 'area-6', name: 'Ward 4, Butwal', district: 'Rupandehi', ward: 4, lat: 27.7006, lng: 83.4483 },
  { id: 'area-7', name: 'Ward 13, Dhangadhi', district: 'Kailali', ward: 13, lat: 28.7014, lng: 80.5966 },
  { id: 'area-8', name: 'Ward 6, Dharan', district: 'Sunsari', ward: 6, lat: 26.812, lng: 87.2833 },
  { id: 'area-9', name: 'Ward 9, Janakpur', district: 'Dhanusha', ward: 9, lat: 26.7288, lng: 85.925 },
  { id: 'area-10', name: 'Ward 10, Birendranagar', district: 'Surkhet', ward: 10, lat: 28.6019, lng: 81.6339 },
  { id: 'area-11', name: 'Ward 2, Bhadrapur', district: 'Jhapa', ward: 2, lat: 26.6607, lng: 87.6849 },
  { id: 'area-12', name: 'Ward 18, Nepalgunj', district: 'Banke', ward: 18, lat: 28.05, lng: 81.6167 },
] as const;

export const demoAreas: Area[] = areaSeeds.map((area, index) => ({
  id: area.id,
  name: area.name,
  name_ne: area.name,
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
] as const;

export const demoProfiles: Profile[] = [
  ...profileSeeds.map((profile, index) => ({
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    avatar_url: null,
    role: 'chw' as const,
    area_id: profile.area_id,
    created_at: createdAt(-(22 - index)),
  })),
  {
    id: 'sup-1',
    email: 'supervisor@demo.com',
    full_name: 'Dr. Rajesh Shrestha',
    avatar_url: null,
    role: 'supervisor',
    area_id: null,
    created_at: createdAt(-18),
  },
];

const householdSeeds = [
  { id: 'hh-001', code: 'HH-001', head_name: 'Hari Bahadur Tamang', area_id: 'area-1', chw: 'chw-1', score: 18, level: 'low', trend: 'stable', status: 'active' },
  { id: 'hh-002', code: 'HH-002', head_name: 'Sita Devi Shrestha', area_id: 'area-1', chw: 'chw-1', score: 43, level: 'moderate', trend: 'stable', status: 'active' },
  { id: 'hh-003', code: 'HH-003', head_name: 'Bishnu Poudel', area_id: 'area-2', chw: 'chw-1', score: 77, level: 'high', trend: 'worsening', status: 'active' },
  { id: 'hh-004', code: 'HH-004', head_name: 'Kamala Lama', area_id: 'area-3', chw: 'chw-2', score: 51, level: 'high', trend: 'stable', status: 'reviewed' },
  { id: 'hh-005', code: 'HH-005', head_name: 'Suman Maharjan', area_id: 'area-4', chw: 'chw-2', score: 36, level: 'moderate', trend: 'improving', status: 'active' },
  { id: 'hh-006', code: 'HH-006', head_name: 'Nirmala Gurung', area_id: 'area-5', chw: 'chw-3', score: 82, level: 'critical', trend: 'worsening', status: 'referred' },
  { id: 'hh-007', code: 'HH-007', head_name: 'Tek Bahadur BK', area_id: 'area-5', chw: 'chw-3', score: 68, level: 'high', trend: 'stable', status: 'active' },
  { id: 'hh-008', code: 'HH-008', head_name: 'Pushpa Thapa', area_id: 'area-6', chw: 'chw-3', score: 24, level: 'low', trend: 'improving', status: 'active' },
  { id: 'hh-009', code: 'HH-009', head_name: 'Laxmi Chaudhary', area_id: 'area-7', chw: 'chw-4', score: 59, level: 'high', trend: 'worsening', status: 'active' },
  { id: 'hh-010', code: 'HH-010', head_name: 'Mohan Bista', area_id: 'area-7', chw: 'chw-4', score: 21, level: 'low', trend: 'stable', status: 'active' },
  { id: 'hh-011', code: 'HH-011', head_name: 'Anita Rai', area_id: 'area-8', chw: 'chw-4', score: 42, level: 'moderate', trend: 'stable', status: 'active' },
  { id: 'hh-012', code: 'HH-012', head_name: 'Ram Prasad Yadav', area_id: 'area-9', chw: 'chw-5', score: 73, level: 'high', trend: 'worsening', status: 'reviewed' },
  { id: 'hh-013', code: 'HH-013', head_name: 'Mina Devi Mandal', area_id: 'area-9', chw: 'chw-5', score: 91, level: 'critical', trend: 'worsening', status: 'active' },
  { id: 'hh-014', code: 'HH-014', head_name: 'Saraswati KC', area_id: 'area-10', chw: 'chw-6', score: 48, level: 'moderate', trend: 'improving', status: 'active' },
  { id: 'hh-015', code: 'HH-015', head_name: 'Dhan Bahadur Roka', area_id: 'area-10', chw: 'chw-6', score: 71, level: 'high', trend: 'stable', status: 'referred' },
  { id: 'hh-016', code: 'HH-016', head_name: 'Khem Raj Adhikari', area_id: 'area-11', chw: 'chw-6', score: 32, level: 'moderate', trend: 'stable', status: 'active' },
  { id: 'hh-017', code: 'HH-017', head_name: 'Parbati Oli', area_id: 'area-12', chw: 'chw-6', score: 63, level: 'high', trend: 'worsening', status: 'active' },
  { id: 'hh-018', code: 'HH-018', head_name: 'Kiran Khanal', area_id: 'area-12', chw: 'chw-6', score: 28, level: 'moderate', trend: 'improving', status: 'active' },
] as const;

export const demoHouseholds: Household[] = householdSeeds.map((household, index) => ({
  id: household.id,
  code: household.code,
  head_name: household.head_name,
  area_id: household.area_id,
  assigned_chw_id: household.chw,
  latest_risk_score: household.score,
  latest_risk_level: household.level,
  risk_trend: household.trend,
  status: household.status,
  created_at: createdAt(-(18 - index)),
}));

function previousScore(score: number, trend: Household['risk_trend']) {
  if (trend === 'worsening') return Math.max(8, score - 10);
  if (trend === 'improving') return Math.min(100, score + 8);
  return Math.max(8, score - 3);
}

function scoreToLevel(score: number): Visit['risk_level'] {
  if (score <= 24) return 'low';
  if (score <= 49) return 'moderate';
  if (score <= 74) return 'high';
  return 'critical';
}

export const demoVisits: Visit[] = demoHouseholds.flatMap((household, index) => {
  const baselineScore = previousScore(household.latest_risk_score, household.risk_trend);
  const baselineLevel = scoreToLevel(baselineScore);

  return [
    {
      id: 
        'visit-' + (index + 1) + '-a',
      household_id: household.id,
      chw_id: household.assigned_chw_id,
      visit_date: isoDate(-(28 - (index % 5))),
      responses: signalSets[baselineLevel],
      total_score: baselineScore,
      risk_level: baselineLevel,
      confidence: 72,
      explanation_en: 'Previous household screening used as a baseline for trend tracking.',
      explanation_ne: 'Previous household screening used as a baseline for trend tracking.',
      key_signals: baselineLevel === 'low' ? ['Sleep changes'] : baselineLevel === 'moderate' ? ['Sleep changes', 'Stopped daily activities'] : ['Hopelessness or sadness', 'Social withdrawal'],
      recommended_action: baselineLevel === 'critical' ? 'urgent_escalation' : baselineLevel === 'high' ? 'refer_health_post' : 'monitor',
      notes: 'Baseline visit for trend tracking',
      scoring_method: 'fallback',
      created_at: createdAt(-(28 - (index % 5))),
    },
    {
      id: 'visit-' + (index + 1) + '-b',
      household_id: household.id,
      chw_id: household.assigned_chw_id,
      visit_date: isoDate(-(9 - (index % 4))),
      responses: signalSets[household.latest_risk_level],
      total_score: household.latest_risk_score,
      risk_level: household.latest_risk_level,
      confidence: household.latest_risk_level === 'low' ? 75 : 82,
      explanation_en: household.latest_risk_level === 'critical' ? 'Immediate follow-up is needed because severe warning signs were observed during the latest household visit.' : household.latest_risk_level === 'high' ? 'The latest visit showed multiple serious warning signs and the household should be followed closely.' : household.latest_risk_level === 'moderate' ? 'The latest visit showed moderate warning signs and closer monitoring is recommended.' : 'The latest visit showed only mild warning signs and routine monitoring should continue.',
      explanation_ne: household.latest_risk_level === 'critical' ? 'Immediate follow-up is needed because severe warning signs were observed during the latest household visit.' : household.latest_risk_level === 'high' ? 'The latest visit showed multiple serious warning signs and the household should be followed closely.' : household.latest_risk_level === 'moderate' ? 'The latest visit showed moderate warning signs and closer monitoring is recommended.' : 'The latest visit showed only mild warning signs and routine monitoring should continue.',
      key_signals: household.latest_risk_level === 'low' ? ['Sleep changes'] : household.latest_risk_level === 'moderate' ? ['Sleep changes', 'Stopped daily activities'] : household.latest_risk_level === 'critical' ? ['Self-harm indicators', 'Wish to die'] : ['Hopelessness or sadness', 'Social withdrawal'],
      recommended_action: household.latest_risk_level === 'critical' ? 'urgent_escalation' : household.latest_risk_level === 'high' ? 'refer_health_post' : 'monitor',
      notes: household.latest_risk_level === 'critical' ? 'Urgent escalation recommended' : 'Routine follow-up recorded',
      scoring_method: 'fallback',
      created_at: createdAt(-(9 - (index % 4))),
    },
  ];
});
