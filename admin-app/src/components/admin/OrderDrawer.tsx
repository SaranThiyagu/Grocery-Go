'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Package,
  User,
  Calendar,
  CreditCard,
  Clock,
  CheckCircle2,
  CircleDot,
  ArrowRight,
  ExternalLink,
  Mail,
  Hash,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  quantity: number;
  total: number;
  size?: string | null;
}

export interface Order {
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
}

interface OrderDrawerProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate?: (orderId: string, newStatus: string) => Promise<void>;
}

export function getStatusConfig(status: string) {
  const s = status.toLowerCase();
  switch (s) {
    case 'ordered':
      return { label: 'Ordered', className: 'bg-amber-50 text-amber-700 border-amber-200/60', dot: 'bg-amber-500', dotPulse: true };
    case 'confirmed':
      return { label: 'Confirmed', className: 'bg-blue-50 text-blue-700 border-blue-200/60', dot: 'bg-blue-500', dotPulse: false };
    case 'delivered':
      return { label: 'Delivered', className: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', dot: 'bg-emerald-500', dotPulse: false };
    default:
      return { label: status, className: 'bg-slate-50 text-slate-600 border-slate-200/60', dot: 'bg-slate-400', dotPulse: false };
  }
}

export function StatusBadge({ status }: { status: string }) {
  const config = getStatusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${config.className}`}>
      <span className="relative flex h-1.5 w-1.5">
        {config.dotPulse && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-50 animate-ping`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dot}`} />
      </span>
      {config.label}
    </span>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Timeline step data
function getTimeline(status: string, createdAt: string, updatedAt: string) {
  const s = status.toLowerCase();
  const steps = [
    { label: 'Ordered', time: formatDate(createdAt) + ' • ' + formatTime(createdAt), done: true },
    { label: 'Confirmed', time: s === 'confirmed' || s === 'delivered' ? formatDate(updatedAt) : '', done: s === 'confirmed' || s === 'delivered' },
    { label: 'Delivered', time: s === 'delivered' ? formatDate(updatedAt) : '', done: s === 'delivered' },
  ];
  return steps;
}

export default function OrderDrawer({ order, open, onOpenChange, onStatusUpdate }: OrderDrawerProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  if (!order) return null;

  const timeline = getTimeline(order.status, order.createdAt, order.updatedAt);
  const statusLower = order.status.toLowerCase();

  const handleStatusUpdate = async (newStatus: string) => {
    if (!onStatusUpdate) return;
    setUpdating(true);
    try {
      await onStatusUpdate(order.id, newStatus);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[440px] p-0 flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <SheetHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-[17px] font-semibold text-slate-900 tracking-tight">
                Order #{order.id}
              </SheetTitle>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-[12px] text-slate-400">
              Placed on {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
            </p>
          </SheetHeader>
        </div>

        {/* Scrollable body */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-6">
            {/* Customer Section */}
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-3">Customer</h3>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[12px] font-bold text-indigo-600">{order.userName?.charAt(0)?.toUpperCase() || '?'}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-slate-900 truncate">{order.userName}</p>
                  {order.customerStoreName && (
                    <p className="text-[11px] text-slate-500 truncate">{order.customerStoreName}</p>
                  )}
                  <p className="text-[12px] text-slate-400 truncate">{order.customerMobile || order.userEmail}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {order.customerType && (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      order.customerType === 'wholesale'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {order.customerType === 'wholesale' ? 'W' : 'R'}
                    </span>
                  )}
                  {(order.customerEmail || (order.userEmail && order.userEmail !== 'N/A')) && (
                    <a href={`mailto:${order.customerEmail || order.userEmail}`} className="p-1.5 rounded-md hover:bg-slate-100 transition-colors">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                    </a>
                  )}
                </div>
              </div>
            </section>

            {/* Items Section */}
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-3">
                Items ({order.items.length})
              </h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-900 truncate">{item.productName}</p>
                        <p className="text-[11px] text-slate-400">{formatCurrency(item.productPrice)} × {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-[13px] font-semibold tabular-nums text-slate-900 flex-shrink-0 ml-3">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Payment Summary */}
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-3">Payment</h3>
              <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-4 space-y-2.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="tabular-nums text-slate-700">{formatCurrency(order.totalAmount)}</span>
                </div>
                <Separator className="bg-slate-200/60" />
                <div className="flex justify-between text-[14px]">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="font-bold tabular-nums text-slate-900">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </section>

            {/* Timeline */}
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-3">Timeline</h3>
              <div className="space-y-0">
                {timeline.map((step, idx) => (
                  <div key={step.label} className="flex gap-3">
                    {/* Connector line + dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${step.done ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                      {idx < timeline.length - 1 && (
                        <div className={`w-px flex-1 my-1 ${step.done ? 'bg-indigo-300' : 'bg-slate-200'}`} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className={`text-[13px] font-medium ${step.done ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                      {step.time && <p className="text-[11px] text-slate-400 mt-0.5">{step.time}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white space-y-2">
          {/* Status action button */}
          {statusLower === 'ordered' && onStatusUpdate && (
            <Button
              size="sm"
              disabled={updating}
              className="w-full h-9 text-[13px] font-medium bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-sm shadow-indigo-500/25"
              onClick={() => handleStatusUpdate('Confirmed')}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              {updating ? 'Updating...' : 'Confirm Order'}
            </Button>
          )}
          {statusLower === 'confirmed' && onStatusUpdate && (
            <Button
              size="sm"
              disabled={updating}
              className="w-full h-9 text-[13px] font-medium bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm shadow-emerald-500/25"
              onClick={() => handleStatusUpdate('Delivered')}
            >
              <Package className="h-3.5 w-3.5 mr-1.5" />
              {updating ? 'Updating...' : 'Mark as Delivered'}
            </Button>
          )}
          {statusLower === 'delivered' && (
            <div className="flex items-center justify-center gap-2 py-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-[13px] font-medium text-emerald-600">Order Delivered</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-9 text-[13px] font-medium border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={() => {
                onOpenChange(false);
                router.push(`/admin/orders/${order.id}`);
              }}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Full Details
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
