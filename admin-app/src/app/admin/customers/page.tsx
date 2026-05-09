'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Search,
    Users,
    UserCheck,
    Store,
    User as UserIcon,
    Plus,
    Inbox,
    Loader2,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    X,
    Phone,
    Mail,
    MapPin,
    AlertTriangle,
} from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { type Customer } from '@/components/admin/CustomerDrawer';

// Deterministic avatar gradient from a string (premium-SaaS visual variance).
const AVATAR_GRADIENTS = [
    'from-indigo-100 to-violet-100 text-indigo-600',
    'from-emerald-100 to-teal-100 text-emerald-600',
    'from-amber-100 to-orange-100 text-amber-700',
    'from-rose-100 to-pink-100 text-rose-600',
    'from-sky-100 to-blue-100 text-sky-600',
    'from-fuchsia-100 to-purple-100 text-fuchsia-600',
];
function avatarGradient(seed?: string | null): string {
    if (!seed) return AVATAR_GRADIENTS[0];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export default function CustomersPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCity, setFilterCity] = useState('all');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/customers');
            if (res.ok) setCustomers(await res.json());
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const uniqueCities = useMemo(() => {
        return Array.from(new Set(customers.map(c => c.city).filter(Boolean))).sort() as string[];
    }, [customers]);

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                if (!(
                    c.fullName.toLowerCase().includes(term) ||
                    c.storeName?.toLowerCase().includes(term) ||
                    c.mobileNo.includes(term) ||
                    c.email?.toLowerCase().includes(term) ||
                    c.city?.toLowerCase().includes(term)
                )) return false;
            }
            if (filterType !== 'all' && c.customerType !== filterType) return false;
            if (filterStatus !== 'all' && c.status !== filterStatus) return false;
            if (filterCity !== 'all' && c.city !== filterCity) return false;
            return true;
        });
    }, [customers, searchTerm, filterType, filterStatus, filterCity]);

    const hasActiveFilters = filterType !== 'all' || filterStatus !== 'all' || filterCity !== 'all';

    const clearFilters = () => {
        setFilterType('all');
        setFilterStatus('all');
        setFilterCity('all');
    };

    const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
    const paginatedCustomers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredCustomers.slice(start, start + pageSize);
    }, [filteredCustomers, currentPage, pageSize]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterType, filterStatus, filterCity, pageSize]);

    const stats = useMemo(() => ({
        total: customers.length,
        retail: customers.filter(c => c.customerType === 'retail').length,
        wholesale: customers.filter(c => c.customerType === 'wholesale').length,
        active: customers.filter(c => c.status === 'active').length,
    }), [customers]);

    const confirmDeleteCustomer = async () => {
        if (!deleteTarget) return;
        setIsDeleting(deleteTarget.id);
        setDeleteError(null);
        try {
            const res = await fetch(`/api/customers?id=${encodeURIComponent(deleteTarget.id)}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setDeleteTarget(null);
                await fetchCustomers();
            } else {
                const err = await res.json();
                setDeleteError(err.error || 'Failed to delete customer');
            }
        } catch {
            setDeleteError('Failed to delete customer');
        } finally {
            setIsDeleting(null);
        }
    };

    const handleCustomerClick = (customer: Customer) => {
        router.push(`/admin/customers/${customer.id}/edit`);
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

    return (
        <main className="max-w-[1280px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-[26px] font-bold text-slate-900 tracking-[-0.02em]">Customers</h1>
                        <p className="text-[13px] text-slate-500 mt-1">
                            {stats.total} customers &middot; {stats.active} active
                        </p>
                    </div>
                    <Button
                        className="h-10 px-4 text-[13px] font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/25 rounded-xl"
                        onClick={() => router.push('/admin/customers/create')}
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add Customer
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total Customers" value={stats.total} icon={<Users className="h-4 w-4" />} color="neutral" />
                    <StatCard label="Retail" value={stats.retail} icon={<UserCheck className="h-4 w-4" />} color="blue" />
                    <StatCard label="Wholesale" value={stats.wholesale} icon={<Store className="h-4 w-4" />} color="amber" />
                    <StatCard label="Active" value={stats.active} icon={<UserCheck className="h-4 w-4" />} color="emerald" />
                </div>

                {/* Customers Table */}
                <div className="bg-white rounded-2xl border border-slate-200/60 premium-shadow overflow-hidden">
                    {/* Search & Filters */}
                    <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-slate-400" />
                                <Input
                                    placeholder="Search by name, mobile, email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 text-[13px] bg-slate-50/80 border-slate-200/60 shadow-none rounded-lg focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500/15 focus-visible:border-indigo-400 placeholder:text-slate-400"
                                />
                            </div>

                            {/* Type — segmented chips */}
                            <div className="inline-flex items-center bg-slate-100/80 rounded-lg p-0.5">
                                {[
                                    { value: 'all', label: 'All' },
                                    { value: 'retail', label: 'Retail' },
                                    { value: 'wholesale', label: 'Wholesale' },
                                ].map((opt) => {
                                    const active = filterType === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setFilterType(opt.value)}
                                            className={`h-8 px-3 text-[12px] font-medium rounded-md transition-all ${
                                                active
                                                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60'
                                                    : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Status — segmented chips */}
                            <div className="inline-flex items-center bg-slate-100/80 rounded-lg p-0.5">
                                {[
                                    { value: 'all', label: 'All' },
                                    { value: 'active', label: 'Active' },
                                    { value: 'inactive', label: 'Inactive' },
                                ].map((opt) => {
                                    const active = filterStatus === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setFilterStatus(opt.value)}
                                            className={`h-8 px-3 text-[12px] font-medium rounded-md transition-all ${
                                                active
                                                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60'
                                                    : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* City — keep as Select (variable count) */}
                            {uniqueCities.length > 0 && (
                                <Select value={filterCity} onValueChange={setFilterCity}>
                                    <SelectTrigger className="h-9 w-[140px] text-[12px] border-slate-200/60 shadow-none rounded-lg bg-slate-50/80">
                                        <MapPin className="h-3 w-3 text-slate-400" />
                                        <SelectValue placeholder="All Cities" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-[12px]">All Cities</SelectItem>
                                        {uniqueCities.map(city => (
                                            <SelectItem key={city} value={city} className="text-[12px]">{city}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-1 h-9 px-2.5 text-[12px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Customer</th>
                                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Store Name</th>
                                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Contact</th>
                                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Location</th>
                                    <th className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Type</th>
                                    <th className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Status</th>
                                    <th className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] px-5 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedCustomers.map((customer) => (
                                    <tr
                                        key={customer.id}
                                        onClick={() => handleCustomerClick(customer)}
                                        className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/70 cursor-pointer transition-colors"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 ${avatarGradient(customer.fullName)}`}>
                                                    <span className="text-[12px] font-bold">
                                                        {customer.fullName?.charAt(0)?.toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-medium text-slate-900 truncate max-w-[180px]">{customer.fullName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {customer.storeName ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Store className="h-3 w-3 text-slate-400" />
                                                    <span className="text-[12px] text-slate-600 truncate max-w-[160px]">{customer.storeName}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[12px] text-slate-400">&mdash;</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="h-3 w-3 text-slate-400" />
                                                    <span className="text-[12px] text-slate-600">{customer.mobileNo}</span>
                                                </div>
                                                {customer.email && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Mail className="h-3 w-3 text-slate-400" />
                                                        <span className="text-[11px] text-slate-400 truncate max-w-[160px]">{customer.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {customer.city ? (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-3 w-3 text-slate-400" />
                                                    <span className="text-[12px] text-slate-600">
                                                        {customer.city}{customer.state ? `, ${customer.state}` : ''}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[12px] text-slate-400">&mdash;</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                                customer.customerType === 'wholesale'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200/60'
                                            }`}>
                                                {customer.customerType === 'wholesale' ? (
                                                    <Store className="h-2.5 w-2.5" />
                                                ) : (
                                                    <UserIcon className="h-2.5 w-2.5" />
                                                )}
                                                {customer.customerType === 'wholesale' ? 'Wholesale' : 'Retail'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            {customer.status === 'active' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200/60">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => router.push(`/admin/customers/${customer.id}/edit`)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                                    title="Edit customer"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => { setDeleteError(null); setDeleteTarget(customer); }}
                                                    disabled={isDeleting === customer.id}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                    title="Delete customer"
                                                >
                                                    {isDeleting === customer.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {paginatedCustomers.map((customer) => (
                            <div
                                key={customer.id}
                                onClick={() => handleCustomerClick(customer)}
                                className="px-5 py-4 flex items-center gap-3.5 hover:bg-slate-50/70 cursor-pointer active:bg-slate-100/70 transition-colors"
                            >
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 ${avatarGradient(customer.fullName)}`}>
                                    <span className="text-[13px] font-bold">
                                        {customer.fullName?.charAt(0)?.toUpperCase() || '?'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[13px] font-medium text-slate-900 truncate">{customer.fullName}</p>
                                        {customer.status === 'active' ? (
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" title="Active" />
                                        ) : (
                                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 flex-shrink-0" title="Inactive" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[11px] text-slate-500">{customer.mobileNo}</span>
                                        {customer.storeName && (
                                            <span className="text-[11px] text-slate-400">· {customer.storeName}</span>
                                        )}
                                        {customer.city && (
                                            <span className="text-[11px] text-slate-400">· {customer.city}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                        customer.customerType === 'wholesale'
                                            ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                                            : 'bg-blue-50 text-blue-700 border-blue-200/60'
                                    }`}>
                                        {customer.customerType === 'wholesale' ? <Store className="h-2 w-2" /> : <UserIcon className="h-2 w-2" />}
                                        {customer.customerType === 'wholesale' ? 'W' : 'R'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredCustomers.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                                <Inbox className="h-5 w-5 text-slate-400" />
                            </div>
                            <p className="text-[14px] font-medium text-slate-600 mb-1">No customers found</p>
                            <p className="text-[12px] text-slate-400 text-center max-w-[240px]">
                                {searchTerm || hasActiveFilters ? 'Try adjusting your search or filters.' : 'Add your first customer to get started.'}
                            </p>
                        </div>
                    )}

                    {/* Footer with Pagination */}
                    {filteredCustomers.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                <p className="text-[12px] text-slate-400">
                                    Showing <span className="font-medium text-slate-600">{(currentPage - 1) * pageSize + 1}</span>–<span className="font-medium text-slate-600">{Math.min(currentPage * pageSize, filteredCustomers.length)}</span> of{' '}
                                    <span className="font-medium text-slate-600">{filteredCustomers.length}</span> customers
                                </p>
                                <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                                    <SelectTrigger className="h-7 w-[70px] text-[11px] border-slate-200/60 shadow-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent align="end">
                                        {[10, 20, 50, 100].map((size) => (
                                            <SelectItem key={size} value={size.toString()} className="text-[12px]">
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                    title="First page"
                                >
                                    <ChevronsLeft className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                    title="Previous page"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                                <span className="text-[12px] text-slate-500 px-2 tabular-nums">
                                    Page <span className="font-medium text-slate-700">{currentPage}</span> of <span className="font-medium text-slate-700">{totalPages}</span>
                                </span>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                    title="Next page"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                    title="Last page"
                                >
                                    <ChevronsRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteError(null); } }}>
                    <AlertDialogContent className="sm:max-w-[440px] p-0 overflow-hidden">
                        <div className="px-6 pt-6 pb-4">
                            <div className="flex items-start gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                                <AlertDialogHeader className="space-y-1.5 text-left">
                                    <AlertDialogTitle className="text-[16px] font-semibold tracking-tight text-slate-900">
                                        {deleteError ? 'Cannot Delete Customer' : 'Delete Customer'}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-[13px] text-slate-500">
                                        {deleteError ? (
                                            <span className="text-red-600">{deleteError}</span>
                                        ) : (
                                            <>Are you sure you want to delete <span className="font-semibold text-slate-700">&quot;{deleteTarget?.fullName}&quot;</span>? This action cannot be undone.</>
                                        )}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                            </div>
                        </div>
                        <AlertDialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-row gap-2 sm:justify-end">
                            <Button
                                variant="outline"
                                onClick={() => { setDeleteTarget(null); setDeleteError(null); }}
                                disabled={isDeleting === deleteTarget?.id}
                                className="h-9 px-4 text-[13px] font-medium border-slate-200 text-slate-700 hover:bg-white"
                            >
                                {deleteError ? 'Close' : 'Cancel'}
                            </Button>
                            {!deleteError && (
                                <Button
                                    onClick={confirmDeleteCustomer}
                                    disabled={isDeleting === deleteTarget?.id}
                                    className="h-9 px-4 text-[13px] font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/25"
                                >
                                    {isDeleting === deleteTarget?.id ? (
                                        <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Deleting...</>
                                    ) : (
                                        <><Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete</>
                                    )}
                                </Button>
                            )}
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </main>
    );
}
