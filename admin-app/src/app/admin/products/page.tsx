'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Search,
    Package,
    ShoppingCart,
    Plus,
    IndianRupee,
    Inbox,
    Loader2,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Filter,
    X,
} from 'lucide-react';
import Image from 'next/image';
import StatCard from '@/components/admin/StatCard';

interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    image: string | null;
    category: string | null;
    categoryId: number | null;
    brand: string | null;
    brandId: number | null;
    sellingMode: string;
    retailSizes: string[];
    wholesaleSizes: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBrand, setFilterBrand] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterSellingMode, setFilterSellingMode] = useState('all');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/products');
                if (res.ok) setProducts(await res.json());
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const uniqueBrands = useMemo(() => {
        return Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort() as string[];
    }, [products]);

    const uniqueCategories = useMemo(() => {
        return Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort() as string[];
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                if (!(
                    p.name.toLowerCase().includes(term) ||
                    p.description?.toLowerCase().includes(term) ||
                    p.category?.toLowerCase().includes(term)
                )) return false;
            }
            if (filterBrand !== 'all') {
                if (filterBrand === 'none' ? p.brand !== null : p.brand !== filterBrand) return false;
            }
            if (filterCategory !== 'all' && p.category !== filterCategory) return false;
            if (filterSellingMode !== 'all' && p.sellingMode !== filterSellingMode) return false;
            return true;
        }).sort((a, b) => {
            // Active products first, then by name
            if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
    }, [products, searchTerm, filterBrand, filterCategory, filterSellingMode]);

    const hasActiveFilters = filterBrand !== 'all' || filterCategory !== 'all' || filterSellingMode !== 'all';

    const clearFilters = () => {
        setFilterBrand('all');
        setFilterCategory('all');
        setFilterSellingMode('all');
    };

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredProducts.slice(start, start + pageSize);
    }, [filteredProducts, currentPage, pageSize]);

    // Reset to page 1 when search, filters, or page size changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterBrand, filterCategory, filterSellingMode, pageSize]);

    const stats = useMemo(() => ({
        total: products.length,
        categories: new Set(products.map(p => p.category).filter(Boolean)).size,
        brands: new Set(products.map(p => p.brand).filter(Boolean)).size,
    }), [products]);

    const fetchProducts = async () => {
        const res = await fetch('/api/products');
        if (res.ok) setProducts(await res.json());
    };

    const confirmDeleteProduct = async () => {
        if (!deleteTarget) return;
        setIsDeleting(deleteTarget.id);
        setDeleteError(null);
        try {
            const res = await fetch(`/api/products?id=${encodeURIComponent(deleteTarget.id)}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setDeleteTarget(null);
                await fetchProducts();
            } else {
                const err = await res.json();
                setDeleteError(err.error || 'Failed to delete product');
            }
        } catch {
            setDeleteError('Failed to delete product');
        } finally {
            setIsDeleting(null);
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
        <main className="max-w-[1280px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-[26px] font-bold text-slate-900 tracking-[-0.02em]">Products</h1>
                        <p className="text-[13px] text-slate-500 mt-1">
                            {stats.total} products across {stats.categories} categories
                        </p>
                    </div>
                    <Button
                        size="sm"
                        className="h-9 px-3.5 text-[13px] font-medium bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-sm shadow-indigo-500/25 rounded-lg"
                        onClick={() => router.push('/admin/products/create')}
                    >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add Product
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <StatCard label="Total Products" value={stats.total} icon={<Package className="h-4 w-4" />} color="blue" />
                    <StatCard label="Categories" value={stats.categories} icon={<ShoppingCart className="h-4 w-4" />} color="emerald" />
                    <StatCard label="Brands" value={stats.brands} icon={<IndianRupee className="h-4 w-4" />} color="amber" />
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-2xl border border-slate-200/60 premium-shadow overflow-hidden">
                    {/* Search & Filters */}
                    <div className="flex flex-col gap-3 px-5 py-3 border-b border-slate-100">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-slate-400" />
                                <Input
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 text-[13px] bg-slate-50/80 border-slate-200/60 shadow-none rounded-lg focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300 placeholder:text-slate-400"
                                />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Filter className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger className="h-9 w-[140px] text-[12px] border-slate-200/60 shadow-none rounded-lg bg-slate-50/80">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-[12px]">All Categories</SelectItem>
                                        {uniqueCategories.map((cat) => (
                                            <SelectItem key={cat} value={cat} className="text-[12px]">{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={filterBrand} onValueChange={setFilterBrand}>
                                    <SelectTrigger className="h-9 w-[140px] text-[12px] border-slate-200/60 shadow-none rounded-lg bg-slate-50/80">
                                        <SelectValue placeholder="Brand" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-[12px]">All Brands</SelectItem>
                                        <SelectItem value="none" className="text-[12px]">No Brand</SelectItem>
                                        {uniqueBrands.map((brand) => (
                                            <SelectItem key={brand} value={brand} className="text-[12px]">{brand}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={filterSellingMode} onValueChange={setFilterSellingMode}>
                                    <SelectTrigger className="h-9 w-[140px] text-[12px] border-slate-200/60 shadow-none rounded-lg bg-slate-50/80">
                                        <SelectValue placeholder="Selling Mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-[12px]">All Modes</SelectItem>
                                        <SelectItem value="retail" className="text-[12px]">Retail</SelectItem>
                                        <SelectItem value="wholesale" className="text-[12px]">Wholesale</SelectItem>
                                        <SelectItem value="both" className="text-[12px]">Both</SelectItem>
                                    </SelectContent>
                                </Select>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center gap-1 h-9 px-2.5 text-[12px] text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Image</th>
                                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Product</th>
                                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Brand</th>
                                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Category</th>
                                    <th className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Selling Mode</th>
                                    <th className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Status</th>
                                    <th className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedProducts.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="h-12 w-12 relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60">
                                                {product.image ? (
                                                    <Image src={product.image} alt={product.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <Package className="h-5 w-5 text-slate-300" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-[13px] font-medium text-slate-900">{product.name}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {product.brand ? (
                                                <span className="text-[12px] text-slate-600">{product.brand}</span>
                                            ) : (
                                                <span className="text-[12px] text-slate-400">&mdash;</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {product.category ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                                                    {product.category}
                                                </span>
                                            ) : (
                                                <span className="text-[12px] text-slate-400">&mdash;</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                                product.sellingMode === 'both'
                                                    ? 'bg-violet-50 text-violet-700 border border-violet-200/50'
                                                    : product.sellingMode === 'retail'
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                                            }`}>
                                                {product.sellingMode === 'both' ? 'Both' : product.sellingMode === 'retail' ? 'Retail' : 'Wholesale'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            {product.isActive ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 border border-red-200/50">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                                    title="Edit product"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => { setDeleteError(null); setDeleteTarget(product); }}
                                                    disabled={isDeleting === product.id}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                                    title="Delete product"
                                                >
                                                    {isDeleting === product.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {paginatedProducts.map((product) => (
                            <div key={product.id} className="flex items-center gap-0 pr-2">
                                {/* Tap entire left area to edit — 44px+ touch target */}
                                <button
                                    onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                                    className="flex-1 min-w-0 flex items-center gap-3.5 px-5 py-4 text-left active:bg-slate-50 transition-colors"
                                    aria-label={`Edit ${product.name}`}
                                >
                                    <div className="h-12 w-12 relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 flex-shrink-0">
                                        {product.image ? (
                                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center">
                                                <Package className="h-5 w-5 text-slate-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-medium text-slate-900 truncate">{product.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {product.category && (
                                                <span className="text-[11px] text-indigo-600 font-medium">{product.category}</span>
                                            )}
                                            {!product.isActive && (
                                                <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Inactive</span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Chevron cue — standard mobile edit affordance */}
                                    <Pencil className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                                </button>

                                {/* Delete — visually separated, 44px touch target, clearly destructive */}
                                <button
                                    onClick={() => { setDeleteError(null); setDeleteTarget(product); }}
                                    disabled={isDeleting === product.id}
                                    aria-label={`Delete ${product.name}`}
                                    className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl text-red-400 bg-red-50 border border-red-100 active:bg-red-100 transition-colors disabled:opacity-40 ml-2"
                                >
                                    {isDeleting === product.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredProducts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                                <Inbox className="h-5 w-5 text-slate-400" />
                            </div>
                            <p className="text-[14px] font-medium text-slate-600 mb-1">No products found</p>
                            <p className="text-[12px] text-slate-400 text-center max-w-[240px]">
                                {searchTerm || hasActiveFilters ? 'Try adjusting your search or filters.' : 'Add your first product to get started.'}
                            </p>
                        </div>
                    )}

                    {/* Footer with Pagination */}
                    {filteredProducts.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                <p className="text-[12px] text-slate-400">
                                    Showing <span className="font-medium text-slate-600">{(currentPage - 1) * pageSize + 1}</span>–<span className="font-medium text-slate-600">{Math.min(currentPage * pageSize, filteredProducts.length)}</span> of{' '}
                                    <span className="font-medium text-slate-600">{filteredProducts.length}</span> products
                                </p>
                                <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                                    <SelectTrigger className="h-7 w-[70px] text-[11px] border-slate-200/60 shadow-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent align="end">
                                        {[10, 20, 50, 100].map((size) => (
                                            <SelectItem key={size} value={size.toString()} className="text-[12px]">
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                    title="First page"
                                >
                                    <ChevronsLeft className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                    title="Previous page"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                                <span className="text-[12px] text-slate-500 px-2 tabular-nums">
                                    Page <span className="font-medium text-slate-700">{currentPage}</span> of <span className="font-medium text-slate-700">{totalPages}</span>
                                </span>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                    title="Next page"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                    title="Last page"
                                >
                                    <ChevronsRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteError(null); } }}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-slate-900">
                                {deleteError ? 'Cannot Delete Product' : 'Delete Product'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500">
                                {deleteError ? (
                                    <span className="text-red-600">{deleteError}</span>
                                ) : (
                                    <>Are you sure you want to delete <span className="font-semibold text-slate-700">&quot;{deleteTarget?.name}&quot;</span>? This action cannot be undone.</>
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => { setDeleteTarget(null); setDeleteError(null); }}
                                disabled={isDeleting === deleteTarget?.id}
                                className="border-slate-200 text-slate-700"
                            >
                                {deleteError ? 'Close' : 'Cancel'}
                            </Button>
                            {!deleteError && (
                                <Button
                                    onClick={confirmDeleteProduct}
                                    disabled={isDeleting === deleteTarget?.id}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {isDeleting === deleteTarget?.id ? (
                                        <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Deleting...</>
                                    ) : (
                                        <><Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete</>
                                    )}
                                </Button>
                            )}
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>
    );
}
