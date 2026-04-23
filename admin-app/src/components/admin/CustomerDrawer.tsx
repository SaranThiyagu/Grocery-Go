'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    X,
    Phone,
    Mail,
    MapPin,
    Store,
    Calendar,
    FileText,
    Pencil,
    Loader2,
} from 'lucide-react';

export interface Customer {
    id: string;
    fullName: string;
    storeName: string | null;
    mobileNo: string;
    alternateContactNo: string | null;
    email: string | null;
    gstNo: string | null;
    dateOfBirth: string | null;
    anniversaryDate: string | null;
    gender: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    country: string | null;
    customerType: string | null;
    status: string | null;
    tags: unknown;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
}

interface CustomerDrawerProps {
    customer: Customer | null;
    open: boolean;
    onClose: () => void;
    onUpdated: () => void;
}

function formatDate(dateString: string | null) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function CustomerDrawer({ customer, open, onClose, onUpdated }: CustomerDrawerProps) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState<Partial<Customer>>({});

    const startEditing = () => {
        if (!customer) return;
        setEditData({ ...customer });
        setEditing(true);
    };

    const cancelEditing = () => {
        setEditing(false);
        setEditData({});
    };

    const saveChanges = async () => {
        if (!customer) return;
        setSaving(true);
        try {
            const res = await fetch('/api/customers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: customer.id,
                    full_name: editData.fullName,
                    store_name: editData.storeName || null,
                    mobile_no: editData.mobileNo,
                    alternate_contact_no: editData.alternateContactNo || null,
                    email: editData.email || null,
                    gst_no: editData.gstNo || null,
                    date_of_birth: editData.dateOfBirth || null,
                    anniversary_date: editData.anniversaryDate || null,
                    gender: editData.gender || null,
                    address_line1: editData.addressLine1 || null,
                    address_line2: editData.addressLine2 || null,
                    city: editData.city || null,
                    state: editData.state || null,
                    pincode: editData.pincode || null,
                    country: editData.country || 'India',
                    customer_type: editData.customerType || 'retail',
                    status: editData.status || 'active',
                    notes: editData.notes || null,
                }),
            });

            if (res.ok) {
                setEditing(false);
                onUpdated();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to update customer');
            }
        } catch {
            alert('Failed to update customer');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setEditing(false);
        setEditData({});
        onClose();
    };

    if (!customer) return null;

    return (
        <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
            <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto p-0">
                <SheetHeader className="px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-[16px] font-semibold text-slate-900">
                            Customer Details
                        </SheetTitle>
                        <div className="flex items-center gap-1">
                            {!editing && (
                                <button
                                    onClick={startEditing}
                                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                    title="Edit customer"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                            )}
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </SheetHeader>

                <div className="px-6 py-5 space-y-6">
                    {/* Header with avatar */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-[20px] font-bold text-indigo-600">
                                {customer.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                        </div>
                        <div className="min-w-0">
                            {editing ? (
                                <Input
                                    value={editData.fullName || ''}
                                    onChange={e => setEditData({ ...editData, fullName: e.target.value })}
                                    className="h-9 text-[14px] font-semibold"
                                />
                            ) : (
                                <h3 className="text-[16px] font-semibold text-slate-900 truncate">{customer.fullName}</h3>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                    customer.customerType === 'wholesale'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
                                        : 'bg-blue-50 text-blue-700 border border-blue-200/50'
                                }`}>
                                    {customer.customerType === 'wholesale' ? 'Wholesale' : 'Retail'}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                    customer.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                        : 'bg-red-50 text-red-600 border border-red-200/50'
                                }`}>
                                    {customer.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3">
                        <h4 className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.06em]">Contact</h4>
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                {editing ? (
                                    <Input
                                        value={editData.mobileNo || ''}
                                        onChange={e => setEditData({ ...editData, mobileNo: e.target.value })}
                                        className="h-8 text-[13px]"
                                        maxLength={15}
                                    />
                                ) : (
                                    <span className="text-[13px] text-slate-700">{customer.mobileNo}</span>
                                )}
                            </div>
                            {(editing || customer.alternateContactNo) && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-slate-300 flex-shrink-0" />
                                    {editing ? (
                                        <Input
                                            value={editData.alternateContactNo || ''}
                                            onChange={e => setEditData({ ...editData, alternateContactNo: e.target.value })}
                                            className="h-8 text-[13px]"
                                            placeholder="Alternate contact"
                                            maxLength={15}
                                        />
                                    ) : (
                                        <span className="text-[13px] text-slate-500">{customer.alternateContactNo}</span>
                                    )}
                                </div>
                            )}
                            {(editing || customer.email) && (
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                    {editing ? (
                                        <Input
                                            type="email"
                                            value={editData.email || ''}
                                            onChange={e => setEditData({ ...editData, email: e.target.value })}
                                            className="h-8 text-[13px]"
                                            placeholder="Email address"
                                        />
                                    ) : (
                                        <span className="text-[13px] text-slate-700">{customer.email}</span>
                                    )}
                                </div>
                            )}
                            {(editing || customer.storeName) && (
                                <div className="flex items-center gap-3">
                                    <Store className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                    {editing ? (
                                        <Input
                                            value={editData.storeName || ''}
                                            onChange={e => setEditData({ ...editData, storeName: e.target.value })}
                                            className="h-8 text-[13px]"
                                            placeholder="Store name"
                                        />
                                    ) : (
                                        <span className="text-[13px] text-slate-700">{customer.storeName}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Address */}
                    {(editing || customer.addressLine1 || customer.city) && (
                        <div className="space-y-3">
                            <h4 className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.06em]">Address</h4>
                            {editing ? (
                                <div className="space-y-2">
                                    <Input
                                        value={editData.addressLine1 || ''}
                                        onChange={e => setEditData({ ...editData, addressLine1: e.target.value })}
                                        className="h-8 text-[13px]"
                                        placeholder="Address line 1"
                                    />
                                    <Input
                                        value={editData.addressLine2 || ''}
                                        onChange={e => setEditData({ ...editData, addressLine2: e.target.value })}
                                        className="h-8 text-[13px]"
                                        placeholder="Address line 2"
                                    />
                                    <div className="grid grid-cols-3 gap-2">
                                        <Input
                                            value={editData.city || ''}
                                            onChange={e => setEditData({ ...editData, city: e.target.value })}
                                            className="h-8 text-[13px]"
                                            placeholder="City"
                                        />
                                        <Input
                                            value={editData.state || ''}
                                            onChange={e => setEditData({ ...editData, state: e.target.value })}
                                            className="h-8 text-[13px]"
                                            placeholder="State"
                                        />
                                        <Input
                                            value={editData.pincode || ''}
                                            onChange={e => setEditData({ ...editData, pincode: e.target.value })}
                                            className="h-8 text-[13px]"
                                            placeholder="Pincode"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-[13px] text-slate-700">
                                        {customer.addressLine1 && <p>{customer.addressLine1}</p>}
                                        {customer.addressLine2 && <p>{customer.addressLine2}</p>}
                                        <p>
                                            {[customer.city, customer.state, customer.pincode]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Business Info */}
                    {(editing || customer.gstNo) && (
                        <div className="space-y-3">
                            <h4 className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.06em]">Business</h4>
                            <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                {editing ? (
                                    <Input
                                        value={editData.gstNo || ''}
                                        onChange={e => setEditData({ ...editData, gstNo: e.target.value })}
                                        className="h-8 text-[13px]"
                                        placeholder="GST number"
                                        maxLength={15}
                                    />
                                ) : (
                                    <span className="text-[13px] text-slate-700">GST: {customer.gstNo}</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Dates */}
                    {(editing || customer.dateOfBirth || customer.anniversaryDate) && (
                        <div className="space-y-3">
                            <h4 className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.06em]">Important Dates</h4>
                            <div className="space-y-2.5">
                                {(editing || customer.dateOfBirth) && (
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                        {editing ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <span className="text-[12px] text-slate-500 w-20">Birthday:</span>
                                                <Input
                                                    type="date"
                                                    value={editData.dateOfBirth || ''}
                                                    onChange={e => setEditData({ ...editData, dateOfBirth: e.target.value })}
                                                    className="h-8 text-[13px]"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-[13px] text-slate-700">Birthday: {formatDate(customer.dateOfBirth)}</span>
                                        )}
                                    </div>
                                )}
                                {(editing || customer.anniversaryDate) && (
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                        {editing ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <span className="text-[12px] text-slate-500 w-20">Anniversary:</span>
                                                <Input
                                                    type="date"
                                                    value={editData.anniversaryDate || ''}
                                                    onChange={e => setEditData({ ...editData, anniversaryDate: e.target.value })}
                                                    className="h-8 text-[13px]"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-[13px] text-slate-700">Anniversary: {formatDate(customer.anniversaryDate)}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Status & Type (edit mode) */}
                    {editing && (
                        <div className="space-y-3">
                            <h4 className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.06em]">Classification</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[12px] text-slate-500">Type</Label>
                                    <Select value={editData.customerType || 'retail'} onValueChange={v => setEditData({ ...editData, customerType: v })}>
                                        <SelectTrigger className="h-8 text-[13px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="retail">Retail</SelectItem>
                                            <SelectItem value="wholesale">Wholesale</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[12px] text-slate-500">Status</Label>
                                    <Select value={editData.status || 'active'} onValueChange={v => setEditData({ ...editData, status: v })}>
                                        <SelectTrigger className="h-8 text-[13px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {(editing || customer.notes) && (
                        <div className="space-y-3">
                            <h4 className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.06em]">Notes</h4>
                            {editing ? (
                                <Textarea
                                    value={editData.notes || ''}
                                    onChange={e => setEditData({ ...editData, notes: e.target.value })}
                                    className="text-[13px]"
                                    rows={3}
                                    placeholder="Internal notes..."
                                />
                            ) : (
                                <p className="text-[13px] text-slate-600">{customer.notes}</p>
                            )}
                        </div>
                    )}

                    {/* Meta */}
                    <div className="pt-3 border-t border-slate-100">
                        <p className="text-[11px] text-slate-400">
                            Created {formatDate(customer.createdAt)}
                            {customer.updatedAt && customer.updatedAt !== customer.createdAt && (
                                <> · Updated {formatDate(customer.updatedAt)}</>
                            )}
                        </p>
                    </div>

                    {/* Edit Actions */}
                    {editing && (
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelEditing}
                                disabled={saving}
                                className="h-9 text-[13px]"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={saveChanges}
                                disabled={saving}
                                className="h-9 text-[13px] bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
                            >
                                {saving ? (
                                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving...</>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
