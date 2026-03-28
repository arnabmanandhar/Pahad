import { RISK_CONFIG } from '@/lib/constants';
import { RiskLevel } from '@/lib/supabase/types';

interface Props {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  language?: 'en' | 'ne';
}

export function RiskBadge({ level, score, size = 'md', language = 'en' }: Props) {
  const config = RISK_CONFIG[level];
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${config.color} ${config.textColor} ${config.borderColor} ${sizeClasses}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.hex }} />
      {score !== undefined ? <span>{score}</span> : null}
      <span>{language === 'ne' ? config.label_ne : config.label_en}</span>
    </span>
  );
}
