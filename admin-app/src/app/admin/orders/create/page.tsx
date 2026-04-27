'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Package,
  Search,
  Plus,
  Minus,
  Trash2,
  Loader2,
  X,
  Users,
  ShoppingBag,
  Check,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  fullName: string;
  storeName: string | null;
  mobileNo: string;
  customerType: string | null;
}

interface Product {
  id: string;
  name: string;
  sellingMode: string;
  retailSizes: string[];
  wholesaleSizes: string[];
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  size: string | null;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerPicker, setShowCustomerPicker] = useState(true);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);

  // Load customers and products
  useEffect(() => {
    (async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/products'),
        ]);
        if (custRes.ok) {
          const data = await custRes.json();
          setCustomers(data.filter((c: any) => c.status === 'active'));
        }
        if (prodRes.ok) {
          const data = await prodRes.json();
          setProducts(data.filter((p: any) => p.isActive));
        }
      } catch {
        toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
      } finally {
        setLoadingData(false);
      }
    })();
  }, [toast]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 10);
    const term = customerSearch.toLowerCase();
    return customers.filter(c =>
      c.fullName.toLowerCase().includes(term) ||
      c.mobileNo.includes(term) ||
      c.storeName?.toLowerCase().includes(term)
    ).slice(0, 10);
  }, [customers, customerSearch]);

  // Filter products based on customer type and selling mode
  const filteredProducts = useMemo(() => {
    let result = products;
    if (selectedCustomer?.customerType) {
      const ct = selectedCustomer.customerType.toLowerCase();
      result = result.filter(p => {
        const mode = p.sellingMode?.toLowerCase();
        if (ct === 'retail' && mode === 'wholesale') return false;
        if (ct === 'wholesale' && mode === 'retail') return false;
        return true;
      });
    }
    if (productSearch.trim()) {
      const term = productSearch.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(term));
    }
    return result.slice(0, 8);
  }, [products, selectedCustomer, productSearch]);

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerPicker(false);
    setCustomerSearch('');
    // Clear items when customer changes (sizes may differ)
    setItems([]);
  };

  const addProduct = (product: Product, size: string | null) => {
    const existing = items.findIndex(
      item => item.productId === product.id && item.size === size
    );
    if (existing >= 0) {
      setItems(prev => prev.map((item, i) =>
        i === existing ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setItems(prev => [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        size,
      }]);
    }
    setProductSearch('');
    setShowProductPicker(false);
  };

  const updateQty = (index: number, delta: number) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast({ title: 'Error', description: 'Please select a customer', variant: 'destructive' });
      return;
    }
    if (items.length === 0) {
      toast({ title: 'Error', description: 'Please add at least one item', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          items,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast({ title: 'Success', description: 'Order created successfully' });
        router.push(`/admin/orders/${data.id}`);
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.error || 'Failed to create order', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create order', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
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

  return (
    <main className="max-w-[1000px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.push('/admin')}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-[22px] font-bold text-slate-900 tracking-[-0.02em]">Create Order</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Add items and submit a new order</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-4">Customer</h3>

            {selectedCustomer ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[13px] font-bold text-indigo-600">
                      {selectedCustomer.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-slate-900">{selectedCustomer.fullName}</p>
                    <p className="text-[12px] text-slate-400">{selectedCustomer.mobileNo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedCustomer.customerType && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      selectedCustomer.customerType === 'wholesale'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
                        : 'bg-blue-50 text-blue-700 border border-blue-200/50'
                    }`}>
                      {selectedCustomer.customerType === 'wholesale' ? 'Wholesale' : 'Retail'}
                    </span>
                  )}
                  <button
                    onClick={() => { setSelectedCustomer(null); setShowCustomerPicker(true); setItems([]); }}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by name or mobile..."
                    autoFocus
                    className="w-full h-10 pl-9 pr-3 text-[13px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 placeholder:text-slate-400"
                  />
                </div>
                <div className="max-h-[240px] overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-50">
                  {filteredCustomers.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <Users className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-[13px] text-slate-400">No customers found</p>
                    </div>
                  ) : (
                    filteredCustomers.map(customer => (
                      <button
                        key={customer.id}
                        onClick={() => selectCustomer(customer)}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-indigo-600">
                            {customer.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-slate-900 truncate">{customer.fullName}</p>
                          <p className="text-[11px] text-slate-400">
                            {customer.mobileNo}
                            {customer.storeName ? ` · ${customer.storeName}` : ''}
                          </p>
                        </div>
                        {customer.customerType && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            customer.customerType === 'wholesale'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}>
                            {customer.customerType === 'wholesale' ? 'W' : 'R'}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate-500 flex items-center gap-2">
                  <ShoppingBag className="h-3.5 w-3.5" /> Items
                </span>
                <span className="text-[14px] font-semibold text-slate-900">{items.length}</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate-500 flex items-center gap-2">
                  <Package className="h-3.5 w-3.5" /> Total Qty
                </span>
                <span className="text-[18px] font-bold tabular-nums text-slate-900">{totalQty}</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !selectedCustomer || items.length === 0}
            className="w-full h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-[13px] rounded-xl shadow-sm shadow-indigo-500/25 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Order...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Create Order
              </>
            )}
          </Button>
        </div>

        {/* Right Column: Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-[15px] font-semibold text-slate-900">Order Items</h3>
              <p className="text-[12px] text-slate-400 mt-0.5">
                {items.length > 0
                  ? `${items.length} item${items.length !== 1 ? 's' : ''} added`
                  : 'Add products to the order'}
              </p>
            </div>

            {/* Items List */}
            {items.length > 0 && (
              <div className="divide-y divide-slate-50">
                {items.map((item, index) => (
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
                        onClick={() => updateQty(index, -1)}
                        className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-10 text-center text-[14px] font-semibold tabular-nums text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(index, 1)}
                        className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeItem(index)}
                        className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors cursor-pointer ml-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {items.length === 0 && !showProductPicker && (
              <div className="px-5 py-12 text-center">
                <Package className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-[14px] font-medium text-slate-400 mb-1">No items yet</p>
                <p className="text-[12px] text-slate-300">
                  {selectedCustomer ? 'Add products below' : 'Select a customer first'}
                </p>
              </div>
            )}

            {/* Add Product Section */}
            {selectedCustomer && (
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
                          const ct = selectedCustomer.customerType?.toLowerCase();
                          const sizes = ct === 'wholesale'
                            ? product.wholesaleSizes
                            : ct === 'retail'
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
            )}

            {/* Total */}
            {items.length > 0 && (
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-slate-900">Total Qty</span>
                  <span className="text-[18px] font-bold tabular-nums text-slate-900">{totalQty}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
