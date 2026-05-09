'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Pencil, Trash2, X, Check, Loader2, Tag, Package, ArrowLeft,
  ChevronLeft, ChevronRight, AlertCircle, ChevronDown, ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BrandProduct {
  id: string;
  name: string;
  image: string | null;
  isActive: boolean;
  sellingMode: string;
}

interface Brand {
  id: number;
  name: string;
  created_at: string;
  productCount?: number;
  products?: BrandProduct[];
}

export default function BrandsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add / Edit state
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Expand state
  const [expandedBrand, setExpandedBrand] = useState<number | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBrands = async () => {
    try {
      const [brandsRes, productsRes] = await Promise.all([
        fetch('/api/brands'),
        fetch('/api/products'),
      ]);
      const brandsData = brandsRes.ok ? await brandsRes.json() : [];
      const productsData = productsRes.ok ? await productsRes.json() : [];

      // Count products per brand
      const countMap: Record<number, number> = {};
      const productsMap: Record<number, BrandProduct[]> = {};
      productsData.forEach((p: any) => {
        if (p.brandId) {
          const bid = typeof p.brandId === 'string' ? parseInt(p.brandId) : p.brandId;
          countMap[bid] = (countMap[bid] || 0) + 1;
          if (!productsMap[bid]) productsMap[bid] = [];
          productsMap[bid].push({
            id: p.id,
            name: p.name,
            image: p.image || null,
            isActive: p.isActive ?? true,
            sellingMode: p.sellingMode || 'both',
          });
        }
      });

      setBrands(brandsData.map((b: any) => ({
        ...b,
        productCount: countMap[b.id] || 0,
        products: productsMap[b.id] || [],
      })));
    } catch {
      toast({ title: 'Error', description: 'Failed to load brands', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBrands(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return brands;
    const term = search.toLowerCase();
    return brands.filter(b => b.name.toLowerCase().includes(term));
  }, [brands, search]);

  // Reset to page 1 when search changes
  useEffect(() => { setCurrentPage(1); }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const isDuplicateName = (name: string, excludeId?: number) => {
    const trimmed = name.trim().toLowerCase();
    return brands.some(b => b.name.toLowerCase() === trimmed && b.id !== excludeId);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAddError('');

    if (isDuplicateName(newName)) {
      setAddError(`"${newName.trim()}" already exists`);
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        toast({ title: 'Brand created' });
        setNewName('');
        setAddError('');
        setShowAdd(false);
        fetchBrands();
      } else {
        const err = await res.json();
        if (res.status === 409) {
          setAddError(err.error);
        } else {
          toast({ title: 'Error', description: err.error, variant: 'destructive' });
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create brand', variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = async (id: number) => {
    if (!editName.trim()) return;
    setEditError('');

    if (isDuplicateName(editName, id)) {
      setEditError(`"${editName.trim()}" already exists`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/brands', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName.trim() }),
      });
      if (res.ok) {
        toast({ title: 'Brand updated' });
        setEditId(null);
        setEditError('');
        fetchBrands();
      } else {
        const err = await res.json();
        if (res.status === 409) {
          setEditError(err.error);
        } else {
          toast({ title: 'Error', description: err.error, variant: 'destructive' });
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update brand', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/brands?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Brand deleted' });
        setDeleteTarget(null);
        fetchBrands();
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete brand', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-white font-bold text-[10px] tracking-tight">GG</span>
            </div>
            <div className="absolute inset-0 rounded-xl bg-indigo-500 animate-ping opacity-15" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-slate-300 animate-bounce [animation-delay:0ms]" />
            <div className="w-1 h-1 rounded-full bg-slate-300 animate-bounce [animation-delay:150ms]" />
            <div className="w-1 h-1 rounded-full bg-slate-300 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-[900px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/admin/products')}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-[22px] font-bold text-slate-900 tracking-[-0.02em]">Brands</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Manage product brands</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Tag className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-[22px] font-bold text-slate-900 leading-none">{brands.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Total Brands</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Package className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[22px] font-bold text-slate-900 leading-none">
                {brands.filter(b => (b.productCount || 0) > 0).length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">With Products</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Tag className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[22px] font-bold text-slate-900 leading-none">
                {brands.filter(b => (b.productCount || 0) === 0).length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Unused</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Add */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search brands..."
              className="w-full h-9 pl-9 pr-3 text-[13px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => { setShowAdd(true); setNewName(''); }}
            className="flex items-center gap-1.5 h-9 px-4 text-[13px] font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Brand
          </button>
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="px-5 py-4 border-b border-slate-100 bg-indigo-50/30">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newName}
                onChange={e => { setNewName(e.target.value); setAddError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Enter brand name..."
                autoFocus
                className={`flex-1 h-9 px-3 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 placeholder:text-slate-400 ${
                  addError
                    ? 'border-red-300 focus:ring-red-500/30 focus:border-red-300'
                    : 'border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-300'
                }`}
              />
              <button
                onClick={handleAdd}
                disabled={adding || !newName.trim()}
                className="flex items-center gap-1.5 h-9 px-3 text-[12px] font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save
              </button>
              <button
                onClick={() => { setShowAdd(false); setAddError(''); }}
                className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {addError && (
              <div className="flex items-center gap-1.5 mt-2 text-[12px] text-red-600">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {addError}
              </div>
            )}
          </div>
        )}

        {/* Brands List */}
        <div className="divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Tag className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-[14px] font-medium text-slate-400">
                {search ? 'No brands match your search' : 'No brands yet'}
              </p>
              <p className="text-[12px] text-slate-300 mt-1">
                {!search && 'Click "Add Brand" to get started'}
              </p>
            </div>
          ) : (
            paginated.map(brand => (
              <div key={brand.id}>
                <div className="flex items-center gap-0 pr-2 hover:bg-slate-50/50 transition-colors group">

                  {/* ── Tap entire left section to open inline edit (44px+ touch target) ── */}
                  {editId === brand.id ? (
                    /* Inline edit mode — full-width input row */
                    <div className="flex-1 min-w-0 px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-bold text-indigo-600">
                            {brand.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => { setEditName(e.target.value); setEditError(''); }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleEdit(brand.id);
                            if (e.key === 'Escape') { setEditId(null); setEditError(''); }
                          }}
                          autoFocus
                          className={`flex-1 h-9 px-3 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 ${
                            editError
                              ? 'border-red-300 focus:ring-red-500/30'
                              : 'border-indigo-300 focus:ring-indigo-500/30'
                          }`}
                        />
                        <button
                          onClick={() => handleEdit(brand.id)}
                          disabled={saving || !editName.trim()}
                          aria-label="Save brand name"
                          className="flex items-center justify-center w-10 h-9 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => { setEditId(null); setEditError(''); }}
                          aria-label="Cancel edit"
                          className="flex items-center justify-center w-9 h-9 text-slate-400 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg cursor-pointer transition-colors flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {editError && (
                        <div className="flex items-center gap-1.5 mt-1.5 ml-11 text-[11px] text-red-600">
                          <AlertCircle className="h-3 w-3 flex-shrink-0" />
                          {editError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Brand info — tap anywhere on this section to expand/collapse products */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if ((brand.productCount || 0) > 0) {
                            setExpandedBrand(expandedBrand === brand.id ? null : brand.id);
                          }
                        }}
                        aria-label={`${brand.name}, ${brand.productCount || 0} products`}
                        className="flex-1 min-w-0 flex items-center gap-4 px-5 py-3.5 text-left active:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-bold text-indigo-600">
                            {brand.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-slate-900 text-left">{brand.name}</p>
                          {(brand.productCount || 0) > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-indigo-500 font-medium mt-0.5">
                              <Package className="h-3 w-3" />
                              {brand.productCount} product{brand.productCount !== 1 ? 's' : ''}
                              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${expandedBrand === brand.id ? 'rotate-180' : ''}`} />
                            </span>
                          ) : (
                            <p className="text-[11px] text-slate-400 text-left">0 products</p>
                          )}
                        </div>
                      </button>

                      {/* Edit — contained button, 44px, indigo — parity with the delete button */}
                      <button
                        onClick={() => { setEditId(brand.id); setEditName(brand.name); }}
                        aria-label={`Edit brand ${brand.name}`}
                        className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl text-indigo-500 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 active:bg-indigo-200 transition-colors cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      {/* Delete — contained button, 44px, red — spatially separated */}
                      <button
                        onClick={() => setDeleteTarget(brand)}
                        aria-label={`Delete brand ${brand.name}`}
                        className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl text-red-400 bg-red-50 border border-red-100 hover:bg-red-100 active:bg-red-200 transition-colors ml-2 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Expanded Product List */}
                {expandedBrand === brand.id && (brand.products || []).length > 0 && (
                  <div className="mx-5 mb-3 rounded-xl border border-slate-200/60 bg-slate-50/50 overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                        Products using {brand.name}
                      </p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {(brand.products || []).map(product => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/80 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Package className="h-3.5 w-3.5 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-slate-800 truncate">{product.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${product.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              <span className="text-[10px] text-slate-400">{product.isActive ? 'Active' : 'Inactive'}</span>
                              <span className="text-[10px] text-slate-300">·</span>
                              <span className="text-[10px] text-slate-400 capitalize">{product.sellingMode}</span>
                            </div>
                          </div>
                          <a
                            href={`/admin/products/${product.id}/edit`}
                            onClick={e => e.stopPropagation()}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit product"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer with Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-100">
            <p className="text-[12px] text-slate-400">
              Showing{' '}
              <span className="font-semibold text-slate-600">
                {Math.min((currentPage - 1) * pageSize + 1, filtered.length)}
              </span>{' '}to{' '}
              <span className="font-semibold text-slate-600">
                {Math.min(currentPage * pageSize, filtered.length)}
              </span>{' '}of{' '}
              <span className="font-semibold text-slate-600">{filtered.length}</span> brand{filtered.length !== 1 ? 's' : ''}
              {search && ` matching "${search}"`}
            </p>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-slate-200"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .reduce<(number | string)[]>((acc, page, i, arr) => {
                    if (i > 0 && page - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((page, i) =>
                    page === '...' ? (
                      <span key={`e-${i}`} className="px-1 text-[11px] text-slate-300">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page as number)}
                        className={`min-w-[32px] h-8 px-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer border ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-slate-200"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="h-8 text-[12px] px-2 pr-7 rounded-lg border border-slate-200 bg-white text-slate-600 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-300"
              >
                {[10, 25, 50].map(n => (
                  <option key={n} value={n}>{n} / page</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {deleteTarget && (deleteTarget.productCount || 0) > 0 ? (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200/60">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[13px] font-medium text-red-700">Cannot delete this brand</p>
                      <p className="text-[12px] text-red-600 mt-0.5">
                        <span className="font-semibold">{deleteTarget.name}</span> is linked to{' '}
                        <span className="font-semibold">{deleteTarget.productCount}</span>{' '}
                        product{deleteTarget.productCount !== 1 ? 's' : ''}.
                        Remove or reassign the products first.
                      </p>
                    </div>
                  </div>
                ) : (
                  <span>
                    Are you sure you want to delete <span className="font-semibold">{deleteTarget?.name}</span>?
                    This action cannot be undone.
                  </span>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            {deleteTarget && (deleteTarget.productCount || 0) === 0 && (
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
