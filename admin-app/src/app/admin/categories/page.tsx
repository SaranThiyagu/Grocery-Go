'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Pencil, Trash2, X, Check, Loader2, Layers, Package, Ruler, ArrowLeft, AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Category {
  id: number;
  name: string;
  created_at: string;
  productCount?: number;
  sizeCount?: number;
}

export default function CategoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
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

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      const [catRes, productsRes, sizesRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products'),
        fetch('/api/category-sizes'),
      ]);
      const catData = catRes.ok ? await catRes.json() : [];
      const productsData = productsRes.ok ? await productsRes.json() : [];
      const sizesData = sizesRes.ok ? await sizesRes.json() : [];

      // Count products per category
      const productCountMap: Record<number, number> = {};
      productsData.forEach((p: any) => {
        if (p.categoryId) {
          const cid = typeof p.categoryId === 'string' ? parseInt(p.categoryId) : p.categoryId;
          productCountMap[cid] = (productCountMap[cid] || 0) + 1;
        }
      });

      // Count sizes per category
      const sizeCountMap: Record<number, number> = {};
      sizesData.forEach((s: any) => {
        if (s.categoryId) {
          sizeCountMap[s.categoryId] = (sizeCountMap[s.categoryId] || 0) + 1;
        }
      });

      setCategories(catData.map((c: any) => ({
        ...c,
        productCount: productCountMap[c.id] || 0,
        sizeCount: sizeCountMap[c.id] || 0,
      })));
    } catch {
      toast({ title: 'Error', description: 'Failed to load categories', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const term = search.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(term));
  }, [categories, search]);

  const isDuplicateName = (name: string, excludeId?: number) => {
    const trimmed = name.trim().toLowerCase();
    return categories.some(c => c.name.toLowerCase() === trimmed && c.id !== excludeId);
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
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        toast({ title: 'Category created' });
        setNewName('');
        setAddError('');
        setShowAdd(false);
        fetchCategories();
      } else {
        const err = await res.json();
        if (res.status === 409) {
          setAddError(err.error);
        } else {
          toast({ title: 'Error', description: err.error, variant: 'destructive' });
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create category', variant: 'destructive' });
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
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName.trim() }),
      });
      if (res.ok) {
        toast({ title: 'Category updated' });
        setEditId(null);
        setEditError('');
        fetchCategories();
      } else {
        const err = await res.json();
        if (res.status === 409) {
          setEditError(err.error);
        } else {
          toast({ title: 'Error', description: err.error, variant: 'destructive' });
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update category', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/categories?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Category deleted' });
        setDeleteTarget(null);
        fetchCategories();
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete category', variant: 'destructive' });
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
          <h1 className="text-[22px] font-bold text-slate-900 tracking-[-0.02em]">Categories</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Manage product categories</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Layers className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-[22px] font-bold text-slate-900 leading-none">{categories.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Total Categories</p>
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
                {categories.filter(c => (c.productCount || 0) > 0).length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">With Products</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <Ruler className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="text-[22px] font-bold text-slate-900 leading-none">
                {categories.reduce((sum, c) => sum + (c.sizeCount || 0), 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Total Sizes</p>
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
              placeholder="Search categories..."
              className="w-full h-9 pl-9 pr-3 text-[13px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => { setShowAdd(true); setNewName(''); }}
            className="flex items-center gap-1.5 h-9 px-4 text-[13px] font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Category
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
                placeholder="Enter category name..."
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

        {/* Categories List */}
        <div className="divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Layers className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-[14px] font-medium text-slate-400">
                {search ? 'No categories match your search' : 'No categories yet'}
              </p>
              <p className="text-[12px] text-slate-300 mt-1">
                {!search && 'Click "Add Category" to get started'}
              </p>
            </div>
          ) : (
            filtered.map(category => (
              <div key={category.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-emerald-600">
                    {category.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  {editId === category.id ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => { setEditName(e.target.value); setEditError(''); }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleEdit(category.id);
                            if (e.key === 'Escape') { setEditId(null); setEditError(''); }
                          }}
                          autoFocus
                          className={`flex-1 h-8 px-3 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 ${
                            editError
                              ? 'border-red-300 focus:ring-red-500/30'
                              : 'border-indigo-300 focus:ring-indigo-500/30'
                          }`}
                        />
                        <button
                          onClick={() => handleEdit(category.id)}
                          disabled={saving || !editName.trim()}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => { setEditId(null); setEditError(''); }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {editError && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-red-600">
                          <AlertCircle className="h-3 w-3 flex-shrink-0" />
                          {editError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="text-[14px] font-medium text-slate-900">{category.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-[11px] text-slate-400">
                          {category.productCount || 0} product{category.productCount !== 1 ? 's' : ''}
                        </p>
                        <span className="text-[11px] text-slate-300">·</span>
                        <p className="text-[11px] text-slate-400">
                          {category.sizeCount || 0} size{category.sizeCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                {editId !== category.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditId(category.id); setEditName(category.name); }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(category)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100">
            <p className="text-[12px] text-slate-400">
              {filtered.length} categor{filtered.length !== 1 ? 'ies' : 'y'}
              {search && ` matching "${search}"`}
            </p>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {deleteTarget && ((deleteTarget.productCount || 0) > 0 || (deleteTarget.sizeCount || 0) > 0) ? (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200/60">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[13px] font-medium text-red-700">Cannot delete this category</p>
                      <p className="text-[12px] text-red-600 mt-0.5">
                        <span className="font-semibold">{deleteTarget.name}</span> is linked to{' '}
                        {(deleteTarget.productCount || 0) > 0 && (
                          <><span className="font-semibold">{deleteTarget.productCount}</span> product{deleteTarget.productCount !== 1 ? 's' : ''}</>
                        )}
                        {(deleteTarget.productCount || 0) > 0 && (deleteTarget.sizeCount || 0) > 0 && ' and '}
                        {(deleteTarget.sizeCount || 0) > 0 && (
                          <><span className="font-semibold">{deleteTarget.sizeCount}</span> size{deleteTarget.sizeCount !== 1 ? 's' : ''}</>
                        )}
                        . Remove or reassign them first.
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
            {deleteTarget && (deleteTarget.productCount || 0) === 0 && (deleteTarget.sizeCount || 0) === 0 && (
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
