import { Area, Household, Profile, SignalResponses, Visit } from '@/lib/supabase/types';
import { EMPTY_RESPONSES } from '@/lib/constants';

const now = new Date();
const isoDate = (offsetDays: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

export const demoAreas: Area[] = [
  { id: 'area-1', name: 'Ward 3, Sindhupalchok', name_ne: 'वडा ३, सिन्धुपाल्चोक', district: 'Sindhupalchok', ward_number: 3, center_lat: 27.9547, center_lng: 85.6895, geojson_feature_id: null, created_at: now.toISOString() },
  { id: 'area-2', name: 'Ward 5, Sindhupalchok', name_ne: 'वडा ५, सिन्धुपाल्चोक', district: 'Sindhupalchok', ward_number: 5, center_lat: 27.8883, center_lng: 85.7117, geojson_feature_id: null, created_at: now.toISOString() },
  { id: 'area-3', name: 'Ward 7, Kavrepalanchok', name_ne: 'वडा ७, काभ्रेपलाञ्चोक', district: 'Kavrepalanchok', ward_number: 7, center_lat: 27.6588, center_lng: 85.5384, geojson_feature_id: null, created_at: now.toISOString() },
];

export const demoProfiles: Profile[] = [
  { id: 'chw-1', email: 'chw1@demo.com', full_name: 'Sunita Rai', avatar_url: null, role: 'chw', area_id: 'area-1', created_at: now.toISOString() },
  { id: 'chw-2', email: 'chw2@demo.com', full_name: 'Bikram Tamang', avatar_url: null, role: 'chw', area_id: 'area-2', created_at: now.toISOString() },
  { id: 'chw-3', email: 'chw3@demo.com', full_name: 'Maya Gurung', avatar_url: null, role: 'chw', area_id: 'area-3', created_at: now.toISOString() },
  { id: 'sup-1', email: 'supervisor@demo.com', full_name: 'Dr. Rajesh Shrestha', avatar_url: null, role: 'supervisor', area_id: null, created_at: now.toISOString() },
];

export const demoHouseholds: Household[] = [
  { id: 'hh-1', code: 'HH-001', head_name: 'Hari Bahadur Tamang', area_id: 'area-1', assigned_chw_id: 'chw-1', latest_risk_score: 12, latest_risk_level: 'low', risk_trend: 'stable', status: 'active', created_at: now.toISOString() },
  { id: 'hh-2', code: 'HH-002', head_name: 'Sita Devi Shrestha', area_id: 'area-1', assigned_chw_id: 'chw-1', latest_risk_score: 45, latest_risk_level: 'moderate', risk_trend: 'stable', status: 'active', created_at: now.toISOString() },
  { id: 'hh-3', code: 'HH-005', head_name: 'Bishnu Prasad Poudel', area_id: 'area-1', assigned_chw_id: 'chw-1', latest_risk_score: 78, latest_risk_level: 'high', risk_trend: 'worsening', status: 'active', created_at: now.toISOString() },
  { id: 'hh-4', code: 'HH-008', head_name: 'Gita Kumari Karki', area_id: 'area-2', assigned_chw_id: 'chw-2', latest_risk_score: 88, latest_risk_level: 'critical', risk_trend: 'worsening', status: 'active', created_at: now.toISOString() },
  { id: 'hh-5', code: 'HH-009', head_name: 'Mohan Lal Chaudhary', area_id: 'area-2', assigned_chw_id: 'chw-2', latest_risk_score: 31, latest_risk_level: 'moderate', risk_trend: 'stable', status: 'active', created_at: now.toISOString() },
  { id: 'hh-6', code: 'HH-011', head_name: 'Raju Tamang', area_id: 'area-3', assigned_chw_id: 'chw-3', latest_risk_score: 64, latest_risk_level: 'high', risk_trend: 'stable', status: 'referred', created_at: now.toISOString() },
  { id: 'hh-7', code: 'HH-015', head_name: 'Tika Ram Shrestha', area_id: 'area-3', assigned_chw_id: 'chw-3', latest_risk_score: 73, latest_risk_level: 'high', risk_trend: 'improving', status: 'active', created_at: now.toISOString() },
];

const signalSets: SignalResponses[] = [
  EMPTY_RESPONSES,
  { ...EMPTY_RESPONSES, sleep: 2, appetite: 1, withdrawal: 1, trauma: 1, activities: 1 },
  { ...EMPTY_RESPONSES, sleep: 2, appetite: 2, withdrawal: 2, trauma: 2, activities: 2, hopelessness: 2 },
  { ...EMPTY_RESPONSES, sleep: 3, appetite: 3, withdrawal: 3, trauma: 2, activities: 3, hopelessness: 3, substance: 2, self_harm: 1 },
];

export const demoVisits: Visit[] = [
  { id: 'visit-1', household_id: 'hh-1', chw_id: 'chw-1', visit_date: isoDate(-30), responses: signalSets[0], total_score: 12, risk_level: 'low', confidence: 84, explanation_en: 'Mostly stable presentation with no major risk signals observed.', explanation_ne: 'कुनै प्रमुख जोखिम संकेतहरू देखिएनन्।', key_signals: ['Sleep changes'], notes: 'Routine follow-up', scoring_method: 'fallback', created_at: new Date(now.getTime() - 30 * 86400000).toISOString() },
  { id: 'visit-2', household_id: 'hh-2', chw_id: 'chw-1', visit_date: isoDate(-10), responses: signalSets[1], total_score: 45, risk_level: 'moderate', confidence: 83, explanation_en: 'Sleep and activity disruption were observed, suggesting the household may benefit from closer monitoring.', explanation_ne: 'निद्रा र दैनिक गतिविधिमा अवरोध देखियो, त्यसैले नजिकबाट निगरानी आवश्यक छ।', key_signals: ['Sleep changes', 'Stopped daily activities'], notes: 'Family stress after migration return', scoring_method: 'llm', created_at: new Date(now.getTime() - 10 * 86400000).toISOString() },
  { id: 'visit-3', household_id: 'hh-3', chw_id: 'chw-1', visit_date: isoDate(-2), responses: signalSets[2], total_score: 78, risk_level: 'high', confidence: 88, explanation_en: 'Multiple severe signals are clustering together, especially withdrawal, hopelessness, and daily functioning decline. A timely supervisor review is recommended.', explanation_ne: 'धेरै संकेतहरू एकै साथ बढेका छन्, विशेषगरी अलगाव, निराशा र दैनिक काममा गिरावट। छिटो सुपरवाइजर समीक्षा सिफारिस गरिन्छ।', key_signals: ['Expressed hopelessness', 'Social withdrawal'], notes: 'Needs family check-in this week', scoring_method: 'llm', created_at: new Date(now.getTime() - 2 * 86400000).toISOString() },
  { id: 'visit-4', household_id: 'hh-4', chw_id: 'chw-2', visit_date: isoDate(-1), responses: signalSets[3], total_score: 88, risk_level: 'critical', confidence: 92, explanation_en: 'Self-harm indicators and strong hopelessness signals were observed alongside major withdrawal and daily disruption. Immediate follow-up is needed.', explanation_ne: 'आत्मघाती संकेत, निराशा, अलगाव र दैनिक काममा ठूलो अवरोध देखियो। तुरुन्त पछ्याइ आवश्यक छ।', key_signals: ['Self-harm indicators', 'Expressed hopelessness'], notes: 'Escalate to supervisor today', scoring_method: 'llm', created_at: new Date(now.getTime() - 12 * 3600000).toISOString() },
  { id: 'visit-5', household_id: 'hh-6', chw_id: 'chw-3', visit_date: isoDate(-8), responses: signalSets[2], total_score: 64, risk_level: 'high', confidence: 86, explanation_en: 'The pattern points to sustained distress and reduced functioning, which should be reviewed at referral level.', explanation_ne: 'यो ढाँचाले लगातार संकट र कम भएको दैनिक कार्यक्षमता देखाउँछ, त्यसैले रेफरल-स्तर समीक्षा आवश्यक छ।', key_signals: ['Stopped daily activities', 'Social withdrawal'], notes: null, scoring_method: 'fallback', created_at: new Date(now.getTime() - 8 * 86400000).toISOString() },
  { id: 'visit-6', household_id: 'hh-7', chw_id: 'chw-3', visit_date: isoDate(-20), responses: signalSets[2], total_score: 73, risk_level: 'high', confidence: 82, explanation_en: 'Risk remains elevated, though recent visits show gradual improvement from earlier crisis levels.', explanation_ne: 'जोखिम अझै उच्च छ, तर अघिल्ला संकट अवस्थाबाट केही सुधार देखिएको छ।', key_signals: ['Expressed hopelessness', 'Sleep changes'], notes: 'Follow-up in two weeks', scoring_method: 'fallback', created_at: new Date(now.getTime() - 20 * 86400000).toISOString() },
];