'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Download, 
  ArrowLeft, 
  Calendar,
  Mail,
  Package,
  User,
  X,
} from 'lucide-react';

interface Order {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  status: 'Pending' | 'Confirmed' | 'Delivered';
  createdAt: string;
  userName?: string;
  userEmail?: string;
  productName?: string;
  productPrice?: number;
}

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!order) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-col space-y-1.5 pb-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Order Details</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-2 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Order Header */}
          <div className="flex items-center space-x-4 pb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-amber-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">OF</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
              <Badge className={`${getStatusColor(order.status)}`}>
                {order.status}
              </Badge>
            </div>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Customer</h4>
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-lg">
                      {order.userName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{order.userName}</p>
                    <p className="text-sm text-gray-500">{order.userEmail}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Order Date</h4>
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Product</h4>
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Package className="h-8 w-8 text-indigo-500" />
                  <div>
                    <p className="font-medium text-gray-900">{order.productName}</p>
                    <p className="text-sm text-gray-500">Product ID: {order.productId}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pricing</h4>
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-bold text-green-500">₹</span>
                  <div>
                    <p className="font-medium text-gray-900">₹{order.productPrice?.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">per unit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Order Details</h4>
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="font-medium text-gray-900">{order.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Price</p>
                    <p className="font-medium text-gray-900">₹{((order.productPrice || 0) * order.quantity).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Status</h4>
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge className={`${getStatusColor(order.status)}`}>
                    {order.status}
                  </Badge>
                  <p className="font-medium text-gray-900 capitalize">{order.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Contact Information</h4>
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{order.userEmail}</p>
                    <p className="text-sm text-gray-500">Customer Email</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-6">
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}