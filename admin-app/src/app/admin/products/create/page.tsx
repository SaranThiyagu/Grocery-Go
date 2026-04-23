'use client';

import ProductForm from '@/components/admin/ProductForm';

export default function CreateProductPage() {
    return (
        <main className="max-w-[1280px] mx-auto px-6 py-8">
            <div className="mb-8">
                <h1 className="text-[26px] font-bold text-slate-900 tracking-[-0.02em]">
                    Create New Product
                </h1>
                <p className="text-[13px] text-slate-500 mt-1">
                    Define product details and packaging for retail and wholesale customers.
                </p>
            </div>

            <ProductForm mode="create" />
        </main>
    );
}
