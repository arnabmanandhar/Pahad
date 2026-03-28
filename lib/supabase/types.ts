export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type HouseholdStatus = 'active' | 'reviewed' | 'referred';
export type RiskTrend = 'improving' | 'stable' | 'worsening';
export type UserRole = 'chw' | 'supervisor';
export type ScoringMethod = 'llm' | 'fallback';

export interface Area {
  id: string;
  name: string;
  name_ne: string;
  district: string;
  ward_number: number | null;
  center_lat: number;
  center_lng: number;
  geojson_feature_id: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  area_id: string | null;
  created_at: string;
}

export interface Household {
  id: string;
  code: string;
  head_name: string;
  area_id: string;
  assigned_chw_id: string;
  latest_risk_score: number;
  latest_risk_level: RiskLevel;
  risk_trend: RiskTrend;
  status: HouseholdStatus;
  created_at: string;
  area?: Area;
  chw?: Profile;
}

export interface SignalResponses {
  sleep: 0 | 1 | 2 | 3;
  appetite: 0 | 1 | 2 | 3;
  withdrawal: 0 | 1 | 2 | 3;
  trauma: 0 | 1 | 2 | 3;
  activities: 0 | 1 | 2 | 3;
  hopelessness: 0 | 1 | 2 | 3;
  substance: 0 | 1 | 2 | 3;
  self_harm: 0 | 1 | 2 | 3;
}

export interface Visit {
  id: string;
  household_id: string;
  chw_id: string;
  visit_date: string;
  responses: SignalResponses;
  total_score: number;
  risk_level: RiskLevel;
  confidence: number;
  explanation_en: string | null;
  explanation_ne: string | null;
  key_signals: string[] | null;
  notes: string | null;
  scoring_method: ScoringMethod;
  created_at: string;
  household?: Household;
  chw?: Profile;
}

export interface ScoreResponse {
  score: number;
  risk_level: RiskLevel;
  explanation_en: string;
  explanation_ne: string;
  key_signals: string[];
  confidence: number;
  scoring_method: ScoringMethod;
}

export interface Database {
  public: {
    Tables: {
      areas: {
        Row: Area;
        Insert: Omit<Area, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Area, 'id'>> & { id?: string };
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<Profile, 'id'>> & { id?: string };
        Relationships: [];
      };
      households: {
        Row: Household;
        Insert: Omit<Household, 'id' | 'created_at' | 'area' | 'chw'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Household, 'area' | 'chw'>>;
        Relationships: [];
      };
      visits: {
        Row: Visit;
        Insert: Omit<Visit, 'id' | 'created_at' | 'household' | 'chw'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Visit, 'household' | 'chw'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}