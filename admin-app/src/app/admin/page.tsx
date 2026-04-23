'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  CircleDot,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import TopNav from '@/components/admin/TopNav';
import StatCard from '@/components/admin/StatCard';
import FilterBar from '@/components/admin/FilterBar';
import OrdersTable from '@/components/admin/OrdersTable';
import { type Order } from '@/components/admin/OrderDrawer';
import { useToast } from '@/hooks/use-toast';

export default function AdminPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [currentUser, setCurrentUser] = useState<{ email: string; displayName: string } | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) setOrders(await res.json());
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  }, []);

  // ── Auth + Data Fetch + Realtime ──────────────────────────
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
      await fetchOrders();
      setLoading(false);
    })();

    // Subscribe to new orders via Supabase Realtime
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => {
          // Play notification sound
          try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch {}

          toast({
            title: '🔔 New Order Received!',
            description: 'A customer just placed a new order.',
          });

          // Refresh orders list
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => {
          // Refresh on any order update (status changes etc.)
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, toast]);

  // ── Derived Data ──────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(o =>
        o.id.toLowerCase().includes(term) ||
        o.userName?.toLowerCase().includes(term) ||
        o.userEmail?.toLowerCase().includes(term) ||
        o.customerStoreName?.toLowerCase().includes(term) ||
        o.customerMobile?.includes(term) ||
        o.items.some(i => i.productName.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'amount-high':
        result.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      case 'amount-low':
        result.sort((a, b) => a.totalAmount - b.totalAmount);
        break;
      default: // newest
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [orders, searchTerm, statusFilter, sortBy]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status.toLowerCase() === 'ordered').length;
    const confirmed = orders.filter(o => o.status.toLowerCase() === 'confirmed').length;
    const delivered = orders.filter(o => o.status.toLowerCase() === 'delivered').length;
    const revenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    return { total, pending, confirmed, delivered, revenue };
  }, [orders]);

  // ── Handlers ──────────────────────────────────────────────
  const handleOrderClick = (order: Order) => {
    router.push(`/admin/orders/${order.id}`);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  // ── Loading ───────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <TopNav currentUser={currentUser} />

      <main className="max-w-[1440px] mx-auto px-6 py-8">
        {/* ── Hero Header ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[26px] font-bold text-slate-900 tracking-[-0.02em]">Orders</h1>
            <p className="text-[13px] text-slate-500 mt-1">
              {stats.total} total orders &middot; {formatCurrency(stats.revenue)} revenue
            </p>
          </div>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Orders" value={stats.total} icon={<ShoppingBag className="h-4 w-4" />} color="neutral" />
          <StatCard label="Ordered" value={stats.pending} icon={<Clock className="h-4 w-4" />} color="amber" />
          <StatCard label="Confirmed" value={stats.confirmed} icon={<CircleDot className="h-4 w-4" />} color="blue" />
          <StatCard label="Delivered" value={stats.delivered} icon={<CheckCircle2 className="h-4 w-4" />} color="emerald" />
        </div>

        {/* ── Orders Table ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/60 premium-shadow overflow-hidden">
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
          <OrdersTable
            orders={paginatedOrders}
            allOrdersCount={orders.length}
            filteredCount={filteredOrders.length}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            onOrderClick={handleOrderClick}
          />
        </div>
      </main>
    </div>
  );
}