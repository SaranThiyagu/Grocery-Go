'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Loader2,
    User,
    Phone,
    Mail,
    Store,
    FileText,
    MapPin,
    Building2,
    Gift,
    Cake,
    StickyNote,
    Sparkles,
} from 'lucide-react';

export interface CustomerFormData {
    id?: string;
    fullName: string;
    storeName: string;
    mobileNo: string;
    alternateContactNo: string;
    email: string;
    gstNo: string;
    dateOfBirth: string;
    anniversaryDate: string;
    gender: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    customerType: string;
    status: string;
    notes: string;
}

interface CustomerFormProps {
    mode: 'create' | 'edit';
    initialData?: CustomerFormData;
    onSubmitSuccess?: () => void;
    rightPanelContent?: ReactNode;
}

const INDIAN_STATES = [
    'Tamil Nadu',
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const inputStyles = 'h-10 text-[13px] bg-slate-50/50 border-slate-200/80 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-400 focus-visible:bg-white transition-all rounded-xl pl-10';
const inputNoIconStyles = 'h-10 text-[13px] bg-slate-50/50 border-slate-200/80 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-400 focus-visible:bg-white transition-all rounded-xl';

export default function CustomerForm({ mode, initialData, onSubmitSuccess, rightPanelContent }: CustomerFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<CustomerFormData>({
        fullName: '',
        storeName: '',
        mobileNo: '',
        alternateContactNo: '',
        email: '',
        gstNo: '',
        dateOfBirth: '',
        anniversaryDate: '',
        gender: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        customerType: 'retail',
        status: 'active',
        notes: '',
        ...initialData,
    });

    const updateField = (field: keyof CustomerFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                ...(mode === 'edit' && initialData?.id ? { id: initialData.id } : {}),
                full_name: formData.fullName,
                store_name: formData.storeName || null,
                mobile_no: formData.mobileNo,
                alternate_contact_no: formData.alternateContactNo || null,
                email: formData.email || null,
                gst_no: formData.gstNo || null,
                date_of_birth: formData.dateOfBirth || null,
                anniversary_date: formData.anniversaryDate || null,
                gender: formData.gender || null,
                address_line1: formData.addressLine1 || null,
                address_line2: formData.addressLine2 || null,
                city: formData.city || null,
                state: formData.state || null,
                pincode: formData.pincode || null,
                country: formData.country || 'India',
                customer_type: formData.customerType || 'retail',
                status: formData.status || 'active',
                notes: formData.notes || null,
            };

            const res = await fetch('/api/customers', {
                method: mode === 'create' ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                if (onSubmitSuccess) {
                    onSubmitSuccess();
                } else {
                    router.push('/admin/customers');
                }
            } else {
                const err = await res.json();
                alert(err.error || `Failed to ${mode} customer`);
            }
        } catch {
            alert(`Failed to ${mode} customer`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const labelStyles = 'text-[12px] font-semibold text-slate-600 uppercase tracking-[0.04em]';

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ───── Left Panel: Smart Form (8 cols / ~66%) ───── */}
                <div className="lg:col-span-8 space-y-6">

                    {/* ── 1. Customer Classification ── */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/80 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                            </div>
                            <h2 className="text-[14px] font-semibold text-slate-900">Customer Type</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { value: 'retail', label: 'Retail', desc: 'Individual buyer', icon: User },
                                { value: 'wholesale', label: 'Wholesale', desc: 'Business buyer', icon: Building2 },
                            ].map(option => {
                                const isActive = formData.customerType === option.value;
                                const Icon = option.icon;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => updateField('customerType', option.value)}
                                        className={`relative flex items-center gap-3.5 px-5 py-4 rounded-xl text-left border-2 transition-all duration-200 cursor-pointer ${
                                            isActive
                                                ? 'bg-gradient-to-br from-indigo-50/80 to-violet-50/50 border-indigo-300 shadow-sm shadow-indigo-100/50'
                                                : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                            isActive ? 'bg-indigo-100 shadow-sm' : 'bg-slate-100'
                                        }`}>
                                            <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        </div>
                                        <div>
                                            <p className={`text-[13px] font-semibold ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                {option.label}
                                            </p>
                                            <p className={`text-[11px] ${isActive ? 'text-indigo-600/70' : 'text-slate-400'}`}>
                                                {option.desc}
                                            </p>
                                        </div>
                                        {isActive && (
                                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── 2. Basic Information ── */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/80 p-6 space-y-5">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                                <User className="h-3.5 w-3.5 text-blue-500" />
                            </div>
                            <h2 className="text-[14px] font-semibold text-slate-900">Basic Information</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="fullName" className={labelStyles}>
                                    Full Name <span className="text-red-400">*</span>
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="fullName"
                                        value={formData.fullName}
                                        onChange={e => updateField('fullName', e.target.value)}
                                        placeholder="Enter full name"
                                        className={inputStyles}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="mobileNo" className={labelStyles}>
                                    Mobile Number <span className="text-red-400">*</span>
                                </Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="mobileNo"
                                        value={formData.mobileNo}
                                        onChange={e => updateField('mobileNo', e.target.value)}
                                        placeholder="Enter mobile number"
                                        maxLength={15}
                                        className={inputStyles}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="alternateContactNo" className={labelStyles}>
                                    Alternate Contact <span className="text-slate-300 font-normal normal-case tracking-normal">(Optional)</span>
                                </Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="alternateContactNo"
                                        value={formData.alternateContactNo}
                                        onChange={e => updateField('alternateContactNo', e.target.value)}
                                        placeholder="Alternate phone number"
                                        maxLength={15}
                                        className={inputStyles}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className={labelStyles}>
                                    Email <span className="text-slate-300 font-normal normal-case tracking-normal">(Optional)</span>
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={e => updateField('email', e.target.value)}
                                        placeholder="Enter email address"
                                        className={inputStyles}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Store & GST — always visible, dimmed for retail */}
                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity duration-300 ${
                            formData.customerType === 'wholesale' ? 'opacity-100' : 'opacity-40'
                        }`}>
                            <div className="space-y-1.5">
                                <Label htmlFor="storeName" className={labelStyles}>
                                    Store / Business Name
                                    {formData.customerType === 'wholesale' && <span className="text-red-400 ml-1">*</span>}
                                </Label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="storeName"
                                        value={formData.storeName}
                                        onChange={e => updateField('storeName', e.target.value)}
                                        placeholder="Enter store/business name"
                                        className={inputStyles}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="gstNo" className={labelStyles}>
                                    GST Number <span className="text-slate-300 font-normal normal-case tracking-normal">(Optional)</span>
                                </Label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="gstNo"
                                        value={formData.gstNo}
                                        onChange={e => updateField('gstNo', e.target.value.toUpperCase())}
                                        placeholder="e.g. 22ABCDE1234F1Z5"
                                        maxLength={15}
                                        className={`${inputStyles} uppercase`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── 3. Address ── */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/80 p-6 space-y-5">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                            </div>
                            <h2 className="text-[14px] font-semibold text-slate-900">Address</h2>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="addressLine1" className={labelStyles}>Address Line 1</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="addressLine1"
                                    value={formData.addressLine1}
                                    onChange={e => updateField('addressLine1', e.target.value)}
                                    placeholder="Street address, building name"
                                    className={inputStyles}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="addressLine2" className={labelStyles}>
                                Address Line 2 <span className="text-slate-300 font-normal normal-case tracking-normal">(Optional)</span>
                            </Label>
                            <Input
                                id="addressLine2"
                                value={formData.addressLine2}
                                onChange={e => updateField('addressLine2', e.target.value)}
                                placeholder="Area, landmark"
                                className={inputNoIconStyles}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="city" className={labelStyles}>City</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={e => updateField('city', e.target.value)}
                                    placeholder="Enter city"
                                    className={inputNoIconStyles}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="state" className={labelStyles}>State</Label>
                                <Select value={formData.state} onValueChange={v => updateField('state', v)}>
                                    <SelectTrigger className="h-10 text-[13px] bg-slate-50/50 border-slate-200/80 rounded-xl focus:ring-indigo-500/20 focus:border-indigo-400">
                                        <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {INDIAN_STATES.map(s => (
                                            <SelectItem key={s} value={s} className="text-[13px]">{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="pincode" className={labelStyles}>Pincode</Label>
                                <Input
                                    id="pincode"
                                    value={formData.pincode}
                                    onChange={e => updateField('pincode', e.target.value)}
                                    placeholder="e.g. 600001"
                                    maxLength={10}
                                    className={inputNoIconStyles}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── 4. Personal Info ── */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/80 p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-pink-50 flex items-center justify-center">
                                    <Gift className="h-3.5 w-3.5 text-pink-500" />
                                </div>
                                <h2 className="text-[14px] font-semibold text-slate-900">Personal Info</h2>
                            </div>
                            <span className="text-[11px] text-slate-400 italic">Used for personalized offers & reminders</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label className={labelStyles}>Gender</Label>
                                <div className="flex gap-1.5">
                                    {['male', 'female', 'other'].map(g => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => updateField('gender', g)}
                                            className={`flex-1 px-2 py-2.5 rounded-xl text-[12px] font-medium border transition-all duration-200 cursor-pointer capitalize ${
                                                formData.gender === g
                                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                                                    : 'bg-slate-50/50 text-slate-500 border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300'
                                            }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="dateOfBirth" className={labelStyles}>
                                    <Cake className="inline h-3 w-3 mr-1 -mt-0.5" />Date of Birth
                                </Label>
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={e => updateField('dateOfBirth', e.target.value)}
                                    className={inputNoIconStyles}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="anniversaryDate" className={labelStyles}>
                                    <Gift className="inline h-3 w-3 mr-1 -mt-0.5" />Anniversary
                                </Label>
                                <Input
                                    id="anniversaryDate"
                                    type="date"
                                    value={formData.anniversaryDate}
                                    onChange={e => updateField('anniversaryDate', e.target.value)}
                                    className={inputNoIconStyles}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── 5. Notes ── */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/80 p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                                <StickyNote className="h-3.5 w-3.5 text-slate-500" />
                            </div>
                            <h2 className="text-[14px] font-semibold text-slate-900">Notes</h2>
                        </div>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={e => updateField('notes', e.target.value)}
                            placeholder="Add internal notes about this customer..."
                            rows={3}
                            className="text-[13px] bg-slate-50/50 border-slate-200/80 rounded-xl focus-visible:ring-indigo-500/20 focus-visible:border-indigo-400 focus-visible:bg-white transition-all resize-none"
                        />
                    </div>

                    {/* ── Sticky Footer Actions ── */}
                    <div className="sticky bottom-0 z-10 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent pt-6 pb-2">
                        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/50 px-6 py-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => router.push('/admin/customers')}
                                disabled={isSubmitting}
                                className="h-10 px-5 text-[13px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-10 px-6 text-[13px] font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/25 rounded-xl cursor-pointer transition-all hover:shadow-lg hover:shadow-indigo-500/30"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                        {mode === 'create' ? 'Creating...' : 'Saving...'}
                                    </>
                                ) : (
                                    mode === 'create' ? 'Save Customer' : 'Save Changes'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ───── Right Panel: Sticky Insights (4 cols / ~33%) ───── */}
                <div className="lg:col-span-4">
                    <div className="lg:sticky lg:top-6 space-y-5">

                        {/* Customer Preview Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/80 p-6">
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-4">Customer Preview</h3>
                            <div className="flex items-center gap-3.5 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/25">
                                    <span className="text-[16px] font-bold text-white">
                                        {formData.fullName?.charAt(0)?.toUpperCase() || '?'}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[14px] font-semibold text-slate-900 truncate">
                                        {formData.fullName || 'Customer Name'}
                                    </p>
                                    {formData.storeName && (
                                        <p className="text-[12px] text-slate-500 truncate">{formData.storeName}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                {formData.mobileNo && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="text-[12px] text-slate-600">{formData.mobileNo}</span>
                                    </div>
                                )}
                                {formData.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="text-[12px] text-slate-600 truncate">{formData.email}</span>
                                    </div>
                                )}
                                {formData.city && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="text-[12px] text-slate-600">
                                            {formData.city}{formData.state ? `, ${formData.state}` : ''}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                                    formData.customerType === 'wholesale'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                                        : 'bg-blue-50 text-blue-700 border-blue-200/60'
                                }`}>
                                    {formData.customerType === 'wholesale' ? (
                                        <Store className="h-2.5 w-2.5" />
                                    ) : (
                                        <User className="h-2.5 w-2.5" />
                                    )}
                                    {formData.customerType === 'wholesale' ? 'Wholesale' : 'Retail'}
                                </span>
                                {formData.status === 'active' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200/60">
                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                        Inactive
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Status Toggle */}
                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/80 p-6">
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-3">Status</h3>
                            <div className="flex gap-2">
                                {[
                                    { value: 'active', label: 'Active', dot: 'bg-emerald-500' },
                                    { value: 'inactive', label: 'Inactive', dot: 'bg-slate-400' },
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => updateField('status', option.value)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold border-2 transition-all duration-200 cursor-pointer ${
                                            formData.status === option.value
                                                ? option.value === 'active'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                    : 'bg-slate-50 text-slate-700 border-slate-300'
                                                : 'bg-white text-slate-500 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${
                                            formData.status === option.value ? option.dot : 'bg-slate-300'
                                        }`} />
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Extra right panel content injected from parent */}
                        {rightPanelContent}
                    </div>
                </div>
            </div>
        </form>
    );
}
