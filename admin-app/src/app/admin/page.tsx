'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  CircleDot,
  Sparkles,
  Plus,
  ChevronDown,
  Calendar,
  X,
  Zap,
  Users,
  Timer,
  Truck,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import StatCard from '@/components/admin/StatCard';
import FilterBar from '@/components/admin/FilterBar';
import OrdersTable from '@/components/admin/OrdersTable';
import { type Order } from '@/components/admin/OrderDrawer';
import { useToast } from '@/hooks/use-toast';
import { isDeliveryOverdue } from '@/lib/delivery';

export default function AdminPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  // ── Read filters from URL query params on mount ───────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const delivery = params.get('delivery');
    const status = params.get('status');
    const search = params.get('search');
    const validDelivery = ['today', 'tomorrow', 'this_week', 'overdue', 'unassigned'];
    const validStatus = ['ordered', 'confirmed', 'delivered', 'cancelled'];
    if (delivery && validDelivery.includes(delivery)) setDeliveryFilter(delivery);
    if (status && validStatus.includes(status.toLowerCase())) setStatusFilter(status.toLowerCase());
    if (search) setSearchTerm(search);
  }, []);

  // ── Data Fetch + Realtime ─────────────────────────────────
  useEffect(() => {
    const supabase = createClient();

    (async () => {
      await fetchOrders();
      setLoading(false);
    })();

    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => {
          try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch {}
          toast({
            title: '🔔 New Order Received!',
            description: 'A customer just placed a new order.',
          });
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => { fetchOrders(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders, toast]);

  // ── Derived Data ──────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(o =>
        o.id.toLowerCase().includes(term) ||
        o.userName?.toLowerCase().includes(term) ||
        o.customerName?.toLowerCase().includes(term) ||
        o.userEmail?.toLowerCase().includes(term) ||
        o.customerStoreName?.toLowerCase().includes(term) ||
        o.customerMobile?.includes(term) ||
        o.items.some(i => i.productName.toLowerCase().includes(term))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(o => o.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (deliveryFilter !== 'all') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
      result = result.filter((o) => {
        const dateStr = o.deliveryDate;
        if (deliveryFilter === 'unassigned') return !dateStr;
        if (!dateStr) return false;
        const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
        if (deliveryFilter === 'today') return d.getTime() === today.getTime();
        if (deliveryFilter === 'tomorrow') return d.getTime() === tomorrow.getTime();
        if (deliveryFilter === 'this_week') return d.getTime() >= today.getTime() && d.getTime() < weekEnd.getTime();
        if (deliveryFilter === 'overdue') return isDeliveryOverdue(dateStr, o.status);
        return true;
      });
    }

    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'delivery_soonest':
        result.sort((a, b) => {
          const ad = a.deliveryDate ? new Date(a.deliveryDate).getTime() : Number.POSITIVE_INFINITY;
          const bd = b.deliveryDate ? new Date(b.deliveryDate).getTime() : Number.POSITIVE_INFINITY;
          return ad - bd;
        });
        break;
      case 'delivery_latest':
        result.sort((a, b) => {
          const ad = a.deliveryDate ? new Date(a.deliveryDate).getTime() : Number.NEGATIVE_INFINITY;
          const bd = b.deliveryDate ? new Date(b.deliveryDate).getTime() : Number.NEGATIVE_INFINITY;
          return bd - ad;
        });
        break;
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [orders, searchTerm, statusFilter, deliveryFilter, sortBy]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, deliveryFilter, sortBy]);

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
    const cancelled = orders.filter(o => o.status.toLowerCase() === 'cancelled').length;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dueToday = orders.filter((o) => {
      if (!o.deliveryDate || o.status.toLowerCase() === 'delivered') return false;
      const d = new Date(o.deliveryDate); d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }).length;
    const overdue = orders.filter((o) => isDeliveryOverdue(o.deliveryDate, o.status)).length;
    return { total, pending, confirmed, delivered, cancelled, dueToday, overdue };
  }, [orders]);

  const [showInsights, setShowInsights] = useState(true);

  const handleOrderClick = (order: Order) => {
    router.push(`/admin/orders/${order.id}`);
  };

  // ── Loading ───────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────
  return (
    <main className="max-w-[1280px] mx-auto px-6 py-8">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-[-0.02em]">Orders</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            {stats.total} orders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/orders/create')}
            className="flex items-center gap-2 h-9 px-4 text-[13px] font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Order
          </button>
          <button className="flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            Last 7 days
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
        <StatCard label="Total Orders" value={stats.total} icon={<ShoppingBag className="h-4 w-4" />} color="neutral" trend={{ value: '20% from last 7 days', positive: true }} />
        <StatCard label="Ordered" value={stats.pending} icon={<Clock className="h-4 w-4" />} color="amber" trend={{ value: '10% from last 7 days', positive: true }} />
        <StatCard label="Confirmed" value={stats.confirmed} icon={<CheckCircle2 className="h-4 w-4" />} color="emerald" trend={{ value: '15% from last 7 days', positive: true }} />
        <StatCard label="Delivered" value={stats.delivered} icon={<CircleDot className="h-4 w-4" />} color="emerald" trend={{ value: '25% from last 7 days', positive: true }} />
        <StatCard label="Cancelled" value={stats.cancelled} icon={<XCircle className="h-4 w-4" />} color={stats.cancelled > 0 ? 'amber' : 'neutral'} />
        <StatCard label="Due Today" value={stats.dueToday} icon={<Truck className="h-4 w-4" />} color="amber" />
        <StatCard label="Overdue" value={stats.overdue} icon={<AlertTriangle className="h-4 w-4" />} color={stats.overdue > 0 ? 'amber' : 'neutral'} />
      </div>

      {/* ── AI Insights Banner ───────────────────────────── */}
      {showInsights && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <h3 className="text-[14px] font-semibold text-slate-900">AI Insights</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-600">Beta</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1">
                View all insights
                <ChevronDown className="h-3 w-3 -rotate-90" />
              </button>
              <button onClick={() => setShowInsights(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Zap className="h-4 w-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-[13px] text-slate-600">{stats.pending} orders likely to be delivered within 24 hours</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[13px] text-slate-600">Saravanan is a repeat <span className="font-semibold text-slate-900">high-value customer</span></p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Timer className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-[13px] text-slate-600">Peak order time today is <span className="font-semibold text-slate-900">6:00 PM &ndash; 8:00 PM</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Orders Table ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          deliveryFilter={deliveryFilter}
          onDeliveryFilterChange={setDeliveryFilter}
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
  );
}