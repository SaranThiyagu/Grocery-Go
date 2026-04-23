'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Loader2, Plus, Pencil, Trash2, Ruler, Search, Filter,
    Package, X, Check, ArrowLeft, AlertTriangle, Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TopNav from '@/components/admin/TopNav';

interface Category {
    id: number;
    name: string;
}

interface CategorySize {
    id: number;
    categoryId: number;
    categoryName: string;
    sizeLabel: string;
    type: string;
    createdAt: string;
}

// ── Category-specific size presets (real grocery business) ──
const CATEGORY_PRESETS: Record<string, { retail: string[]; wholesale: string[] }> = {
    Vegetables: {
        retail: ['100g', '250g', '500g', '1kg', 'per piece', 'per bunch'],
        wholesale: ['5kg', '10kg', '25kg', '50kg'],
    },
    Fruits: {
        retail: ['250g', '500g', '1kg', 'per piece', 'per dozen'],
        wholesale: ['5kg', '10kg', '20kg', '1 crate'],
    },
    Dairy: {
        retail: ['100ml', '200ml', '500ml', '1L', '100g', '200g', '500g'],
        wholesale: ['5L', '10L', '25L', '5kg', '10kg'],
    },
    Grains: {
        retail: ['500g', '1kg', '2kg', '5kg'],
        wholesale: ['10kg', '25kg', '50kg', '100kg'],
    },
    Spices: {
        retail: ['25g', '50g', '100g', '200g', '500g'],
        wholesale: ['1kg', '5kg', '10kg', '25kg'],
    },
    Snacks: {
        retail: ['25g', '50g', '100g', '200g', '400g'],
        wholesale: ['1kg', '5kg', '1 box (12pc)', '1 box (24pc)'],
    },
    Beverages: {
        retail: ['200ml', '330ml', '500ml', '1L', '2L'],
        wholesale: ['5L', '10L', '20L', '1 case (12)', '1 case (24)'],
    },
    Household: {
        retail: ['100ml', '250ml', '500ml', '1L', '1 pack', '3 pack'],
        wholesale: ['5L', '10L', '25L', '1 box (6)', '1 box (12)'],
    },
    Pulses: {
        retail: ['250g', '500g', '1kg', '2kg'],
        wholesale: ['5kg', '10kg', '25kg', '50kg'],
    },
};

// ── Extract numeric value from size label for proper sorting ──
function extractNumericValue(label: string): number {
    const normalized = label.toLowerCase().trim();
    // Handle "per piece", "per bunch", "per dozen" etc. — sort to end
    if (normalized.startsWith('per ') || normalized.includes('box') || normalized.includes('case') || normalized.includes('crate')) return 999999;

    const match = normalized.match(/^([\d.]+)\s*(kg|g|l|ml|pc|pack)/i);
    if (!match) return 999998;

    const num = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    // Normalize to base unit (grams or ml)
    switch (unit) {
        case 'kg': return num * 1000;
        case 'g': return num;
        case 'l': return num * 1000;
        case 'ml': return num;
        case 'pack': return 900000 + num;
        case 'pc': return 900000 + num;
        default: return num;
    }
}

function sortSizes(a: CategorySize, b: CategorySize): number {
    return extractNumericValue(a.sizeLabel) - extractNumericValue(b.sizeLabel);
}

// ── Detect unit system from a category's sizes ──
function detectUnitSystem(sizes: CategorySize[]): string {
    const labels = sizes.map(s => s.sizeLabel.toLowerCase());
    const hasVolume = labels.some(l => l.includes('ml') || l.includes('l'));
    const hasWeight = labels.some(l => l.includes('g') || l.includes('kg'));
    const hasPiece = labels.some(l => l.includes('piece') || l.includes('dozen') || l.includes('bunch') || l.includes('pack') || l.includes('box') || l.includes('crate'));
    const parts: string[] = [];
    if (hasWeight) parts.push('Weight');
    if (hasVolume) parts.push('Volume');
    if (hasPiece) parts.push('Count');
    return parts.join(' · ') || 'Custom';
}

export default function CategorySizesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = useState<{ email: string; displayName: string } | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [sizes, setSizes] = useState<CategorySize[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [search, setSearch] = useState('');

    // Add/Edit
    const [showForm, setShowForm] = useState(false);
    const [formCategoryId, setFormCategoryId] = useState<string>('');
    const [formSizeLabel, setFormSizeLabel] = useState('');
    const [formType, setFormType] = useState<string>('retail');
    const [saving, setSaving] = useState(false);

    // Delete
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteLabel, setDeleteLabel] = useState('');
    const [deleting, setDeleting] = useState(false);

    // Inline edit
    const [inlineEditId, setInlineEditId] = useState<number | null>(null);
    const [inlineLabel, setInlineLabel] = useState('');
    const [inlineType, setInlineType] = useState('');
    const [inlineSaving, setInlineSaving] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setCurrentUser({
                    email: user.email || '',
                    displayName: user.email?.split('@')[0] || 'Admin',
                });
            }
        });
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, sizeRes] = await Promise.all([
                fetch('/api/categories'),
                fetch('/api/category-sizes'),
            ]);
            if (catRes.ok) setCategories(await catRes.json());
            if (sizeRes.ok) setSizes(await sizeRes.json());
        } catch {
            toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    // ── Duplicate detection: sizes that appear in 3+ categories ──
    const duplicateMap = useMemo(() => {
        const labelTypeCounts: Record<string, Set<number>> = {};
        sizes.forEach(s => {
            const key = `${s.sizeLabel.toLowerCase()}__${s.type}`;
            if (!labelTypeCounts[key]) labelTypeCounts[key] = new Set();
            labelTypeCounts[key].add(s.categoryId);
        });
        const dupes: Record<string, number> = {};
        Object.entries(labelTypeCounts).forEach(([key, cats]) => {
            if (cats.size >= 3) dupes[key] = cats.size;
        });
        return dupes;
    }, [sizes]);

    const isDuplicated = (sizeLabel: string, type: string): number => {
        return duplicateMap[`${sizeLabel.toLowerCase()}__${type}`] || 0;
    };

    // ── Available presets for selected category (exclude already added) ──
    const availablePresets = useMemo(() => {
        if (!formCategoryId) return { retail: [], wholesale: [] };
        const catName = categories.find(c => c.id.toString() === formCategoryId)?.name || '';
        const presets = CATEGORY_PRESETS[catName] || { retail: [], wholesale: [] };
        const existingLabels = new Set(
            sizes
                .filter(s => s.categoryId.toString() === formCategoryId)
                .map(s => `${s.sizeLabel.toLowerCase()}__${s.type}`)
        );
        return {
            retail: presets.retail.filter(p => !existingLabels.has(`${p.toLowerCase()}__retail`)),
            wholesale: presets.wholesale.filter(p => !existingLabels.has(`${p.toLowerCase()}__wholesale`)),
        };
    }, [formCategoryId, categories, sizes]);

    const handleAdd = async () => {
        if (!formCategoryId || !formSizeLabel.trim() || !formType) return;
        setSaving(true);
        try {
            const res = await fetch('/api/category-sizes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoryId: parseInt(formCategoryId),
                    sizeLabel: formSizeLabel.trim(),
                    type: formType,
                }),
            });
            if (res.ok) {
                toast({ title: 'Success', description: 'Size added successfully' });
                setFormSizeLabel('');
                fetchData();
            } else {
                const err = await res.json();
                toast({ title: 'Error', description: err.error || 'Failed to add size', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to add size', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handlePresetClick = async (label: string) => {
        if (!formCategoryId) return;
        setSaving(true);
        try {
            const res = await fetch('/api/category-sizes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoryId: parseInt(formCategoryId),
                    sizeLabel: label,
                    type: formType,
                }),
            });
            if (res.ok) {
                toast({ title: 'Added', description: `"${label}" added as ${formType}` });
                fetchData();
            } else {
                const err = await res.json();
                toast({ title: 'Error', description: err.error || 'Already exists', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to add size', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleInlineSave = async () => {
        if (!inlineEditId || !inlineLabel.trim()) return;
        setInlineSaving(true);
        try {
            const res = await fetch('/api/category-sizes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: inlineEditId, sizeLabel: inlineLabel.trim(), type: inlineType }),
            });
            if (res.ok) {
                toast({ title: 'Success', description: 'Size updated' });
                setInlineEditId(null);
                fetchData();
            } else {
                const err = await res.json();
                toast({ title: 'Error', description: err.error || 'Failed to update', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
        } finally {
            setInlineSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/category-sizes?id=${deleteId}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: 'Deleted', description: `"${deleteLabel}" removed` });
                fetchData();
            } else {
                const err = await res.json();
                toast({ title: 'Error', description: err.error || 'Failed to delete', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
        } finally {
            setDeleting(false);
            setDeleteId(null);
            setDeleteLabel('');
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setFormCategoryId('');
        setFormSizeLabel('');
        setFormType('retail');
    };

    const startInlineEdit = (size: CategorySize) => {
        setInlineEditId(size.id);
        setInlineLabel(size.sizeLabel);
        setInlineType(size.type);
    };

    // Filtered data
    const filtered = sizes.filter(s => {
        if (filterCategory !== 'all' && s.categoryId.toString() !== filterCategory) return false;
        if (filterType !== 'all' && s.type !== filterType) return false;
        if (search && !s.sizeLabel.toLowerCase().includes(search.toLowerCase()) && !s.categoryName.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    // Group by category
    const grouped: Record<string, CategorySize[]> = {};
    filtered.forEach(s => {
        const key = s.categoryName;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(s);
    });

    // Stats
    const totalSizes = sizes.length;
    const retailCount = sizes.filter(s => s.type === 'retail').length;
    const wholesaleCount = sizes.filter(s => s.type === 'wholesale').length;
    const categoriesWithSizes = new Set(sizes.map(s => s.categoryId)).size;
    const duplicatedCount = Object.keys(duplicateMap).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC]">
                <TopNav currentUser={currentUser} />
                <div className="flex items-center justify-center py-32">
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                                <Ruler className="h-4 w-4 text-white" />
                            </div>
                            <div className="absolute inset-0 rounded-2xl bg-indigo-500 animate-ping opacity-15" />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-slate-300 animate-bounce [animation-delay:0ms]" />
                            <div className="w-1 h-1 rounded-full bg-slate-300 animate-bounce [animation-delay:150ms]" />
                            <div className="w-1 h-1 rounded-full bg-slate-300 animate-bounce [animation-delay:300ms]" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentPresets = formType === 'retail' ? availablePresets.retail : availablePresets.wholesale;

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <TopNav currentUser={currentUser} />

            <main className="max-w-[1200px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/admin/products')}
                            className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200/60 transition-all text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div>
                            <h1 className="text-[22px] font-bold text-slate-900 tracking-[-0.02em]">
                                Category Sizes
                            </h1>
                            <p className="text-[13px] text-slate-400 mt-0.5">
                                Manage size options for each product category
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowForm(true)}
                        className="h-9 px-4 text-[12px] font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/25 rounded-xl cursor-pointer gap-1.5"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Size
                    </Button>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/80 p-4">
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center">
                                <Ruler className="h-3.5 w-3.5 text-indigo-600" />
                            </div>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Total Sizes</span>
                        </div>
                        <p className="text-[24px] font-bold text-slate-900 tracking-tight">{totalSizes}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/80 p-4">
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                                <Package className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Retail</span>
                        </div>
                        <p className="text-[24px] font-bold text-slate-900 tracking-tight">{retailCount}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/80 p-4">
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                                <Package className="h-3.5 w-3.5 text-amber-600" />
                            </div>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Wholesale</span>
                        </div>
                        <p className="text-[24px] font-bold text-slate-900 tracking-tight">{wholesaleCount}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/80 p-4">
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                                <Filter className="h-3.5 w-3.5 text-emerald-600" />
                            </div>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Categories</span>
                        </div>
                        <p className="text-[24px] font-bold text-slate-900 tracking-tight">{categoriesWithSizes}</p>
                    </div>
                </div>

                {/* Duplicate Warning Banner */}
                {duplicatedCount > 0 && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200/80 rounded-2xl px-5 py-3.5 mb-6">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-[13px] font-semibold text-amber-800">
                                {duplicatedCount} size{duplicatedCount > 1 ? 's are' : ' is'} duplicated across 3+ categories
                            </p>
                            <p className="text-[11px] text-amber-600 mt-0.5">
                                e.g. &quot;500g retail&quot; in Vegetables, Fruits &amp; Pulses. Consider using category-specific sizes like &quot;per piece&quot;, &quot;per bunch&quot;, volume units (ml/L) for liquids.
                            </p>
                        </div>
                    </div>
                )}

                {/* Add Form Panel */}
                {showForm && (
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/80 p-6 mb-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-[14px] font-semibold text-slate-900">Add New Size</h2>
                            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[12px] font-semibold text-slate-600 uppercase tracking-[0.04em]">
                                    Category <span className="text-red-400">*</span>
                                </Label>
                                <Select value={formCategoryId} onValueChange={v => { setFormCategoryId(v); setFormSizeLabel(''); }}>
                                    <SelectTrigger className="h-10 text-[13px] bg-slate-50/50 border-slate-200/80 rounded-xl">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()} className="text-[13px]">{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[12px] font-semibold text-slate-600 uppercase tracking-[0.04em]">
                                    Size Label <span className="text-red-400">*</span>
                                </Label>
                                <Input
                                    value={formSizeLabel}
                                    onChange={e => setFormSizeLabel(e.target.value)}
                                    placeholder="e.g. 500g, 1L, per piece"
                                    className="h-10 text-[13px] bg-slate-50/50 border-slate-200/80 rounded-xl"
                                    onKeyDown={e => { if (e.key === 'Enter' && formSizeLabel.trim() && formCategoryId) handleAdd(); }}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[12px] font-semibold text-slate-600 uppercase tracking-[0.04em]">Type</Label>
                                <div className="flex gap-1.5">
                                    {['retail', 'wholesale'].map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setFormType(t)}
                                            className={`flex-1 px-3 py-2.5 rounded-xl text-[12px] font-medium border transition-all cursor-pointer capitalize ${
                                                formType === t
                                                    ? t === 'retail'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : 'bg-slate-50/50 text-slate-500 border-slate-200/80 hover:bg-slate-100/80'
                                            }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Button
                                onClick={handleAdd}
                                disabled={saving || !formCategoryId || !formSizeLabel.trim()}
                                className="h-10 text-[12px] font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-sm shadow-indigo-500/25 rounded-xl cursor-pointer"
                            >
                                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add Size'}
                            </Button>
                        </div>

                        {/* Quick-Add Presets */}
                        {formCategoryId && currentPresets.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 mb-2.5">
                                    <Zap className="h-3 w-3 text-amber-500" />
                                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.04em]">
                                        Quick Add — {categories.find(c => c.id.toString() === formCategoryId)?.name} ({formType})
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {currentPresets.map(label => (
                                        <button
                                            key={label}
                                            type="button"
                                            onClick={() => handlePresetClick(label)}
                                            disabled={saving}
                                            className="px-3 py-1.5 rounded-lg text-[11px] font-medium border border-dashed border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all cursor-pointer"
                                        >
                                            + {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {formCategoryId && currentPresets.length === 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <p className="text-[11px] text-emerald-600 flex items-center gap-1.5">
                                    <Check className="h-3 w-3" />
                                    All suggested {formType} sizes for this category are already added
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="relative flex-1 min-w-[200px] max-w-[320px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search sizes..."
                            className="h-9 pl-9 text-[13px] bg-white border-slate-200/80 rounded-xl"
                        />
                    </div>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="h-9 w-[180px] text-[12px] bg-white border-slate-200/80 rounded-xl">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-[12px]">All Categories</SelectItem>
                            {categories.map(c => (
                                <SelectItem key={c.id} value={c.id.toString()} className="text-[12px]">{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="h-9 w-[140px] text-[12px] bg-white border-slate-200/80 rounded-xl">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-[12px]">All Types</SelectItem>
                            <SelectItem value="retail" className="text-[12px]">Retail</SelectItem>
                            <SelectItem value="wholesale" className="text-[12px]">Wholesale</SelectItem>
                        </SelectContent>
                    </Select>
                    {(filterCategory !== 'all' || filterType !== 'all' || search) && (
                        <button
                            onClick={() => { setFilterCategory('all'); setFilterType('all'); setSearch(''); }}
                            className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {/* Grouped Content */}
                {Object.keys(grouped).length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                            <Ruler className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-[14px] font-medium text-slate-600 mb-1">No sizes found</p>
                        <p className="text-[12px] text-slate-400">
                            {search || filterCategory !== 'all' || filterType !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Click "Add Size" to get started'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {Object.entries(grouped).map(([categoryName, catSizes]) => {
                            const retailSizes = [...catSizes.filter(s => s.type === 'retail')].sort(sortSizes);
                            const wholesaleSizes = [...catSizes.filter(s => s.type === 'wholesale')].sort(sortSizes);
                            const unitSystem = detectUnitSystem(catSizes);

                            return (
                                <div key={categoryName} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/80 overflow-hidden">
                                    {/* Category Header */}
                                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                                                <span className="text-[11px] font-bold text-indigo-600">
                                                    {categoryName.charAt(0)}
                                                </span>
                                            </div>
                                            <h3 className="text-[13px] font-semibold text-slate-900">{categoryName}</h3>
                                            <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                                {catSizes.length} {catSizes.length === 1 ? 'size' : 'sizes'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md hidden sm:inline-flex">
                                                {unitSystem}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                            {/* Retail Column */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.06em]">
                                                        Retail ({retailSizes.length})
                                                    </span>
                                                </div>
                                                {retailSizes.length === 0 ? (
                                                    <p className="text-[11px] text-slate-400 italic pl-4">No retail sizes</p>
                                                ) : (
                                                    <div className="space-y-1.5">
                                                        {retailSizes.map(size => (
                                                            <SizeRow
                                                                key={size.id}
                                                                size={size}
                                                                isEditing={inlineEditId === size.id}
                                                                inlineLabel={inlineLabel}
                                                                inlineType={inlineType}
                                                                inlineSaving={inlineSaving}
                                                                dupeCount={isDuplicated(size.sizeLabel, size.type)}
                                                                onEdit={() => startInlineEdit(size)}
                                                                onCancelEdit={() => setInlineEditId(null)}
                                                                onSaveEdit={handleInlineSave}
                                                                onChangeLabel={setInlineLabel}
                                                                onChangeType={setInlineType}
                                                                onDelete={() => { setDeleteId(size.id); setDeleteLabel(size.sizeLabel); }}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Wholesale Column */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.06em]">
                                                        Wholesale ({wholesaleSizes.length})
                                                    </span>
                                                </div>
                                                {wholesaleSizes.length === 0 ? (
                                                    <p className="text-[11px] text-slate-400 italic pl-4">No wholesale sizes</p>
                                                ) : (
                                                    <div className="space-y-1.5">
                                                        {wholesaleSizes.map(size => (
                                                            <SizeRow
                                                                key={size.id}
                                                                size={size}
                                                                isEditing={inlineEditId === size.id}
                                                                inlineLabel={inlineLabel}
                                                                inlineType={inlineType}
                                                                inlineSaving={inlineSaving}
                                                                dupeCount={isDuplicated(size.sizeLabel, size.type)}
                                                                onEdit={() => startInlineEdit(size)}
                                                                onCancelEdit={() => setInlineEditId(null)}
                                                                onSaveEdit={handleInlineSave}
                                                                onChangeLabel={setInlineLabel}
                                                                onChangeType={setInlineType}
                                                                onDelete={() => { setDeleteId(size.id); setDeleteLabel(size.sizeLabel); }}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteId !== null} onOpenChange={() => { setDeleteId(null); setDeleteLabel(''); }}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[16px]">Delete Size</AlertDialogTitle>
                        <AlertDialogDescription className="text-[13px]">
                            Are you sure you want to delete <span className="font-semibold text-slate-700">&quot;{deleteLabel}&quot;</span>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl text-[13px] cursor-pointer">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 rounded-xl text-[13px] cursor-pointer"
                        >
                            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ── Inline Size Row Component ──
function SizeRow({
    size, isEditing, inlineLabel, inlineType, inlineSaving, dupeCount,
    onEdit, onCancelEdit, onSaveEdit, onChangeLabel, onChangeType, onDelete,
}: {
    size: CategorySize;
    isEditing: boolean;
    inlineLabel: string;
    inlineType: string;
    inlineSaving: boolean;
    dupeCount: number;
    onEdit: () => void;
    onCancelEdit: () => void;
    onSaveEdit: () => void;
    onChangeLabel: (v: string) => void;
    onChangeType: (v: string) => void;
    onDelete: () => void;
}) {
    if (isEditing) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50/50 border border-indigo-200/50">
                <Input
                    value={inlineLabel}
                    onChange={e => onChangeLabel(e.target.value)}
                    className="h-8 text-[12px] flex-1 rounded-lg bg-white border-slate-200"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') onSaveEdit(); if (e.key === 'Escape') onCancelEdit(); }}
                />
                <select
                    value={inlineType}
                    onChange={e => onChangeType(e.target.value)}
                    className="h-8 text-[11px] px-2 rounded-lg border border-slate-200 bg-white text-slate-700 cursor-pointer"
                >
                    <option value="retail">Retail</option>
                    <option value="wholesale">Wholesale</option>
                </select>
                <button
                    onClick={onSaveEdit}
                    disabled={inlineSaving}
                    className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors cursor-pointer"
                >
                    {inlineSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </button>
                <button
                    onClick={onCancelEdit}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50/80 transition-colors group">
            <div className="flex items-center gap-2.5">
                <span className={`inline-flex items-center justify-center px-2.5 h-7 rounded-lg text-[11px] font-semibold whitespace-nowrap ${
                    size.type === 'retail'
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                    {size.sizeLabel}
                </span>
                {dupeCount >= 3 && (
                    <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded font-medium" title={`This size exists in ${dupeCount} categories`}>
                        {dupeCount} cats
                    </span>
                )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onEdit}
                    className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                    <Pencil className="h-3 w-3" />
                </button>
                <button
                    onClick={onDelete}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                    <Trash2 className="h-3 w-3" />
                </button>
            </div>
        </div>
    );
}
