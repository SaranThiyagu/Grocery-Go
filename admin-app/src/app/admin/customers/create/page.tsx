'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import TopNav from '@/components/admin/TopNav';
import CustomerForm from '@/components/admin/CustomerForm';

export default function CreateCustomerPage() {
    const [currentUser, setCurrentUser] = useState<{ email: string; displayName: string } | null>(null);

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
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <TopNav currentUser={currentUser} />

            <main className="max-w-[1440px] mx-auto px-6 py-8">
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
        </div>
    );
}
