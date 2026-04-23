'use client';

import { useState, useEffect, use } from 'react';
import { Loader2 } from 'lucide-react';
import ProductForm, { ProductFormData } from '@/components/admin/ProductForm';

export default function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
    const { productId } = use(params);
    const [initialData, setInitialData] = useState<ProductFormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/products/${productId}`);
                if (!res.ok) {
                    setError('Product not found');
                    return;
                }
                const product = await res.json();
                setInitialData({
                    id: product.id,
                    name: product.name,
                    description: product.description || '',
                    brandId: product.brandId?.toString() || '',
                    categoryId: product.categoryId?.toString() || '',
                    image: product.image || '',
                    sellingMode: product.sellingMode || 'both',
                    retailSizes: product.retailSizes || [],
                    wholesaleSizes: product.wholesaleSizes || [],
                });
            } catch {
                setError('Failed to load product');
            } finally {
                setLoading(false);
            }
        })();
    }, [productId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                    <p className="text-[13px] text-slate-500">Loading product...</p>
                </div>
            </div>
        );
    }

    if (error || !initialData) {
        return (
            <div className="flex items-center justify-center py-32">
                <p className="text-[14px] text-red-600">{error || 'Product not found'}</p>
            </div>
        );
    }

    return (
        <main className="max-w-[1280px] mx-auto px-6 py-8">
            <div className="mb-8">
                <h1 className="text-[26px] font-bold text-slate-900 tracking-[-0.02em]">
                    Edit Product
                </h1>
                <p className="text-[13px] text-slate-500 mt-1">
                    Update product details and packaging options.
                </p>
            </div>

            <ProductForm mode="edit" initialData={initialData} />
        </main>
    );
}
