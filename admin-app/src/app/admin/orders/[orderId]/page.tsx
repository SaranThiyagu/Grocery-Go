'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Package,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
}

interface OrderDetailsPageProps {
  params: {
    orderId: string;
  };
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [params.orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        console.error('Failed to fetch order');
        toast({
          title: 'Error',
          description: 'Failed to load order details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: 'Error',
        description: 'Failed to load order details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/orders/${params.orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrder({ ...order, status: data.status });
        toast({
          title: 'Success',
          description: `Order status updated to ${newStatus}`,
        });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-amber-500 rounded-full flex items-center justify-center animate-spin mx-auto">
            <span className="text-white font-bold text-2xl">OF</span>
          </div>
          <p className="text-gray-600 mt-4">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Order not found</p>
          <Button onClick={() => router.push('/admin')} className="mt-4">
            Back to Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">OF</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Order Details</h1>
            </div>

            <Button
              onClick={() => router.push('/admin')}
              variant="outline"
              size="sm"
              className="border-gray-200 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Order ID:</span>
                <span className="font-medium text-gray-900">{order.id}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge
                  variant="outline"
                  className={`${getStatusColor(order.status)} border`}
                >
                  {order.status}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Order Date:</span>
                <span className="font-medium text-gray-900">{formatDate(order.createdAt)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Customer:</span>
                <span className="font-medium text-gray-900">{order.userName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{order.userEmail}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="font-bold text-lg text-gray-900">{formatCurrency(order.totalAmount)}</span>
              </div>

              {/* Status Update Buttons */}
              <div className="pt-4 space-y-2">
                {order.status === 'PENDING' && (
                  <Button
                    onClick={() => updateOrderStatus('CONFIRMED')}
                    disabled={updating}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Order
                  </Button>
                )}

                {order.status === 'CONFIRMED' && (
                  <Button
                    onClick={() => updateOrderStatus('COMPLETED')}
                    disabled={updating}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                )}

                {order.status === 'COMPLETED' && (
                  <div className="text-center py-2">
                    <span className="text-sm text-green-600 font-medium">✓ Order Completed</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="bg-white border-0 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Order Items</CardTitle>
              <CardDescription className="text-gray-600">
                Products purchased in this order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-8 h-8 text-indigo-500" />
                    </div>

                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.productName}</h4>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-500">Price: {formatCurrency(item.productPrice)}</p>
                      <p className="text-sm font-medium text-gray-900">Subtotal: {formatCurrency(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}