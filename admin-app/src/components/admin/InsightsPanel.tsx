'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Sparkles, AlertTriangle, Clock, Truck, UserCheck, RefreshCw,
    ChevronRight, Phone, ExternalLink,
} from 'lucide-react';
import { type Insight } from '@/lib/insights';

interface InsightsResponse {
    generatedAt: string;
    counts: {
        total: number;
        stuckOrder: number;
        overdueDelivery: number;
        reorderDue: number;
        dormantWholesale: number;
    };
    insights: Insight[];
}

const TYPE_ICON: Record<Insight['type'], React.ComponentType<{ className?: string }>> = {
    stuck_order: Clock,
    overdue_delivery: Truck,
    reorder_due: RefreshCw,
    dormant_wholesale: UserCheck,
};

const SEVERITY_RING: Record<Insight['severity'], string> = {
    critical: 'bg-rose-50 border-rose-200/70 text-rose-700',
    warning: 'bg-amber-50 border-amber-200/70 text-amber-700',
    info: 'bg-blue-50 border-blue-200/70 text-blue-700',
};

const SEVERITY_DOT: Record<Insight['severity'], string> = {
    critical: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
};

interface Props {
    /** Show at most this many insights inline. Default 5. */
    limit?: number;
}

export default function InsightsPanel({ limit = 5 }: Props) {
    const router = useRouter();
    const [data, setData] = useState<InsightsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dismissed, setDismissed] = useState<Set<string>>(() => {
        if (typeof window === 'undefined') return new Set();
        try {
            const raw = localStorage.getItem('insights:dismissed');
            return new Set(raw ? (JSON.parse(raw) as string[]) : []);
        } catch {
            return new Set();
        }
    });

    const load = async () => {
        try {
            const res = await fetch('/api/insights');
            if (res.ok) setData(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        load().finally(() => setLoading(false));
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const dismiss = (id: string) => {
        setDismissed(prev => {
            const next = new Set(prev);
            next.add(id);
            try { localStorage.setItem('insights:dismissed', JSON.stringify([...next])); } catch {}
            return next;
        });
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/80 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    <h2 className="text-[15px] font-semibold text-slate-900">AI Insights</h2>
                </div>
                <div className="flex items-center justify-center py-6">
                    <div className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                </div>
            </div>
        );
    }

    const visible = (data?.insights ?? []).filter(i => !dismissed.has(i.id));
    const shown = visible.slice(0, limit);
    const hiddenCount = Math.max(0, visible.length - shown.length);

    return (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/80 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-semibold text-slate-900">AI Insights</h2>
                        <p className="text-[11px] text-slate-400">
                            {visible.length === 0
                                ? 'All clear — nothing needs attention'
                                : `${visible.length} action${visible.length === 1 ? '' : 's'} suggested`}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg text-[12px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {visible.length === 0 ? (
                <div className="px-6 py-10 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                        <UserCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="text-[13px] font-medium text-slate-700">You're caught up</p>
                    <p className="text-[12px] text-slate-400 mt-0.5">No stuck orders, overdue deliveries, or dormant accounts.</p>
                </div>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {shown.map(insight => {
                        const Icon = TYPE_ICON[insight.type];
                        return (
                            <li key={insight.id} className="px-6 py-3.5 flex items-start gap-3 group hover:bg-slate-50/70 transition-colors">
                                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${SEVERITY_RING[insight.severity]}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_DOT[insight.severity]}`} />
                                        <p className="text-[13px] font-semibold text-slate-900 truncate">{insight.title}</p>
                                    </div>
                                    <p className="text-[12px] text-slate-500 truncate mt-0.5">{insight.detail}</p>
                                    <p className="text-[11px] text-slate-400 mt-1 italic">{insight.why}</p>
                                    <div className="flex items-center gap-2 mt-2.5">
                                        <button
                                            onClick={() => {
                                                if (insight.actionHref.startsWith('http')) {
                                                    window.open(insight.actionHref, '_blank', 'noopener');
                                                } else {
                                                    router.push(insight.actionHref);
                                                }
                                            }}
                                            className="h-7 px-2.5 inline-flex items-center gap-1 rounded-lg text-[11px] font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer transition-colors"
                                        >
                                            {insight.actionLabel}
                                            {insight.actionHref.startsWith('http')
                                                ? <ExternalLink className="h-3 w-3" />
                                                : <ChevronRight className="h-3 w-3" />}
                                        </button>
                                        {insight.contactPhone && (
                                            <a
                                                href={`tel:${insight.contactPhone}`}
                                                className="h-7 px-2.5 inline-flex items-center gap-1 rounded-lg text-[11px] font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                                            >
                                                <Phone className="h-3 w-3" />
                                                Call
                                            </a>
                                        )}
                                        <button
                                            onClick={() => dismiss(insight.id)}
                                            className="h-7 px-2 text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {hiddenCount > 0 && (
                <button
                    onClick={() => router.push('/admin/reports/customers')}
                    className="w-full px-6 py-3 border-t border-slate-100 flex items-center justify-center gap-1 text-[12px] font-medium text-indigo-600 hover:bg-slate-50/70 cursor-pointer transition-colors"
                >
                    View all {visible.length} insights
                    <ChevronRight className="h-3 w-3" />
                </button>
            )}

            {visible.length > 0 && data && (
                <div className="px-6 py-2 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Rule-based · No model used
                    </p>
                    <p className="text-[10px] text-slate-400 tabular-nums">
                        Updated {new Date(data.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            )}
        </div>
    );
}
