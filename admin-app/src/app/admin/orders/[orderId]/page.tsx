'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Pencil,
  Plus,
  Minus,
  X,
  Search,
  Save,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/admin/OrderDrawer';
import {
  DELIVERY_SLOTS,
  formatDeliverySlot,
  formatDeliveryDate,
  isDeliveryOverdue,
  relativeDeliveryLabel,
  todayDateInputValue,
} from '@/lib/delivery';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  quantity: number;
  total: number;
  size?: string | null;
}

interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  customerId?: string | null;
  customerName?: string | null;
  customerStoreName?: string | null;
  customerMobile?: string | null;
  customerEmail?: string | null;
  customerType?: string | null;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  invoiceUrl?: string;
  createdBy?: string;
  deliveryDate?: string | null;
  deliverySlot?: string | null;
  deliveryDateHistory?: Array<{
    from: string | null;
    to: string | null;
    slot_from: string | null;
    slot_to: string | null;
    reason: string;
    by: string;
    at: string;
  }>;
  cancellationReason?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
}

interface OrderDetailsPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

interface Product {
  id: string;
  name: string;
  sellingMode: string;
  retailSizes: string[];
  wholesaleSizes: string[];
}

interface EditItem {
  productId: string;
  productName: string;
  quantity: number;
  size: string | null;
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { orderId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [comment, setComment] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [editingDelivery, setEditingDelivery] = useState(false);
  const [reschedulingSubmitting, setReschedulingSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);

  useEffect(() => {
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

  // ── Edit Mode Helpers ─────────────────────────────────────
  const startEditing = async () => {
    if (!order) return;
    setEditItems(order.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      size: item.size || null,
    })));
    // Fetch products for the picker
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.filter((p: any) => p.isActive));
      }
    } catch {
      console.error('Failed to load products');
    }
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditItems([]);
    setProductSearch('');
    setShowProductPicker(false);
  };

  const updateItemQty = (index: number, delta: number) => {
    setEditItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const newQty = Math.max(1, item.quantity + delta);
      return { ...item, quantity: newQty };
    }));
  };

  const removeEditItem = (index: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const addProduct = (product: Product, size: string | null) => {
    // Check if same product + size already exists
    const existing = editItems.findIndex(
      item => item.productId === product.id && item.size === size
    );
    if (existing >= 0) {
      updateItemQty(existing, 1);
    } else {
      setEditItems(prev => [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        size,
      }]);
    }
    setProductSearch('');
    setShowProductPicker(false);
  };

  const saveOrderItems = async () => {
    if (editItems.length === 0) {
      toast({ title: 'Error', description: 'Order must have at least one item', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: editItems }),
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        setOrder(updatedOrder);
        setIsEditing(false);
        setEditItems([]);
        toast({ title: 'Success', description: 'Order items updated successfully' });
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error || 'Failed to update order', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update order items', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (!p.name.toLowerCase().includes(productSearch.toLowerCase())) return false;
    const ct = order?.customerType?.toLowerCase();
    const mode = p.sellingMode?.toLowerCase();
    if (ct === 'retail' && mode === 'wholesale') return false;
    if (ct === 'wholesale' && mode === 'retail') return false;
    return true;
  }).slice(0, 8);

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;
    if (newStatus === 'Confirmed' && (!deliveryDate || !deliverySlot)) {
      toast({
        title: 'Delivery details required',
        description: 'Please select a delivery date and slot before confirming the order.',
        variant: 'destructive',
      });
      return;
    }
    setUpdating(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          comment: comment.trim() || undefined,
          deliveryDate: newStatus === 'Confirmed' ? deliveryDate : undefined,
          deliverySlot: newStatus === 'Confirmed' ? deliverySlot : undefined,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setOrder({
          ...order,
          status: data.status,
          deliveryDate: data.deliveryDate ?? order.deliveryDate,
          deliverySlot: data.deliverySlot ?? order.deliverySlot,
        });
        setComment('');
        toast({ title: 'Success', description: `Order status updated to ${newStatus}` });
        
        // Notification Flow
        if (newStatus === 'Confirmed' && data.id) {
          await triggerNotification(orderId, order.userId);
        }
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

  const triggerNotification = async (orderId: string, userId: string) => {
    setSendingNotification(true);
    try {
      // We call the API to send the notification. 
      // The current API already does this on status change, but we can make it explicit 
      // or ensure the user knows it's happening.
      // If we want a separate step, we can create a dedicated API route.
      
      const response = await fetch(`/api/orders/${orderId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast({ title: 'Notification Sent', description: 'Customer has been notified of the confirmation.' });
      } else {
        const err = await response.json();
        toast({ title: 'Notification Failed', description: err.error || 'Could not notify customer', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Notification Error', description: 'An error occurred while sending notification', variant: 'destructive' });
    } finally {
      setSendingNotification(false);
    }
  };

  const cancelOrder = async () => {
    if (!order || !cancelReason.trim()) return;
    setCancelling(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Cancelled',
          cancellationReason: cancelReason.trim(),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setOrder({
          ...order,
          status: data.status,
          cancellationReason: data.cancellationReason,
          cancelledBy: data.cancelledBy,
          cancelledAt: data.cancelledAt,
        });
        setShowCancelConfirm(false);
        setCancelReason('');
        toast({ title: 'Order Cancelled', description: `Order #${order.id} has been cancelled.` });
      } else {
        const err = await response.json();
        toast({ title: 'Error', description: err.error || 'Failed to cancel order', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to cancel order', variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  };

  const submitReschedule = async () => {
    if (!order) return;
    if (!deliveryDate || !deliverySlot) {
      toast({ title: 'Missing details', description: 'Date and slot are required.', variant: 'destructive' });
      return;
    }
    if (!rescheduleReason.trim()) {
      toast({ title: 'Reason required', description: 'Please provide a reason for rescheduling.', variant: 'destructive' });
      return;
    }
    setReschedulingSubmitting(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryDate,
          deliverySlot,
          rescheduleReason: rescheduleReason.trim(),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setOrder({
          ...order,
          deliveryDate: data.deliveryDate ?? deliveryDate,
          deliverySlot: data.deliverySlot ?? deliverySlot,
        });
        setEditingDelivery(false);
        setRescheduleReason('');
        toast({ title: 'Rescheduled', description: 'Delivery details updated.' });
      } else {
        const err = await response.json();
        toast({ title: 'Error', description: err.error || 'Failed to reschedule', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to reschedule delivery', variant: 'destructive' });
    } finally {
      setReschedulingSubmitting(false);
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
      'Size': item.size || '',
      'Qty': item.quantity,
    }));
    rows.push({ 'Product ID': '', 'Product Name': 'Total', 'Size': '', 'Qty': order.items.reduce((s, i) => s + i.quantity, 0) });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 12 }, { wch: 8 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Order Items');
    XLSX.writeFile(wb, `Order-${order.id}.xlsx`);
  };

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

  if (!order) {
    return (
      <div>
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
              {order.createdBy === 'admin' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-200/60">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                  Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200/60">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                  Customer
                </span>
              )}
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
            <div
              className={`bg-white rounded-2xl border border-slate-200/60 premium-shadow p-5 transition-all ${
                order.customerId
                  ? 'cursor-pointer hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/10 group'
                  : ''
              }`}
              onClick={() => {
                if (order.customerId) {
                  router.push(`/admin/customers/${order.customerId}/edit`);
                }
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Customer</h3>
                {order.customerId && (
                  <span className="text-[11px] font-medium text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    View Profile →
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-bold text-indigo-600">
                    {order.userName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">{order.userName}</p>
                  {order.customerStoreName && (
                    <p className="text-[12px] text-slate-500 truncate">{order.customerStoreName}</p>
                  )}
                  <p className="text-[12px] text-slate-400 truncate">
                    {order.customerMobile || order.userEmail}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {order.customerType && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    order.customerType === 'wholesale'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
                      : 'bg-blue-50 text-blue-700 border border-blue-200/50'
                  }`}>
                    {order.customerType === 'wholesale' ? 'Wholesale' : 'Retail'}
                  </span>
                )}
                {order.customerEmail && order.customerEmail !== 'N/A' && (
                  <a
                    href={`mailto:${order.customerEmail}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </a>
                )}
                {!order.customerEmail && order.userEmail && order.userEmail !== 'N/A' && (
                  <a
                    href={`mailto:${order.userEmail}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </a>
                )}
              </div>
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
                <Separator className="bg-slate-100" />
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[13px] text-slate-500 flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5" /> Delivery
                  </span>
                  <div className="text-right">
                    {order.deliveryDate ? (
                      <>
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[13px] font-medium text-slate-900">{formatDeliveryDate(order.deliveryDate)}</span>
                          {isDeliveryOverdue(order.deliveryDate, order.status) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                              <AlertTriangle className="h-2.5 w-2.5" /> Overdue
                            </span>
                          )}
                        </div>
                        {order.deliverySlot && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{formatDeliverySlot(order.deliverySlot)}</div>
                        )}
                      </>
                    ) : (
                      <span className="text-[12px] text-slate-400 italic">Not scheduled</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-slate-200/60 premium-shadow p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-4">Update Status</h3>

              {order.status.toLowerCase() === 'ordered' && (
                <div className="space-y-4">
                  {/* Delivery Date */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 flex items-center gap-1.5 mb-2">
                      <Calendar className="h-3 w-3" /> Delivery Date
                    </label>
                    <input
                      type="date"
                      min={todayDateInputValue()}
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full h-11 text-[13px] px-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 transition-shadow shadow-sm"
                    />
                  </div>

                  {/* Delivery Slot — chip group (no dropdown, no overlap) */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 flex items-center gap-1.5 mb-2">
                      <Clock className="h-3 w-3" /> Time Slot
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {DELIVERY_SLOTS.map((s) => {
                        const active = deliverySlot === s.value;
                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setDeliverySlot(s.value)}
                            className={`relative flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                              active
                                ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-violet-50 ring-2 ring-indigo-500/15 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <span className={`text-[12px] font-semibold ${active ? 'text-indigo-700' : 'text-slate-700'}`}>
                              {s.label}
                            </span>
                            <span className={`text-[10px] leading-tight ${active ? 'text-indigo-500' : 'text-slate-400'}`}>
                              {s.range}
                            </span>
                            {active && (
                              <CheckCircle className="absolute top-1.5 right-1.5 h-3 w-3 text-indigo-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 flex items-center gap-1.5 mb-2">
                      <MessageSquare className="h-3 w-3" /> Admin Comment <span className="text-slate-300 font-normal normal-case tracking-normal">(optional)</span>
                    </label>
                    <Textarea
                      placeholder="Items verified, partial stock, customer note..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[72px] text-[13px] bg-white border-slate-200 rounded-xl resize-none focus-visible:ring-2 focus-visible:ring-indigo-500/15 focus-visible:border-indigo-400 placeholder:text-slate-400"
                    />
                  </div>

                  <Button
                    onClick={() => updateOrderStatus('Confirmed')}
                    disabled={updating || sendingNotification || !deliveryDate || !deliverySlot}
                    className="w-full h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-[13px] rounded-xl shadow-md shadow-indigo-500/25 disabled:shadow-none disabled:opacity-50"
                  >
                    {sendingNotification ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {updating ? 'Confirming...' : sendingNotification ? 'Sending Notification...' : 'Confirm Order'}
                  </Button>
                </div>
              )}

              {order.status.toLowerCase() === 'confirmed' && (
                <div className="space-y-4">
                  {/* Scheduled delivery summary */}
                  <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Truck className="h-3 w-3 text-indigo-500" />
                          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Scheduled Delivery</span>
                        </div>
                        <div className="text-[14px] font-semibold text-slate-900 leading-tight">
                          {order.deliveryDate ? formatDeliveryDate(order.deliveryDate) : '—'}
                        </div>
                        {order.deliverySlot && (
                          <div className="text-[12px] text-slate-500 mt-0.5">{order.deliverySlot} · {DELIVERY_SLOTS.find(s => s.value === order.deliverySlot)?.range}</div>
                        )}
                        <div className="mt-2">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${
                            isDeliveryOverdue(order.deliveryDate, order.status)
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                          }`}>
                            {isDeliveryOverdue(order.deliveryDate, order.status) && <AlertTriangle className="h-2.5 w-2.5" />}
                            {relativeDeliveryLabel(order.deliveryDate, order.status)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDelivery(true);
                          setDeliveryDate(order.deliveryDate || '');
                          setDeliverySlot(order.deliverySlot || '');
                          setRescheduleReason('');
                        }}
                        className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 px-2.5 py-1 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        Reschedule
                      </button>
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 flex items-center gap-1.5 mb-2">
                      <MessageSquare className="h-3 w-3" /> Admin Comment <span className="text-slate-300 font-normal normal-case tracking-normal">(optional)</span>
                    </label>
                    <Textarea
                      placeholder="Delivery details, tracking info, special instructions..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[72px] text-[13px] bg-white border-slate-200 rounded-xl resize-none focus-visible:ring-2 focus-visible:ring-emerald-500/15 focus-visible:border-emerald-400 placeholder:text-slate-400"
                    />
                  </div>
                  <Button
                    onClick={() => updateOrderStatus('Delivered')}
                    disabled={updating}
                    className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-[13px] rounded-xl shadow-md shadow-emerald-500/25"
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

              {order.status.toLowerCase() === 'cancelled' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 py-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-[13px] font-medium text-red-600">Order Cancelled</span>
                  </div>
                  {order.cancellationReason && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200/60">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-red-700 mb-1">Reason</p>
                      <p className="text-[13px] text-red-600">{order.cancellationReason}</p>
                    </div>
                  )}
                  {order.cancelledAt && (
                    <p className="text-[11px] text-slate-400 text-center">
                      Cancelled on {formatDate(order.cancelledAt)} at {formatTime(order.cancelledAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Cancel Order */}
              {(order.status.toLowerCase() === 'ordered' || order.status.toLowerCase() === 'confirmed') && (
                <>
                  <Separator className="bg-slate-100 my-4" />
                  {!showCancelConfirm ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelConfirm(true)}
                      className="w-full h-10 text-[13px] font-medium border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Order
                    </Button>
                  ) : (
                    <div className="space-y-3 p-4 rounded-xl bg-red-50/50 border border-red-200/60">
                      <p className="text-[13px] font-semibold text-red-700">Are you sure you want to cancel this order?</p>
                      <p className="text-[12px] text-red-600/80">This action cannot be undone. The customer will be notified.</p>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Reason for cancellation (required)..."
                        rows={3}
                        className="w-full text-[13px] px-3 py-2.5 bg-white border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/15 focus:border-red-400 placeholder:text-slate-400 resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => { setShowCancelConfirm(false); setCancelReason(''); }}
                          disabled={cancelling}
                          className="flex-1 h-10 text-[13px] border-slate-200 text-slate-600 rounded-xl"
                        >
                          Go Back
                        </Button>
                        <Button
                          onClick={cancelOrder}
                          disabled={cancelling || !cancelReason.trim()}
                          className="flex-1 h-10 text-[13px] bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
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
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-900">Order Items</h3>
                  <p className="text-[12px] text-slate-400 mt-0.5">
                    {isEditing ? `${editItems.length} item${editItems.length !== 1 ? 's' : ''}` : `${order.items.length} item${order.items.length !== 1 ? 's' : ''} in this order`}
                  </p>
                </div>
                {order.status.toLowerCase() !== 'delivered' && order.status.toLowerCase() !== 'cancelled' && !isEditing && (
                  <button
                    onClick={startEditing}
                    className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 rounded-lg transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                )}
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={cancelEditing}
                      disabled={saving}
                      className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </button>
                    <button
                      onClick={saveOrderItems}
                      disabled={saving || editItems.length === 0}
                      className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {/* View Mode */}
              {!isEditing && (
                <>
                  <div className="divide-y divide-slate-50">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[14px] font-medium text-slate-900">{item.productName}</h4>
                          {item.size && (
                            <span className="inline-block mt-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                              {item.size}
                            </span>
                          )}
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
                </>
              )}

              {/* Edit Mode */}
              {isEditing && (
                <>
                  <div className="divide-y divide-slate-50">
                    {editItems.map((item, index) => (
                      <div key={`${item.productId}-${item.size}-${index}`} className="flex items-center gap-4 px-5 py-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[14px] font-medium text-slate-900">{item.productName}</h4>
                          {item.size && (
                            <span className="inline-block mt-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                              {item.size}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => updateItemQty(index, -1)}
                            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-10 text-center text-[14px] font-semibold tabular-nums text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateItemQty(index, 1)}
                            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeEditItem(index)}
                            className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors cursor-pointer ml-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {editItems.length === 0 && (
                      <div className="px-5 py-8 text-center">
                        <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-[13px] text-slate-400">No items. Add products below.</p>
                      </div>
                    )}
                  </div>

                  {/* Add Product */}
                  <div className="px-5 py-4 border-t border-slate-100">
                    {!showProductPicker ? (
                      <button
                        onClick={() => setShowProductPicker(true)}
                        className="flex items-center gap-2 w-full h-10 px-4 text-[13px] font-medium text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 border border-dashed border-indigo-200 rounded-xl transition-colors cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        Add Product
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder="Search products..."
                            autoFocus
                            className="w-full h-10 pl-9 pr-8 text-[13px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 placeholder:text-slate-400"
                          />
                          <button
                            onClick={() => { setShowProductPicker(false); setProductSearch(''); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="max-h-[280px] overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-50">
                          {filteredProducts.length === 0 ? (
                            <div className="px-4 py-6 text-center">
                              <p className="text-[13px] text-slate-400">
                                {productSearch ? 'No products found' : 'Type to search products'}
                              </p>
                            </div>
                          ) : (
                            filteredProducts.map(product => {
                              const customerType = order.customerType?.toLowerCase();
                              const sizes = customerType === 'wholesale'
                                ? product.wholesaleSizes
                                : customerType === 'retail'
                                  ? product.retailSizes
                                  : [...product.retailSizes, ...product.wholesaleSizes];
                              const uniqueSizes = [...new Set(sizes)];

                              return (
                                <div key={product.id} className="px-4 py-3">
                                  <p className="text-[13px] font-medium text-slate-900 mb-2">{product.name}</p>
                                  {uniqueSizes.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {uniqueSizes.map(size => (
                                        <button
                                          key={size}
                                          onClick={() => addProduct(product, size)}
                                          className="text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full border border-indigo-200/50 transition-colors cursor-pointer"
                                        >
                                          + {size}
                                        </button>
                                      ))}
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => addProduct(product, null)}
                                      className="text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full border border-indigo-200/50 transition-colors cursor-pointer"
                                    >
                                      + Add
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-semibold text-slate-900">Total Qty</span>
                      <span className="text-[18px] font-bold tabular-nums text-slate-900">{editItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Reschedule Delivery Dialog */}
        <Dialog open={editingDelivery} onOpenChange={(o) => { if (!o) { setEditingDelivery(false); setRescheduleReason(''); } }}>
          <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
              <DialogHeader className="space-y-1.5">
                <DialogTitle className="text-[17px] font-semibold tracking-tight text-slate-900 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600">
                    <Calendar className="h-4 w-4" />
                  </span>
                  Reschedule Delivery
                </DialogTitle>
                <DialogDescription className="text-[12.5px] text-slate-500">
                  Update the delivery date or time slot. The customer will be notified.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Currently scheduled */}
              {(order.deliveryDate || order.deliverySlot) && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <div className="text-[12px] text-slate-500">
                    Currently:{' '}
                    <span className="font-semibold text-slate-700">
                      {order.deliveryDate ? formatDeliveryDate(order.deliveryDate) : '—'}
                      {order.deliverySlot && <> · {order.deliverySlot}</>}
                    </span>
                  </div>
                </div>
              )}

              {/* New date */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 flex items-center gap-1.5 mb-2">
                  <Calendar className="h-3 w-3" /> New Delivery Date
                </label>
                <input
                  type="date"
                  min={todayDateInputValue()}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full h-11 text-[13px] px-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 shadow-sm"
                />
              </div>

              {/* New slot — chip group */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 flex items-center gap-1.5 mb-2">
                  <Clock className="h-3 w-3" /> New Time Slot
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DELIVERY_SLOTS.map((s) => {
                    const active = deliverySlot === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setDeliverySlot(s.value)}
                        className={`relative flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                          active
                            ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-violet-50 ring-2 ring-indigo-500/15'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`text-[12px] font-semibold ${active ? 'text-indigo-700' : 'text-slate-700'}`}>{s.label}</span>
                        <span className={`text-[10px] leading-tight ${active ? 'text-indigo-500' : 'text-slate-400'}`}>{s.range}</span>
                        {active && <CheckCircle className="absolute top-1.5 right-1.5 h-3 w-3 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 flex items-center gap-1.5 mb-2">
                  <MessageSquare className="h-3 w-3" /> Reason <span className="text-red-500 font-normal normal-case tracking-normal">*</span>
                </label>
                <Textarea
                  placeholder="Customer request, stock unavailable, route change..."
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="min-h-[72px] text-[13px] bg-white border-slate-200 rounded-xl resize-none focus-visible:ring-2 focus-visible:ring-indigo-500/15 focus-visible:border-indigo-400 placeholder:text-slate-400"
                />
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-row gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => { setEditingDelivery(false); setRescheduleReason(''); }}
                className="h-9 px-4 text-[13px] font-medium border-slate-200 text-slate-700 hover:bg-white"
              >
                Cancel
              </Button>
              <Button
                onClick={submitReschedule}
                disabled={reschedulingSubmitting || !deliveryDate || !deliverySlot || !rescheduleReason.trim()}
                className="h-9 px-5 text-[13px] font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-sm shadow-indigo-500/25 disabled:shadow-none"
              >
                {reschedulingSubmitting ? 'Saving...' : 'Save Reschedule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
  );
}