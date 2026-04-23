'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
    Loader2, Package, Calendar, ShoppingBag, TrendingUp,
    ArrowRight, Clock, ArrowLeft,
} from 'lucide-react';
import TopNav from '@/components/admin/TopNav';
import CustomerForm, { CustomerFormData } from '@/components/admin/CustomerForm';
import { StatusBadge } from '@/components/admin/OrderDrawer';

interface OrderItem {
    id: string;
    productName: string;
    productImage: string | null;
    quantity: number;
    price: number;
}

interface RecentOrder {
    id: string;
    status: string;
    createdAt: string;
    totalQty: number;
    items: OrderItem[];
}

interface CustomerStats {
    totalOrders: number;
    statusCounts: Record<string, number>;
    lastOrderDate: string | null;
}

export default function EditCustomerPage({ params }: { params: Promise<{ customerId: string }> }) {
    const { customerId } = use(params);
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<{ email: string; displayName: string } | null>(null);
    const [initialData, setInitialData] = useState<CustomerFormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [stats, setStats] = useState<CustomerStats | null>(null);
    const [ordersLoading, setOrdersLoading] = useState(true);

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

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/customers/${customerId}`);
                if (!res.ok) {
                    setError('Customer not found');
                    return;
                }
                const customer = await res.json();
                setInitialData({
                    id: customer.id,
                    fullName: customer.fullName || '',
                    storeName: customer.storeName || '',
                    mobileNo: customer.mobileNo || '',
                    alternateContactNo: customer.alternateContactNo || '',
                    email: customer.email || '',
                    gstNo: customer.gstNo || '',
                    dateOfBirth: customer.dateOfBirth || '',
                    anniversaryDate: customer.anniversaryDate || '',
                    gender: customer.gender || '',
                    addressLine1: customer.addressLine1 || '',
                    addressLine2: customer.addressLine2 || '',
                    city: customer.city || '',
                    state: customer.state || '',
                    pincode: customer.pincode || '',
                    country: customer.country || 'India',
                    customerType: customer.customerType || 'retail',
                    status: customer.status || 'active',
                    notes: customer.notes || '',
                });
            } catch {
                setError('Failed to load customer');
            } finally {
                setLoading(false);
            }
        })();
    }, [customerId]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/customers/${customerId}/orders?limit=3`);
                if (res.ok) {
                    const data = await res.json();
                    setRecentOrders(data.orders || []);
                    setStats(data.stats || null);
                }
            } catch {
                // silently fail - orders section is supplementary
            } finally {
                setOrdersLoading(false);
            }
        })();
    }, [customerId]);

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

    const timeAgo = (dateString: string) => {
        const diff = Date.now() - new Date(dateString).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 30) return `${days}d ago`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months}mo ago`;
        return `${Math.floor(months / 12)}y ago`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC]">
                <TopNav currentUser={currentUser} />
                <div className="flex items-center justify-center py-32">
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                                <span className="text-white font-bold text-[11px]">CX</span>
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

    if (error || !initialData) {
        return (
            <div className="min-h-screen bg-[#F8FAFC]">
                <TopNav currentUser={currentUser} />
                <div className="flex flex-col items-center justify-center py-32">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
                        <Package className="h-5 w-5 text-red-400" />
                    </div>
                    <p className="text-[14px] font-medium text-slate-600 mb-1">{error || 'Customer not found'}</p>
                    <button
                        onClick={() => router.push('/admin/customers')}
                        className="mt-3 text-[13px] font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                        Back to Customers
                    </button>
                </div>
            </div>
        );
    }

    // Build the right panel content for edit mode
    const rightPanelContent = (
        <>
            {/* ── Activity Snapshot ── */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/80 p-5">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-3.5">
                    Activity Snapshot
                </h3>
                {ordersLoading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="bg-slate-50/80 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                                <ShoppingBag className="h-3.5 w-3.5 text-indigo-500" />
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Orders</span>
                            </div>
                            <p className="text-[20px] font-bold text-slate-900 tracking-tight">
                                {stats?.totalOrders || 0}
                            </p>
                        </div>
                        <div className="bg-slate-50/80 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                                <Package className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Delivered</span>
                            </div>
                            <p className="text-[20px] font-bold text-slate-900 tracking-tight">
                                {stats?.statusCounts?.['delivered'] || stats?.statusCounts?.['Delivered'] || 0}
                            </p>
                        </div>
                        <div className="bg-slate-50/80 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                                <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pending</span>
                            </div>
                            <p className="text-[20px] font-bold text-slate-900 tracking-tight">
                                {(stats?.statusCounts?.['pending'] || stats?.statusCounts?.['Ordered'] || 0) +
                                 (stats?.statusCounts?.['confirmed'] || stats?.statusCounts?.['Confirmed'] || 0)}
                            </p>
                        </div>
                        <div className="bg-slate-50/80 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                                <Calendar className="h-3.5 w-3.5 text-violet-500" />
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Last Order</span>
                            </div>
                            <p className="text-[13px] font-semibold text-slate-900">
                                {stats?.lastOrderDate ? timeAgo(stats.lastOrderDate) : '—'}
                            </p>
                            {stats?.lastOrderDate && (
                                <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(stats.lastOrderDate)}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Recent Orders ── */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/80 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Recent Orders</h3>
                    {(stats?.totalOrders || 0) > 3 && (
                        <button
                            onClick={() => router.push(`/admin?search=${initialData?.mobileNo || initialData?.fullName || ''}`)}
                            className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-0.5 cursor-pointer"
                        >
                            View all
                            <ArrowRight className="h-3 w-3" />
                        </button>
                    )}
                </div>

                {ordersLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                    </div>
                ) : recentOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center mb-2">
                            <Package className="h-4 w-4 text-slate-400" />
                        </div>
                        <p className="text-[11px] text-slate-400">No orders yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {recentOrders.map(order => (
                            <div
                                key={order.id}
                                onClick={() => router.push(`/admin/orders/${order.id}`)}
                                className="px-5 py-3 hover:bg-slate-50/70 transition-colors cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[12px] font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                        #{order.id}
                                    </span>
                                    <StatusBadge status={order.status} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(order.createdAt)}
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                        {order.totalQty} {order.totalQty === 1 ? 'item' : 'items'}
                                    </span>
                                </div>
                                {order.items.length > 0 && (
                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                        {order.items.slice(0, 2).map(item => (
                                            <span
                                                key={item.id}
                                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-50 text-[10px] text-slate-500 border border-slate-100"
                                            >
                                                {item.productName} <span className="ml-1 text-slate-400">×{item.quantity}</span>
                                            </span>
                                        ))}
                                        {order.items.length > 2 && (
                                            <span className="text-[10px] text-slate-400">+{order.items.length - 2}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <TopNav currentUser={currentUser} />

            <main className="max-w-[1200px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <button
                        onClick={() => router.push('/admin/customers')}
                        className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200/60 transition-all text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <h1 className="text-[22px] font-bold text-slate-900 tracking-[-0.02em]">
                            Edit Customer
                        </h1>
                        <p className="text-[13px] text-slate-400 mt-0.5">
                            Update customer details and classification
                        </p>
                    </div>
                </div>

                <CustomerForm
                    mode="edit"
                    initialData={initialData}
                    rightPanelContent={rightPanelContent}
                />
            </main>
        </div>
    );
}
