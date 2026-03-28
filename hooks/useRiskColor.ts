import { useMemo } from 'react';
import { RISK_CONFIG } from '@/lib/constants';
import { RiskLevel } from '@/lib/supabase/types';

export function useRiskColor(level: RiskLevel) {
  return useMemo(() => RISK_CONFIG[level], [level]);
}
