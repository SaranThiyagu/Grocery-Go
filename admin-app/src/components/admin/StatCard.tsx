import { type ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  color: 'neutral' | 'amber' | 'blue' | 'emerald' | 'violet';
  trend?: { value: string; positive: boolean };
}

const palette = {
  neutral: {
    card: 'bg-white border-slate-200/60',
    icon: 'bg-slate-100 text-slate-500',
    glow: '',
  },
  amber: {
    card: 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/30 border-amber-200/40',
    icon: 'bg-amber-100/80 text-amber-600',
    glow: 'shadow-amber-100/40',
  },
  blue: {
    card: 'bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/30 border-indigo-200/40',
    icon: 'bg-indigo-100/80 text-indigo-600',
    glow: 'shadow-indigo-100/40',
  },
  emerald: {
    card: 'bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/30 border-emerald-200/40',
    icon: 'bg-emerald-100/80 text-emerald-600',
    glow: 'shadow-emerald-100/40',
  },
  violet: {
    card: 'bg-gradient-to-br from-violet-50/70 via-white to-purple-50/30 border-violet-200/40',
    icon: 'bg-violet-100/80 text-violet-600',
    glow: 'shadow-violet-100/40',
  },
};

export default function StatCard({ label, value, icon, color, trend }: StatCardProps) {
  const p = palette[color];

  return (
    <div className={`rounded-2xl border p-5 ${p.card} premium-shadow transition-all duration-200 hover:translate-y-[-1px] hover:shadow-md ${p.glow}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-[28px] font-bold tabular-nums text-slate-900 tracking-tight leading-none">{value}</p>
            {trend && (
              <span className={`text-[11px] font-semibold ${trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
                {trend.positive ? '↑' : '↓'} {trend.value}
              </span>
            )}
          </div>
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${p.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
