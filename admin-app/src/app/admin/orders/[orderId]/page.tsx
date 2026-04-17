'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Package,
  CheckCircle,
  Clock,
  Mail,
  Calendar,
  CreditCard,
  MessageSquare,
  Truck,
  Upload,
  FileText,
  Download,
  Trash2,
  Loader2,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import TopNav from '@/components/admin/TopNav';
import { StatusBadge } from '@/components/admin/OrderDrawer';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  quantity: number;
  total: number;
}

interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  invoiceUrl?: string;
}

interface OrderDetailsPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { orderId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);
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

    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        setOrder(await response.json());
      } else {
        toast({ title: 'Error', description: 'Failed to load order details', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load order details', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, comment: comment.trim() || undefined }),
      });
      if (response.ok) {
        const data = await response.json();
        setOrder({ ...order, status: data.status });
        setComment('');
        toast({ title: 'Success', description: `Order status updated to ${newStatus}` });
      } else {
        const err = await response.json();
        toast({ title: 'Error', description: err.error || 'Failed to update status', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update order status', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('invoice', file);
      const res = await fetch(`/api/orders/${orderId}/invoice`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setOrder({ ...order, invoiceUrl: data.invoiceUrl });
        toast({ title: 'Success', description: 'Invoice uploaded successfully' });
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error || 'Failed to upload invoice', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to upload invoice', variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleInvoiceDelete = async () => {
    if (!order) return;
    setUploading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/invoice`, { method: 'DELETE' });
      if (res.ok) {
        setOrder({ ...order, invoiceUrl: undefined });
        toast({ title: 'Success', description: 'Invoice removed' });
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error || 'Failed to remove invoice', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to remove invoice', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const exportToExcel = async () => {
    if (!order) return;
    const XLSX = await import('xlsx');
    const rows = order.items.map((item) => ({
      'Product ID': item.productId,
      'Product Name': item.productName,
      'Qty': item.quantity,
    }));
    rows.push({ 'Product ID': '', 'Product Name': 'Total', 'Qty': order.items.reduce((s, i) => s + i.quantity, 0) });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 8 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Order Items');
    XLSX.writeFile(wb, `Order-${order.id}.xlsx`);
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

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav currentUser={currentUser} />
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <Package className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-[14px] font-medium text-slate-600 mb-1">Order not found</p>
          <p className="text-[12px] text-slate-400 mb-4">This order may have been removed or doesn&apos;t exist.</p>
          <Button
            onClick={() => router.push('/admin')}
            size="sm"
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-sm shadow-indigo-500/25 rounded-lg"
          >
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav currentUser={currentUser} />

      <main className="max-w-[1000px] mx-auto px-6 py-8">
        {/* Back + Title */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-bold text-slate-900 tracking-[-0.02em]">
                Order #{order.id}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-[13px] text-slate-400 mt-0.5">
              {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
            </p>
          </div>
          <Button
            onClick={exportToExcel}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-[12px] font-medium text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Order Summary */}
          <div className="space-y-6">
            {/* Customer */}
            <div className="bg-white rounded-2xl border border-slate-200/60 premium-shadow p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-4">Customer</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-bold text-indigo-600">
                    {order.userName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-slate-900">{order.userName}</p>
                  <p className="text-[12px] text-slate-500 truncate">{order.userEmail}</p>
                </div>
              </div>
              {order.userEmail && order.userEmail !== 'N/A' && (
                <a
                  href={`mailto:${order.userEmail}`}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Send email
                </a>
              )}
            </div>

            {/* Order Info */}
            <div className="bg-white rounded-2xl border border-slate-200/60 premium-shadow p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-4">Details</h3>
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-slate-500 flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" /> Order Date
                  </span>
                  <span className="text-[13px] font-medium text-slate-900">{formatDate(order.createdAt)}</span>
                </div>
                <Separator className="bg-slate-100" />
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-slate-500 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> Status
                  </span>
                  <StatusBadge status={order.status} />
                </div>
                <Separator className="bg-slate-100" />
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-slate-500 flex items-center gap-2">
                    <Package className="h-3.5 w-3.5" /> Total Qty
                  </span>
                  <span className="text-[15px] font-bold tabular-nums text-slate-900">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-slate-200/60 premium-shadow p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-4">Update Status</h3>

              {order.status.toLowerCase() === 'ordered' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[12px] font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
                      <MessageSquare className="h-3 w-3" /> Admin Comment <span className="text-slate-300">(optional)</span>
                    </label>
                    <Textarea
                      placeholder="Add a note for this order, e.g. items verified, partial stock..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[80px] text-[13px] bg-slate-50/80 border-slate-200/60 rounded-xl resize-none focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300 placeholder:text-slate-400"
                    />
                  </div>
                  <Button
                    onClick={() => updateOrderStatus('Confirmed')}
                    disabled={updating}
                    className="w-full h-10 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-[13px] rounded-xl shadow-sm shadow-indigo-500/25"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {updating ? 'Updating...' : 'Confirm Order'}
                  </Button>
                </div>
              )}

              {order.status.toLowerCase() === 'confirmed' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[12px] font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
                      <MessageSquare className="h-3 w-3" /> Admin Comment <span className="text-slate-300">(optional)</span>
                    </label>
                    <Textarea
                      placeholder="Add delivery details, tracking info..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[80px] text-[13px] bg-slate-50/80 border-slate-200/60 rounded-xl resize-none focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300 placeholder:text-slate-400"
                    />
                  </div>
                  <Button
                    onClick={() => updateOrderStatus('Delivered')}
                    disabled={updating}
                    className="w-full h-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-[13px] rounded-xl shadow-sm shadow-emerald-500/25"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    {updating ? 'Updating...' : 'Mark as Delivered'}
                  </Button>
                </div>
              )}

              {order.status.toLowerCase() === 'delivered' && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-[13px] font-medium text-emerald-600">Order Delivered</span>
                </div>
              )}
            </div>

            {/* Invoice */}
            <div className="bg-white rounded-2xl border border-slate-200/60 premium-shadow p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-4">Invoice / Bill</h3>

              {order.invoiceUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50/80 border border-slate-200/60 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-800 truncate">Invoice attached</p>
                      <p className="text-[11px] text-slate-400">
                        {order.invoiceUrl.endsWith('.pdf') ? 'PDF Document' : 'Image File'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={order.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 text-[12px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 rounded-lg transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </a>
                    <a
                      href={order.invoiceUrl}
                      download
                      className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 text-[12px] font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                    <button
                      onClick={handleInvoiceDelete}
                      disabled={uploading}
                      className="h-9 w-9 inline-flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 border border-red-200/60 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {/* Replace invoice */}
                  <label className="flex items-center justify-center gap-1.5 h-8 text-[11px] font-medium text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                    <Upload className="h-3 w-3" /> Replace invoice
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleInvoiceUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : 'hover:border-indigo-300 hover:bg-indigo-50/30'}`}>
                  {uploading ? (
                    <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200/40 flex items-center justify-center">
                      <Upload className="h-5 w-5 text-indigo-500" />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-[13px] font-medium text-slate-700">
                      {uploading ? 'Uploading...' : 'Upload Invoice'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">PDF, JPEG, PNG or WebP (max 10 MB)</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleInvoiceUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Right: Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200/60 premium-shadow overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-[15px] font-semibold text-slate-900">Order Items</h3>
                <p className="text-[12px] text-slate-400 mt-0.5">{order.items.length} item{order.items.length !== 1 ? 's' : ''} in this order</p>
              </div>

              <div className="divide-y divide-slate-50">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-medium text-slate-900">{item.productName}</h4>
                    </div>
                    <span className="text-[14px] font-semibold tabular-nums text-slate-900 flex-shrink-0">
                      Qty: {item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-slate-900">Total Qty</span>
                  <span className="text-[18px] font-bold tabular-nums text-slate-900">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}