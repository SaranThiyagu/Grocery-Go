'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag, Users, Package,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2,
  Sparkles, ChevronRight, Star, MapPin, BarChart3,
  ShoppingCart, Truck, AlertCircle, CalendarDays,
} from 'lucide-react';
import { type Order } from '@/components/admin/OrderDrawer';

// ── Types ──────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  isActive: boolean;
  sellingMode: string;
  image?: string;
}

interface Customer {
  id: string;
  fullName: string;
  storeName?: string;
  customerType: string;
  status: string;
  city?: string;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// ── Dashboard Page ─────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
    ]).then(([o, p, c]) => {
      setOrders(Array.isArray(o) ? o : []);
      setProducts(Array.isArray(p) ? p : []);
      setCustomers(Array.isArray(c) ? c : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // ── Computed Metrics ──────────────────────────────────────
  const metrics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7d = new Date(today.getTime() - 7 * 86400000);
    const last30d = new Date(today.getTime() - 30 * 86400000);
    const prev7d = new Date(last7d.getTime() - 7 * 86400000);

    const ordersLast7 = orders.filter(o => new Date(o.createdAt) >= last7d);
    const ordersPrev7 = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= prev7d && d < last7d;
    });

    const ordersToday = orders.filter(o => new Date(o.createdAt) >= today);
    const pendingOrders = orders.filter(o => o.status.toLowerCase() === 'ordered');
    const confirmedOrders = orders.filter(o => o.status.toLowerCase() === 'confirmed');
    const deliveredOrders = orders.filter(o => o.status.toLowerCase() === 'delivered');

    const orderCountChange = ordersPrev7.length > 0
      ? ((ordersLast7.length - ordersPrev7.length) / ordersPrev7.length * 100) : 0;

    // Customer metrics
    const activeCustomers = customers.filter(c => c.status === 'active');
    const retailCustomers = customers.filter(c => c.customerType === 'retail');
    const wholesaleCustomers = customers.filter(c => c.customerType === 'wholesale');
    const newCustomersLast30 = customers.filter(c => new Date(c.createdAt) >= last30d);

    // Unique customers who ordered
    const uniqueOrderCustomers = new Set(orders.map(o => o.customerName || o.userName).filter(Boolean));

    // Product metrics
    const activeProducts = products.filter(p => p.isActive);
    const categories = new Set(products.map(p => p.category).filter(Boolean));

    // Top products by order frequency
    const productCounts: Record<string, { name: string; count: number }> = {};
    orders.forEach(o => o.items.forEach(item => {
      const key = item.productName;
      if (!productCounts[key]) productCounts[key] = { name: key, count: 0 };
      productCounts[key].count += item.quantity;
    }));
    const topProducts = Object.values(productCounts).sort((a, b) => b.count - a.count).slice(0, 5);

    // Top customers by order count
    const customerOrders: Record<string, { name: string; type: string; orders: number }> = {};
    orders.forEach(o => {
      const name = o.customerName || o.userName;
      if (!name) return;
      if (!customerOrders[name]) customerOrders[name] = { name, type: o.customerType || 'retail', orders: 0 };
      customerOrders[name].orders += 1;
    });
    const topCustomers = Object.values(customerOrders).sort((a, b) => b.orders - a.orders).slice(0, 5);

    // Orders by day (last 7 days)
    const ordersByDay: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today.getTime() - i * 86400000);
      const dayEnd = new Date(day.getTime() + 86400000);
      const dayCount = orders
        .filter(o => { const d = new Date(o.createdAt); return d >= day && d < dayEnd; }).length;
      ordersByDay.push({
        label: day.toLocaleDateString('en-IN', { weekday: 'short' }),
        value: dayCount,
      });
    }

    // Orders by status
    const statusBreakdown = [
      { label: 'Ordered', count: pendingOrders.length, color: 'bg-amber-500' },
      { label: 'Confirmed', count: confirmedOrders.length, color: 'bg-blue-500' },
      { label: 'Delivered', count: deliveredOrders.length, color: 'bg-emerald-500' },
    ];

    // City distribution
    const cityMap: Record<string, number> = {};
    customers.forEach(c => { if (c.city) cityMap[c.city] = (cityMap[c.city] || 0) + 1; });
    const topCities = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Recent orders (latest 5)
    const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    return {
      ordersToday: ordersToday.length,
      ordersLast7: ordersLast7.length, orderCountChange,
      pendingOrders: pendingOrders.length,
      confirmedOrders: confirmedOrders.length,
      deliveredOrders: deliveredOrders.length,
      totalOrders: orders.length,
      totalCustomers: customers.length,
      activeCustomers: activeCustomers.length,
      retailCustomers: retailCustomers.length,
      wholesaleCustomers: wholesaleCustomers.length,
      newCustomersLast30: newCustomersLast30.length,
      uniqueOrderCustomers: uniqueOrderCustomers.size,
      totalProducts: products.length,
      activeProducts: activeProducts.length,
      categories: categories.size,
      topProducts, topCustomers, ordersByDay, statusBreakdown,
      topCities, recentOrders,
    };
  }, [orders, products, customers]);

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <BarChart3 className="h-4 w-4 text-white" />
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

  const maxOrders = Math.max(...metrics.ordersByDay.map(d => d.value), 1);

  // ── Render ────────────────────────────────────────────────
  return (
    <main className="max-w-[1280px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[26px] font-bold text-slate-900 tracking-[-0.02em]">Dashboard</h1>
        <p className="text-[13px] text-slate-500 mt-1">
          Business overview &middot; {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── KPI Cards Row 1 ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <ShoppingBag className="h-4.5 w-4.5 text-violet-600" />
            </div>
            <TrendBadge value={metrics.orderCountChange} />
          </div>
          <p className="text-[13px] text-slate-500 mb-0.5">Total Orders</p>
          <p className="text-[24px] font-bold text-slate-900 tracking-tight">{metrics.totalOrders}</p>
        </div>

        {/* Active Customers */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Users className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +{metrics.newCustomersLast30} new
            </span>
          </div>
          <p className="text-[13px] text-slate-500 mb-0.5">Active Customers</p>
          <p className="text-[24px] font-bold text-slate-900 tracking-tight">{metrics.activeCustomers}</p>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Package className="h-4.5 w-4.5 text-indigo-600" />
            </div>
          </div>
          <p className="text-[13px] text-slate-500 mb-0.5">Total Products</p>
          <p className="text-[24px] font-bold text-slate-900 tracking-tight">{metrics.activeProducts}</p>
        </div>

        {/* Orders Today */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <CalendarDays className="h-4.5 w-4.5 text-amber-600" />
            </div>
          </div>
          <p className="text-[13px] text-slate-500 mb-0.5">Orders Today</p>
          <p className="text-[24px] font-bold text-slate-900 tracking-tight">{metrics.ordersToday}</p>
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Orders Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Orders Trend</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">Last 7 days</p>
            </div>
            <div className="text-right">
              <p className="text-[20px] font-bold text-slate-900 tracking-tight">{metrics.ordersLast7}</p>
              <TrendBadge value={metrics.orderCountChange} />
            </div>
          </div>
          {/* Bar Chart */}
          <div className="flex items-end gap-3 h-[180px]">
            {metrics.ordersByDay.map((day, i) => {
              const height = maxOrders > 0 ? (day.value / maxOrders) * 100 : 0;
              const isToday = i === metrics.ordersByDay.length - 1;
              return (
                <div key={day.label} className="flex-1 flex flex-col items-center gap-2">
                  <p className="text-[10px] font-medium text-slate-500 tabular-nums">
                    {day.value > 0 ? day.value : ''}
                  </p>
                  <div className="w-full flex justify-center" style={{ height: '140px' }}>
                    <div
                      className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ${
                        isToday
                          ? 'bg-gradient-to-t from-indigo-600 to-indigo-400'
                          : 'bg-indigo-100 hover:bg-indigo-200'
                      }`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                  <p className={`text-[11px] font-medium ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {day.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Status Breakdown (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h2 className="text-[15px] font-semibold text-slate-900 mb-1">Order Status</h2>
          <p className="text-[12px] text-slate-400 mb-5">Current pipeline</p>

          {/* Donut-style visual */}
          <div className="flex items-center gap-5 mb-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {(() => {
                  const total = metrics.totalOrders || 1;
                  const segments = metrics.statusBreakdown;
                  let offset = 0;
                  const colors = ['#f59e0b', '#3b82f6', '#10b981'];
                  return segments.map((seg, i) => {
                    const pct = (seg.count / total) * 100;
                    const el = (
                      <circle
                        key={seg.label}
                        cx="18" cy="18" r="15.915"
                        fill="none"
                        stroke={colors[i]}
                        strokeWidth="3.5"
                        strokeDasharray={`${pct} ${100 - pct}`}
                        strokeDashoffset={`${-offset}`}
                        strokeLinecap="round"
                      />
                    );
                    offset += pct;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-[18px] font-bold text-slate-900">{metrics.totalOrders}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">Total</p>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {metrics.statusBreakdown.map(seg => (
                <div key={seg.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
                    <span className="text-[13px] text-slate-600">{seg.label}</span>
                  </div>
                  <span className="text-[14px] font-semibold text-slate-900 tabular-nums">{seg.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            {metrics.pendingOrders > 0 && (
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-amber-50 text-amber-700 text-[12px] font-medium hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {metrics.pendingOrders} order{metrics.pendingOrders !== 1 ? 's' : ''} need confirmation
                <ChevronRight className="h-3 w-3 ml-auto" />
              </button>
            )}
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-slate-500 text-[12px] font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              View all orders
              <ChevronRight className="h-3 w-3 ml-auto" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Second Row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-semibold text-slate-900">Top Products</h2>
            <button
              onClick={() => router.push('/admin/products')}
              className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              View all
            </button>
          </div>
          {metrics.topProducts.length === 0 ? (
            <p className="text-[13px] text-slate-400 text-center py-8">No product data yet</p>
          ) : (
            <div className="space-y-3">
              {metrics.topProducts.map((product, i) => (
                <div key={product.name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-slate-500">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-slate-900 truncate">{product.name}</p>
                    <p className="text-[11px] text-slate-400">{product.count} qty ordered</p>
                  </div>
                  <p className="text-[13px] font-semibold text-slate-900 tabular-nums">{product.count}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-semibold text-slate-900">Top Customers</h2>
            <button
              onClick={() => router.push('/admin/customers')}
              className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              View all
            </button>
          </div>
          {metrics.topCustomers.length === 0 ? (
            <p className="text-[13px] text-slate-400 text-center py-8">No customer data yet</p>
          ) : (
            <div className="space-y-3">
              {metrics.topCustomers.map((cust) => (
                <div key={cust.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-indigo-600">{cust.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-slate-900 truncate">{cust.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {cust.orders} order{cust.orders !== 1 ? 's' : ''} &middot;{' '}
                      <span className={cust.type === 'wholesale' ? 'text-violet-500' : 'text-emerald-500'}>
                        {cust.type}
                      </span>
                    </p>
                  </div>
                  <p className="text-[13px] font-semibold text-slate-900 tabular-nums">{cust.orders}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Business Segments */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h2 className="text-[15px] font-semibold text-slate-900 mb-5">Business Mix</h2>
          <div className="space-y-5">
            {/* Retail vs Wholesale */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-slate-500">Customer Segments</span>
                <span className="text-[12px] font-medium text-slate-700">{metrics.totalCustomers} total</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                {metrics.totalCustomers > 0 && (
                  <>
                    <div
                      className="bg-indigo-500 rounded-l-full transition-all duration-500"
                      style={{ width: `${(metrics.retailCustomers / metrics.totalCustomers) * 100}%` }}
                    />
                    <div
                      className="bg-violet-500 rounded-r-full transition-all duration-500"
                      style={{ width: `${(metrics.wholesaleCustomers / metrics.totalCustomers) * 100}%` }}
                    />
                  </>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-[11px] text-slate-500">Retail ({metrics.retailCustomers})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <span className="text-[11px] text-slate-500">Wholesale ({metrics.wholesaleCustomers})</span>
                </div>
              </div>
            </div>

            {/* Product Stats */}
            <div className="border-t border-slate-100 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Package className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Products</span>
                  </div>
                  <p className="text-[18px] font-bold text-slate-900">{metrics.activeProducts}</p>
                  <p className="text-[10px] text-slate-400">of {metrics.totalProducts} total</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <BarChart3 className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Categories</span>
                  </div>
                  <p className="text-[18px] font-bold text-slate-900">{metrics.categories}</p>
                  <p className="text-[10px] text-slate-400">product groups</p>
                </div>
              </div>
            </div>

            {/* Top Cities */}
            {metrics.topCities.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-[12px] text-slate-500 mb-2.5">Top Locations</p>
                <div className="space-y-1.5">
                  {metrics.topCities.map(([city, count]) => (
                    <div key={city} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span className="text-[12px] text-slate-700">{city}</span>
                      </div>
                      <span className="text-[12px] font-medium text-slate-900 tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Orders ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-900">Recent Orders</h2>
          <button
            onClick={() => router.push('/admin')}
            className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        {metrics.recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ShoppingCart className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-[13px] text-slate-400">No orders yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {metrics.recentOrders.map(order => {
              const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <div
                  key={order.id}
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/70 cursor-pointer transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-indigo-600">{(order.customerName || order.userName)?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-slate-900 truncate">{order.customerName || order.userName}</span>
                      <span className="text-[11px] font-mono text-slate-400">#{order.id}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {order.items[0]?.productName}{order.items.length > 1 ? ` +${order.items.length - 1} more` : ''} &middot; {totalQty} qty
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] text-slate-400">{timeAgo(order.createdAt)}</p>
                  </div>
                  <StatusDot status={order.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

// ── Sub-components ──────────────────────────────────────────
function TrendBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const positive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
      positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
    }`}>
      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const s = status.toLowerCase();
  const color = s === 'delivered' ? 'bg-emerald-500' : s === 'confirmed' ? 'bg-blue-500' : 'bg-amber-500';
  return <div className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />;
}
