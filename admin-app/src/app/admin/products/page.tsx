'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
    Upload,
    Loader2,
    X,
    ImageIcon,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Switch } from '@/components/ui/switch';
import TopNav from '@/components/admin/TopNav';
import StatCard from '@/components/admin/StatCard';

interface Category {
    id: number;
    name: string;
}

interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image: string | null;
    category: string | null;
    categoryId: number | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUser, setCurrentUser] = useState<{ email: string; displayName: string } | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        image: '',
        isActive: true,
    });

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

        (async () => {
            try {
                const [prodRes, catRes] = await Promise.all([
                    fetch('/api/products'),
                    fetch('/api/categories'),
                ]);
                if (prodRes.ok) setProducts(await prodRes.json());
                if (catRes.ok) setCategories(await catRes.json());
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        const term = searchTerm.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.description?.toLowerCase().includes(term) ||
            p.category?.toLowerCase().includes(term)
        );
    }, [products, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredProducts.slice(start, start + pageSize);
    }, [filteredProducts, currentPage, pageSize]);

    // Reset to page 1 when search or page size changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, pageSize]);

    const stats = useMemo(() => ({
        total: products.length,
        categories: new Set(products.map(p => p.category).filter(Boolean)).size,
        avgPrice: products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0,
    }), [products]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

    const fetchProducts = async () => {
        const res = await fetch('/api/products');
        if (res.ok) setProducts(await res.json());
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description || null,
                    price: parseFloat(formData.price),
                    category_id: formData.categoryId ? parseInt(formData.categoryId) : null,
                    image: formData.image || null,
                    is_active: formData.isActive,
                }),
            });
            if (res.ok) {
                setFormData({ name: '', description: '', price: '', categoryId: '', image: '', isActive: true });
                setImagePreview(null);
                setIsDialogOpen(false);
                await fetchProducts();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to create product');
            }
        } catch {
            alert('Failed to create product');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageUploading(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const res = await fetch('/api/products/upload', { method: 'POST', body: fd });
            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({ ...prev, image: data.imageUrl }));
                setImagePreview(URL.createObjectURL(file));
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to upload image');
            }
        } catch {
            alert('Failed to upload image');
        } finally {
            setImageUploading(false);
            e.target.value = '';
        }
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, image: '' }));
        setImagePreview(null);
    };

    const openEditDialog = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price.toString(),
            categoryId: product.categoryId?.toString() || '',
            image: product.image || '',
            isActive: product.isActive,
        });
        setImagePreview(product.image || null);
        setIsEditDialogOpen(true);
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingProduct.id,
                    name: formData.name,
                    description: formData.description || null,
                    price: parseFloat(formData.price),
                    category_id: formData.categoryId ? parseInt(formData.categoryId) : null,
                    image: formData.image || null,
                    is_active: formData.isActive,
                }),
            });
            if (res.ok) {
                setFormData({ name: '', description: '', price: '', categoryId: '', image: '', isActive: true });
                setImagePreview(null);
                setEditingProduct(null);
                setIsEditDialogOpen(false);
                await fetchProducts();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to update product');
            }
        } catch {
            alert('Failed to update product');
        } finally {
            setIsSubmitting(false);
        }
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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                            <span className="text-white font-bold text-[10px] tracking-tight">OF</span>
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
        <div className="min-h-screen bg-background">
            <TopNav currentUser={currentUser} />

            <main className="max-w-[1440px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-[26px] font-bold text-slate-900 tracking-[-0.02em]">Products</h1>
                        <p className="text-[13px] text-slate-500 mt-1">
                            {stats.total} products across {stats.categories} categories
                        </p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                size="sm"
                                className="h-9 px-3.5 text-[13px] font-medium bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-sm shadow-indigo-500/25 rounded-lg"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                Add Product
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="text-slate-900">Add New Product</DialogTitle>
                                <DialogDescription className="text-slate-500">
                                    Fill in the details to add a new product to your inventory.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateProduct}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name" className="text-slate-700">Product Name *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Fresh Apples"
                                            className="focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300"
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="price" className="text-slate-700">Price (₹) *</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="e.g., 50.00"
                                            className="focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300"
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="category" className="text-slate-700">Category</Label>
                                        <Select
                                            value={formData.categoryId}
                                            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                                        >
                                            <SelectTrigger className="focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300">
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-slate-700">Product Image</Label>
                                        {imagePreview || formData.image ? (
                                            <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60">
                                                <Image
                                                    src={imagePreview || formData.image}
                                                    alt="Preview"
                                                    fill
                                                    className="object-contain"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removeImage}
                                                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className={`flex flex-col items-center justify-center gap-1.5 py-6 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer transition-colors ${
                                                imageUploading ? 'opacity-50 pointer-events-none' : 'hover:border-indigo-300 hover:bg-indigo-50/30'
                                            }`}>
                                                {imageUploading ? (
                                                    <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                                                ) : (
                                                    <Upload className="h-6 w-6 text-slate-400" />
                                                )}
                                                <span className="text-[12px] text-slate-500">
                                                    {imageUploading ? 'Uploading...' : 'Click to upload (JPEG, PNG, WebP · max 5 MB)'}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept=".jpg,.jpeg,.png,.webp"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                    disabled={imageUploading}
                                                />
                                            </label>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description" className="text-slate-700">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Enter product description..."
                                            rows={3}
                                            className="focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <Label className="text-slate-700">Active Product</Label>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Inactive products won&apos;t be visible to customers</p>
                                        </div>
                                        <Switch
                                            checked={formData.isActive}
                                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsDialogOpen(false)}
                                        disabled={isSubmitting}
                                        className="border-slate-200 text-slate-700"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-sm shadow-indigo-500/25"
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create Product'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <StatCard label="Total Products" value={stats.total} icon={<Package className="h-4 w-4" />} color="blue" />
                    <StatCard label="Categories" value={stats.categories} icon={<ShoppingCart className="h-4 w-4" />} color="emerald" />
                    <StatCard label="Avg. Price" value={formatCurrency(stats.avgPrice)} icon={<IndianRupee className="h-4 w-4" />} color="amber" />
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-2xl border border-slate-200/60 premium-shadow overflow-hidden">
                    {/* Search Bar */}
                    <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-slate-400" />
                            <Input
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 text-[13px] bg-slate-50/80 border-slate-200/60 shadow-none rounded-lg focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Image</th>
                                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Product</th>
                                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Category</th>
                                    <th className="text-right text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Price</th>
                                    <th className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Status</th>
                                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Description</th>
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
                                            {product.category ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                                                    {product.category}
                                                </span>
                                            ) : (
                                                <span className="text-[12px] text-slate-400">&mdash;</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <span className="text-[13px] font-semibold tabular-nums text-slate-900">
                                                {formatCurrency(product.price)}
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
                                            <span className="text-[12px] text-slate-500 max-w-[280px] truncate block">
                                                {product.description || 'No description'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => openEditDialog(product)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                    title="Edit product"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => { setDeleteError(null); setDeleteTarget(product); }}
                                                    disabled={isDeleting === product.id}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
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
                            <div key={product.id} className="px-5 py-4 flex items-center gap-3.5">
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
                                <span className="text-[13px] font-semibold tabular-nums text-slate-900 flex-shrink-0">
                                    {formatCurrency(product.price)}
                                </span>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => openEditDialog(product)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => { setDeleteError(null); setDeleteTarget(product); }}
                                        disabled={isDeleting === product.id}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                    >
                                        {isDeleting === product.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>
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
                                {searchTerm ? 'Try adjusting your search.' : 'Add your first product to get started.'}
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

                {/* Edit Product Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) {
                        setEditingProduct(null);
                        setFormData({ name: '', description: '', price: '', categoryId: '', image: '', isActive: true });
                        setImagePreview(null);
                    }
                }}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="text-slate-900">Edit Product</DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Update the product details below.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdateProduct}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name" className="text-slate-700">Product Name *</Label>
                                    <Input
                                        id="edit-name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Fresh Apples"
                                        className="focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-price" className="text-slate-700">Price (₹) *</Label>
                                    <Input
                                        id="edit-price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="e.g., 50.00"
                                        className="focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-category" className="text-slate-700">Category</Label>
                                    <Select
                                        value={formData.categoryId}
                                        onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                                    >
                                        <SelectTrigger className="focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-slate-700">Product Image</Label>
                                    {imagePreview || formData.image ? (
                                        <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60">
                                            <Image
                                                src={imagePreview || formData.image}
                                                alt="Preview"
                                                fill
                                                className="object-contain"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className={`flex flex-col items-center justify-center gap-1.5 py-6 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer transition-colors ${
                                            imageUploading ? 'opacity-50 pointer-events-none' : 'hover:border-indigo-300 hover:bg-indigo-50/30'
                                        }`}>
                                            {imageUploading ? (
                                                <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                                            ) : (
                                                <Upload className="h-6 w-6 text-slate-400" />
                                            )}
                                            <span className="text-[12px] text-slate-500">
                                                {imageUploading ? 'Uploading...' : 'Click to upload (JPEG, PNG, WebP · max 5 MB)'}
                                            </span>
                                            <input
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.webp"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                disabled={imageUploading}
                                            />
                                        </label>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-description" className="text-slate-700">Description</Label>
                                    <Textarea
                                        id="edit-description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Enter product description..."
                                        rows={3}
                                        className="focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300"
                                    />
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <Label className="text-slate-700">Active Product</Label>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Inactive products won&apos;t be visible to customers</p>
                                    </div>
                                    <Switch
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditDialogOpen(false)}
                                    disabled={isSubmitting}
                                    className="border-slate-200 text-slate-700"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-sm shadow-indigo-500/25"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

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
        </div>
    );
}
