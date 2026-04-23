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
    icon: 'bg-indigo-50 text-indigo-600',
    sparkline: 'text-indigo-400',
    trend: 'text-emerald-600',
  },
  amber: {
    card: 'bg-white border-slate-200/60',
    icon: 'bg-orange-50 text-orange-500',
    sparkline: 'text-orange-400',
    trend: 'text-emerald-600',
  },
  blue: {
    card: 'bg-white border-slate-200/60',
    icon: 'bg-emerald-50 text-emerald-600',
    sparkline: 'text-emerald-400',
    trend: 'text-emerald-600',
  },
  emerald: {
    card: 'bg-white border-slate-200/60',
    icon: 'bg-emerald-50 text-emerald-600',
    sparkline: 'text-emerald-400',
    trend: 'text-emerald-600',
  },
  violet: {
    card: 'bg-white border-slate-200/60',
    icon: 'bg-violet-50 text-violet-600',
    sparkline: 'text-violet-400',
    trend: 'text-emerald-600',
  },
};

// Mini sparkline SVG paths for each color
const sparklines: Record<string, string> = {
  neutral: 'M0,20 Q5,18 10,15 T20,12 T30,16 T40,10 T50,8 T60,5 T70,3',
  amber: 'M0,18 Q8,20 15,16 T25,14 T35,18 T45,12 T55,8 T65,10 T70,5',
  blue: 'M0,20 Q10,17 15,15 T25,18 T35,12 T45,10 T55,6 T65,8 T70,4',
  emerald: 'M0,18 Q8,16 15,19 T25,15 T35,10 T45,12 T55,7 T65,5 T70,3',
  violet: 'M0,20 Q10,18 15,14 T25,16 T35,11 T45,9 T55,7 T65,4 T70,3',
};

export default function StatCard({ label, value, icon, color, trend }: StatCardProps) {
  const p = palette[color];

  return (
    <div className={`rounded-2xl border p-5 ${p.card} shadow-sm transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.icon}`}>
          {icon}
        </div>
        {/* Sparkline */}
        <svg width="70" height="24" viewBox="0 0 70 24" fill="none" className={p.sparkline}>
          <path d={sparklines[color]} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
      <div>
        <p className="text-[13px] text-slate-500 mb-0.5">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-[28px] font-bold tabular-nums text-slate-900 tracking-tight leading-none">{value}</p>
        </div>
        {trend && (
          <p className={`text-[12px] mt-2 ${p.trend}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
