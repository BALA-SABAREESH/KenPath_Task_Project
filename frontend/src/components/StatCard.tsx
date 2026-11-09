import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number | null;
  unit?: string;
  subtext?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'highlight' | 'warning';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit = 'mg/dl',
  subtext,
  icon,
  variant = 'default',
}) => {
  const getBorderColor = () => {
    switch (variant) {
      case 'highlight':
        return 'border-purple-200 bg-purple-50/40';
      case 'warning':
        return 'border-rose-200 bg-rose-50/40';
      default:
        return 'border-slate-200/80 bg-white';
    }
  };

  return (
    <div className={`p-5 rounded-2xl border ${getBorderColor()} shadow-xs transition-shadow hover:shadow-sm`}>
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <span className="text-xs font-medium tracking-wide uppercase text-slate-500">{label}</span>
        {icon && <div className="text-purple-600">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
          {value !== null && value !== undefined ? value : '—'}
        </span>
        {value !== null && value !== undefined && unit && (
          <span className="text-xs font-medium text-slate-400">{unit}</span>
        )}
      </div>
      {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
    </div>
  );
};
