'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    RefreshCw, UserCheck, ChevronRight, Phone, Search, Sparkles,
    Store, User as UserIcon, Download, ArrowLeft,
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

type Tab = 'all' | 'reorder_due' | 'dormant_wholesale';

const TAB_LABELS: Record<Tab, string> = {
    all: 'All',
    reorder_due: 'Reorder Due',
    dormant_wholesale: 'Dormant Wholesale',
};

export default function CustomerActionListPage() {
    const router = useRouter();
    const [data, setData] = useState<InsightsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tab, setTab] = useState<Tab>('all');
    const [search, setSearch] = useState('');

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

    // Filter insights to customer-action types only.
    const customerInsights = useMemo(() => {
        const arr = (data?.insights ?? []).filter(
            i => i.type === 'reorder_due' || i.type === 'dormant_wholesale',
        );
        const byTab = tab === 'all' ? arr : arr.filter(i => i.type === tab);
        const term = search.trim().toLowerCase();
        if (!term) return byTab;
        return byTab.filter(
            i =>
                i.title.toLowerCase().includes(term) ||
                i.detail.toLowerCase().includes(term),
        );
    }, [data, tab, search]);

    const counts = {
        all: (data?.counts.reorderDue ?? 0) + (data?.counts.dormantWholesale ?? 0),
        reorder_due: data?.counts.reorderDue ?? 0,
        dormant_wholesale: data?.counts.dormantWholesale ?? 0,
    };

    const exportCsv = () => {
        const rows = [
            ['Type', 'Customer', 'Detail', 'Why', 'Phone'],
            ...customerInsights.map(i => [
                i.type,
                i.title,
                i.detail,
                i.why,
                i.contactPhone ?? '',
            ]),
        ];
        const csv = rows
            .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `customer-action-list-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <main className="max-w-[1280px] mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <button
                    onClick={() => router.push('/admin/dashboard')}
                    className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200/60 transition-all text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-500" />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-indigo-600">Reports</span>
                    </div>
                    <h1 className="text-[26px] font-bold text-slate-900 tracking-[-0.02em]">Customer Action List</h1>
                </div>
            </div>
            <p className="text-[13px] text-slate-500 mb-6 ml-12">
                Customers who likely need a nudge today &mdash; based on their own ordering pattern. Rule-based, no model.
            </p>

            {/* Toolbar */}
            <div className="flex flex-col gap-3 mb-5">
                {/* Tabs (segmented chips) */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="inline-flex items-center bg-slate-100/80 rounded-lg p-0.5">
                        {(Object.keys(TAB_LABELS) as Tab[]).map(t => {
                            const active = tab === t;
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTab(t)}
                                    className={`h-8 px-3 text-[12px] font-medium rounded-md transition-all flex items-center gap-1.5 ${
                                        active
                                            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {TAB_LABELS[t]}
                                    <span className={`px-1.5 py-0 rounded-full text-[10px] font-semibold tabular-nums ${
                                        active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200/60 text-slate-500'
                                    }`}>
                                        {counts[t]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white text-[12px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={exportCsv}
                            disabled={customerInsights.length === 0}
                            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white text-[12px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-40 cursor-pointer"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-slate-400" />
                    <input
                        placeholder="Search customer or store..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 h-9 text-[13px] bg-slate-50/80 border border-slate-200/60 rounded-lg focus-visible:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/15 focus-visible:border-indigo-400 placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/80 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    </div>
                ) : customerInsights.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                            <UserCheck className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-[14px] font-medium text-slate-700">All caught up</p>
                        <p className="text-[12px] text-slate-400 mt-1 max-w-sm">
                            No customers match this filter. Reorder reminders activate after a customer has at least 3 historical orders.
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {customerInsights.map(insight => (
                            <ActionRow key={insight.id} insight={insight} />
                        ))}
                    </ul>
                )}

                {data && customerInsights.length > 0 && (
                    <div className="px-6 py-2 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] text-slate-400">
                            Rule-based · No model · {customerInsights.length} customer{customerInsights.length === 1 ? '' : 's'}
                        </p>
                        <p className="text-[10px] text-slate-400 tabular-nums">
                            Updated {new Date(data.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}

function ActionRow({ insight }: { insight: Insight }) {
    const router = useRouter();
    const isWholesale = insight.detail.toLowerCase().includes('wholesale');

    return (
        <li className="px-6 py-4 flex items-start gap-3.5 hover:bg-slate-50/70 transition-colors">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 ${
                isWholesale
                    ? 'from-amber-100 to-orange-100 text-amber-700'
                    : 'from-indigo-100 to-violet-100 text-indigo-600'
            }`}>
                <span className="text-[13px] font-bold">{insight.title.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-semibold text-slate-900">{insight.title}</p>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0 rounded-full text-[10px] font-semibold border ${
                        isWholesale
                            ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                            : 'bg-blue-50 text-blue-700 border-blue-200/60'
                    }`}>
                        {isWholesale ? <Store className="h-2 w-2" /> : <UserIcon className="h-2 w-2" />}
                        {isWholesale ? 'Wholesale' : 'Retail'}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0 rounded-full text-[10px] font-semibold border ${
                        insight.type === 'dormant_wholesale'
                            ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
                    }`}>
                        {insight.type === 'dormant_wholesale' ? 'Dormant' : 'Reorder'}
                    </span>
                </div>
                <p className="text-[12px] text-slate-500 mt-0.5">{insight.detail}</p>
                <p className="text-[11px] text-slate-400 mt-1 italic">{insight.why}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
                {insight.contactPhone && (
                    <a
                        href={`tel:${insight.contactPhone}`}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                        title={`Call ${insight.contactPhone}`}
                    >
                        <Phone className="h-3.5 w-3.5" />
                    </a>
                )}
                <button
                    onClick={() => {
                        if (insight.actionHref.startsWith('http')) {
                            window.open(insight.actionHref, '_blank', 'noopener');
                        } else {
                            router.push(insight.actionHref);
                        }
                    }}
                    className="h-8 px-3 inline-flex items-center gap-1 rounded-lg text-[12px] font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
                >
                    {insight.actionLabel}
                    <ChevronRight className="h-3 w-3" />
                </button>
            </div>
        </li>
    );
}
