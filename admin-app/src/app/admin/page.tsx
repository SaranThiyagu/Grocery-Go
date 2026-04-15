'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Download,
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  Package,
  Users,
  TrendingUp,
} from 'lucide-react';
import * as XLSX from 'xlsx';

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

interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
}

export default function AdminPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    // Get current user from localStorage
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }

    // Fetch orders from API
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        } else {
          console.error('Failed to fetch orders');
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        // Set loading to false after initialization
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    // Filter orders based on search and status
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const handleOrderClick = (order: Order) => {
    // Redirect to order details page instead of showing modal
    router.push(`/admin/orders/${order.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExportToExcel = () => {
    const exportData = filteredOrders.flatMap(order =>
      order.items.map(item => ({
        'Order ID': order.id,
        'Customer Name': order.userName,
        'Customer Email': order.userEmail,
        'Product': item.productName,
        'Quantity': item.quantity,
        'Unit Price': `₹${item.productPrice.toFixed(2)}`,
        'Item Total': `₹${item.total.toFixed(2)}`,
        'Order Total': `₹${order.totalAmount.toFixed(2)}`,
        'Status': order.status,
        'Order Date': new Date(order.createdAt).toLocaleDateString(),
        'Order Time': new Date(order.createdAt).toLocaleTimeString()
      }))
    );

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');

    const fileName = `orders_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';

    // Only try to sign out from Firebase if it's not a dummy user
    if (currentUser && !currentUser.isDummy) {
      // Simple Firebase sign out without complex import
      import('firebase/auth').then(({ signOut }) => {
        import('@/lib/firebase').then(({ auth }) => {
          signOut(auth).catch(console.error);
        }).catch(() => {
          console.log('Firebase lib not available');
        });
      }).catch(() => {
        // Silently fail if Firebase is not available
        console.log('Firebase sign out skipped');
      });
    }
    router.push('/login');
  };

  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter(o => o.status === 'PENDING').length;
  const confirmedOrders = filteredOrders.filter(o => o.status === 'CONFIRMED').length;
  const deliveredOrders = filteredOrders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-amber-500 rounded-full flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-2xl">OF</span>
          </div>
          <p className="text-gray-600 mt-4">Loading admin panel...</p>
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
              <h1 className="text-xl font-bold text-gray-900">OrderFlow Admin</h1>
            </div>

            <div className="flex items-center space-x-4">
              {currentUser && (
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser.photoURL} alt={currentUser.displayName} />
                    <AvatarFallback>{currentUser.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-700 block">{currentUser.displayName}</span>
                    {currentUser.isDummy && (
                      <span className="text-xs text-amber-600">Demo Account</span>
                    )}
                  </div>
                </div>
              )}
              <Button
                onClick={() => router.push('/admin/products')}
                variant="outline"
                size="sm"
                className="border-gray-200 hover:bg-gray-50"
              >
                <Package className="h-4 w-4 mr-2" />
                Products
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-gray-200 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Delivered Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{deliveredOrders}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmed Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{confirmedOrders}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card className="bg-white border-0 shadow-sm" >
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 gap-3">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleExportToExcel}
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-700 text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100">
                    <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleOrderClick(order)}
                    >
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.id}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {order.userName?.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm text-gray-900">{order.userName}</div>
                            <div className="text-sm text-gray-500">{order.userEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.items.length > 0 ? (
                          <div>
                            <div>{order.items[0].productName}</div>
                            {order.items.length > 1 && (
                              <div className="text-xs text-gray-500">+{order.items.length - 1} more</div>
                            )}
                          </div>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(order.status)} border`}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderClick(order);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}