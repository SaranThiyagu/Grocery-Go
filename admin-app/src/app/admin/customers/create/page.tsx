'use client';

import CustomerForm from '@/components/admin/CustomerForm';

export default function CreateCustomerPage() {
    return (
        <main className="max-w-[1280px] mx-auto px-6 py-8">
            <div className="mb-8">
                <h1 className="text-[26px] font-bold text-slate-900 tracking-[-0.02em]">
                    Add New Customer
                </h1>
                <p className="text-[13px] text-slate-500 mt-1">
                    Enter customer details for retail or wholesale accounts.
                </p>
            </div>

            <CustomerForm mode="create" />
        </main>
    );
}
