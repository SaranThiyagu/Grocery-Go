'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Check, ChevronsUpDown, Plus, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import TagInput from '@/components/admin/TagInput';
import ImageUpload from '@/components/admin/ImageUpload';
import ProductPreview from '@/components/admin/ProductPreview';

interface Category {
    id: number;
    name: string;
}

interface Brand {
    id: number;
    name: string;
}

export interface ProductFormData {
    id?: string;
    name: string;
    description: string;
    brandId: string;
    categoryId: string;
    image: string;
    sellingMode: string;
    retailSizes: string[];
    wholesaleSizes: string[];
}

interface ProductFormProps {
    mode: 'create' | 'edit';
    initialData?: ProductFormData;
    onSubmitSuccess?: () => void;
}

export default function ProductForm({ mode, initialData, onSubmitSuccess }: ProductFormProps) {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [retailSuggestions, setRetailSuggestions] = useState<string[]>([]);
    const [wholesaleSuggestions, setWholesaleSuggestions] = useState<string[]>([]);
    const [brandOpen, setBrandOpen] = useState(false);
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [quickCreate, setQuickCreate] = useState<null | 'brand' | 'category'>(null);
    const [quickCreateName, setQuickCreateName] = useState('');
    const [quickCreateError, setQuickCreateError] = useState('');
    const [quickCreateSaving, setQuickCreateSaving] = useState(false);
    const [manageSizesType, setManageSizesType] = useState<null | 'retail' | 'wholesale'>(null);
    const [manageSizesList, setManageSizesList] = useState<{ id: number; sizeLabel: string }[]>([]);
    const [manageSizesLoading, setManageSizesLoading] = useState(false);
    const [newSizeLabel, setNewSizeLabel] = useState('');
    const [newSizeError, setNewSizeError] = useState('');
    const [newSizeAdding, setNewSizeAdding] = useState(false);
    const [deletingSizeId, setDeletingSizeId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingSizes, setLoadingSizes] = useState(false);
    const [errors, setErrors] = useState<{ retailSizes?: string; wholesaleSizes?: string }>({});
    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        brandId: '',
        categoryId: '',
        image: '',
        sellingMode: 'both',
        retailSizes: [],
        wholesaleSizes: [],
        ...initialData,
    });

    useEffect(() => {
        (async () => {
            try {
                const [catRes, brandRes] = await Promise.all([
                    fetch('/api/categories'),
                    fetch('/api/brands'),
                ]);
                if (catRes.ok) setCategories(await catRes.json());
                if (brandRes.ok) setBrands(await brandRes.json());
            } catch (error) {
                console.error('Error fetching form data:', error);
            }
        })();
    }, []);

    // Fetch size suggestions when category changes
    useEffect(() => {
        // Clear previous suggestions and selected sizes immediately on category change
        setRetailSuggestions([]);
        setWholesaleSuggestions([]);
        setFormData(prev => ({ ...prev, retailSizes: [], wholesaleSizes: [] }));

        if (!formData.categoryId) return;

        setLoadingSizes(true);
        (async () => {
            try {
                const sizesRes = await fetch(`/api/products/sizes?categoryId=${formData.categoryId}`);
                if (sizesRes.ok) {
                    const sizesData = await sizesRes.json();
                    setRetailSuggestions(sizesData.retail || []);
                    setWholesaleSuggestions(sizesData.wholesale || []);
                }
            } catch (error) {
                console.error('Error fetching size suggestions:', error);
            } finally {
                setLoadingSizes(false);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.categoryId]);

    // If initialData changes (e.g., when product data loads), update form
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const openQuickCreate = (type: 'brand' | 'category') => {
        setQuickCreateName('');
        setQuickCreateError('');
        setQuickCreate(type);
    };

    const handleQuickCreate = async () => {
        const name = quickCreateName.trim();
        if (!name) {
            setQuickCreateError('Name is required');
            return;
        }
        const list = quickCreate === 'brand' ? brands : categories;
        if (list.some(item => item.name.toLowerCase() === name.toLowerCase())) {
            setQuickCreateError(`A ${quickCreate} with this name already exists`);
            return;
        }
        setQuickCreateSaving(true);
        setQuickCreateError('');
        try {
            const url = quickCreate === 'brand' ? '/api/brands' : '/api/categories';
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            const data = await res.json();
            if (!res.ok) {
                setQuickCreateError(data.error || `Failed to create ${quickCreate}`);
                return;
            }
            if (quickCreate === 'brand') {
                const newBrand = { id: data.id, name: data.name };
                setBrands(prev => [...prev, newBrand].sort((a, b) => a.name.localeCompare(b.name)));
                setFormData(prev => ({ ...prev, brandId: newBrand.id.toString() }));
            } else {
                const newCategory = { id: data.id, name: data.name };
                setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
                setFormData(prev => ({ ...prev, categoryId: newCategory.id.toString() }));
            }
            setQuickCreate(null);
        } catch {
            setQuickCreateError(`Failed to create ${quickCreate}`);
        } finally {
            setQuickCreateSaving(false);
        }
    };

    const openManageSizes = async (type: 'retail' | 'wholesale') => {
        if (!formData.categoryId) return;
        setManageSizesType(type);
        setNewSizeLabel('');
        setNewSizeError('');
        setManageSizesLoading(true);
        setManageSizesList([]);
        try {
            const res = await fetch(`/api/category-sizes?categoryId=${formData.categoryId}`);
            if (res.ok) {
                const data = await res.json();
                const filtered = (data || [])
                    .filter((s: { type: string }) => s.type === type)
                    .map((s: { id: number; sizeLabel: string }) => ({ id: s.id, sizeLabel: s.sizeLabel }));
                setManageSizesList(filtered);
            }
        } catch (err) {
            console.error('Error loading category sizes:', err);
        } finally {
            setManageSizesLoading(false);
        }
    };

    const addCategorySize = async () => {
        const label = newSizeLabel.trim();
        if (!label) {
            setNewSizeError('Size label is required');
            return;
        }
        if (manageSizesList.some(s => s.sizeLabel.toLowerCase() === label.toLowerCase())) {
            setNewSizeError('This size already exists');
            return;
        }
        if (!manageSizesType || !formData.categoryId) return;
        setNewSizeAdding(true);
        setNewSizeError('');
        try {
            const res = await fetch('/api/category-sizes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoryId: parseInt(formData.categoryId),
                    sizeLabel: label,
                    type: manageSizesType,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setNewSizeError(data.error || 'Failed to add size');
                return;
            }
            const created = { id: data.id, sizeLabel: data.size_label };
            setManageSizesList(prev => [...prev, created]);
            // Update suggestions for the relevant type
            if (manageSizesType === 'retail') {
                setRetailSuggestions(prev => prev.includes(created.sizeLabel) ? prev : [...prev, created.sizeLabel]);
            } else {
                setWholesaleSuggestions(prev => prev.includes(created.sizeLabel) ? prev : [...prev, created.sizeLabel]);
            }
            setNewSizeLabel('');
        } catch {
            setNewSizeError('Failed to add size');
        } finally {
            setNewSizeAdding(false);
        }
    };

    const deleteCategorySize = async (id: number, label: string) => {
        setDeletingSizeId(id);
        try {
            const res = await fetch(`/api/category-sizes?id=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setNewSizeError(data.error || 'Failed to delete size');
                return;
            }
            setManageSizesList(prev => prev.filter(s => s.id !== id));
            // Remove from suggestions and any selected sizes in form
            if (manageSizesType === 'retail') {
                setRetailSuggestions(prev => prev.filter(s => s !== label));
                setFormData(prev => ({ ...prev, retailSizes: prev.retailSizes.filter(s => s !== label) }));
            } else if (manageSizesType === 'wholesale') {
                setWholesaleSuggestions(prev => prev.filter(s => s !== label));
                setFormData(prev => ({ ...prev, wholesaleSizes: prev.wholesaleSizes.filter(s => s !== label) }));
            }
        } catch {
            setNewSizeError('Failed to delete size');
        } finally {
            setDeletingSizeId(null);
        }
    };

    const showRetail = formData.sellingMode === 'retail' || formData.sellingMode === 'both';
    const showWholesale = formData.sellingMode === 'wholesale' || formData.sellingMode === 'both';

    const selectedBrandName = brands.find(b => b.id.toString() === formData.brandId)?.name || null;
    const selectedCategoryName = categories.find(c => c.id.toString() === formData.categoryId)?.name || null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        // Validate packaging sizes based on selling mode
        const newErrors: { retailSizes?: string; wholesaleSizes?: string } = {};
        if (showRetail && formData.retailSizes.length === 0) {
            newErrors.retailSizes = 'At least one retail packaging size is required';
        }
        if (showWholesale && formData.wholesaleSizes.length === 0) {
            newErrors.wholesaleSizes = 'At least one wholesale packaging size is required';
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsSubmitting(false);
            return;
        }

        try {
            // Build sizes array
            const sizes: { size_label: string; type: string }[] = [];
            if (showRetail) {
                formData.retailSizes.forEach(s => sizes.push({ size_label: s, type: 'retail' }));
            }
            if (showWholesale) {
                formData.wholesaleSizes.forEach(s => sizes.push({ size_label: s, type: 'wholesale' }));
            }

            const payload = {
                ...(mode === 'edit' && initialData?.id ? { id: initialData.id } : {}),
                name: formData.name,
                description: formData.description || null,
                category_id: formData.categoryId ? parseInt(formData.categoryId) : null,
                brand_id: formData.brandId ? parseInt(formData.brandId) : null,
                image: formData.image || null,
                selling_mode: formData.sellingMode,
                sizes,
            };

            const res = await fetch('/api/products', {
                method: mode === 'create' ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                if (onSubmitSuccess) {
                    onSubmitSuccess();
                } else {
                    router.push('/admin/products');
                }
            } else {
                const err = await res.json();
                alert(err.error || `Failed to ${mode} product`);
            }
        } catch {
            alert(`Failed to ${mode} product`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left: Form Fields */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-6">
                        {/* Product Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[13px] font-semibold text-slate-700">
                                Product Name
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter product name"
                                className="h-10 text-[13px] focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300"
                                required
                            />
                        </div>

                        {/* Brand & Category Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[13px] font-semibold text-slate-700">Brand</Label>
                                    <button
                                        type="button"
                                        onClick={() => openQuickCreate('brand')}
                                        className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                                    >
                                        <Plus className="h-3 w-3" />
                                        New
                                    </button>
                                </div>
                                <Popover open={brandOpen} onOpenChange={setBrandOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={brandOpen}
                                            className="w-full h-10 justify-between text-[13px] font-normal focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300"
                                        >
                                            {formData.brandId
                                                ? brands.find(b => b.id.toString() === formData.brandId)?.name
                                                : 'Select brand'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search brand..." className="text-[13px]" />
                                            <CommandList>
                                                <CommandEmpty>No brand found.</CommandEmpty>
                                                <CommandGroup>
                                                    {brands.map((brand) => (
                                                        <CommandItem
                                                            key={brand.id}
                                                            value={brand.name}
                                                            onSelect={() => {
                                                                setFormData({ ...formData, brandId: brand.id.toString() });
                                                                setBrandOpen(false);
                                                            }}
                                                            className="text-[13px]"
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", formData.brandId === brand.id.toString() ? "opacity-100" : "opacity-0")} />
                                                            {brand.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[13px] font-semibold text-slate-700">Category</Label>
                                    <button
                                        type="button"
                                        onClick={() => openQuickCreate('category')}
                                        className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                                    >
                                        <Plus className="h-3 w-3" />
                                        New
                                    </button>
                                </div>
                                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={categoryOpen}
                                            className="w-full h-10 justify-between text-[13px] font-normal focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300"
                                        >
                                            {formData.categoryId
                                                ? categories.find(c => c.id.toString() === formData.categoryId)?.name
                                                : 'Choose category'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search category..." className="text-[13px]" />
                                            <CommandList>
                                                <CommandEmpty>No category found.</CommandEmpty>
                                                <CommandGroup>
                                                    {categories.map((cat) => (
                                                        <CommandItem
                                                            key={cat.id}
                                                            value={cat.name}
                                                            onSelect={() => {
                                                                setFormData({ ...formData, categoryId: cat.id.toString() });
                                                                setCategoryOpen(false);
                                                            }}
                                                            className="text-[13px]"
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", formData.categoryId === cat.id.toString() ? "opacity-100" : "opacity-0")} />
                                                            {cat.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Product Image */}
                        <div className="space-y-2">
                            <Label className="text-[13px] font-semibold text-slate-700">Product Image</Label>
                            <ImageUpload
                                imageUrl={formData.image || null}
                                onImageUploaded={(url) => setFormData({ ...formData, image: url })}
                                onImageRemoved={() => setFormData({ ...formData, image: '' })}
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-[13px] font-semibold text-slate-700">
                                Description <span className="text-slate-400 font-normal">(Optional)</span>
                            </Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Enter product description..."
                                rows={3}
                                className="text-[13px] focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300"
                            />
                        </div>

                        {/* Selling Mode */}
                        <div className="space-y-3">
                            <Label className="text-[13px] font-semibold text-slate-700">Selling Mode</Label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'retail', label: 'Retail Only' },
                                    { value: 'wholesale', label: 'Wholesale Only' },
                                    { value: 'both', label: 'Both Retail & Wholesale' },
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, sellingMode: option.value })}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium border transition-all ${
                                            formData.sellingMode === option.value
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/25'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                            formData.sellingMode === option.value
                                                ? 'border-white'
                                                : 'border-slate-300'
                                        }`}>
                                            {formData.sellingMode === option.value && (
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                            )}
                                        </div>
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Retail Packaging */}
                        {showRetail && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-[13px] font-semibold text-slate-700">
                                            Retail Packaging <span className="text-red-500">*</span>
                                        </Label>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Small quantities for individual customers</p>
                                    </div>
                                    {formData.categoryId && (
                                        <button
                                            type="button"
                                            onClick={() => openManageSizes('retail')}
                                            className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors flex-shrink-0 cursor-pointer"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Manage Sizes
                                        </button>
                                    )}
                                </div>
                                {loadingSizes ? (
                                    <div className="flex items-center gap-2 py-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                        <span className="text-[12px] text-slate-400">Loading sizes...</span>
                                    </div>
                                ) : (
                                    <>
                                        <TagInput
                                            values={formData.retailSizes}
                                            onChange={(sizes) => {
                                                setFormData({ ...formData, retailSizes: sizes });
                                                if (sizes.length > 0) setErrors(prev => ({ ...prev, retailSizes: undefined }));
                                            }}
                                            suggestions={retailSuggestions}
                                            placeholder="Type size and press Enter (e.g., 100g)"
                                            hasError={!!errors.retailSizes}
                                        />
                                        {!formData.categoryId && (
                                            <p className="text-[11px] text-amber-500">Select a category to see suggested sizes</p>
                                        )}
                                    </>
                                )}
                                {errors.retailSizes && (
                                    <p className="text-[12px] text-red-500">{errors.retailSizes}</p>
                                )}
                            </div>
                        )}

                        {/* Wholesale Packaging */}
                        {showWholesale && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-[13px] font-semibold text-slate-700">
                                            Wholesale Packaging <span className="text-red-500">*</span>
                                        </Label>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Bulk quantities for business customers</p>
                                    </div>
                                    {formData.categoryId && (
                                        <button
                                            type="button"
                                            onClick={() => openManageSizes('wholesale')}
                                            className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors flex-shrink-0 cursor-pointer"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Manage Sizes
                                        </button>
                                    )}
                                </div>
                                {loadingSizes ? (
                                    <div className="flex items-center gap-2 py-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                        <span className="text-[12px] text-slate-400">Loading sizes...</span>
                                    </div>
                                ) : (
                                    <>
                                        <TagInput
                                            values={formData.wholesaleSizes}
                                            onChange={(sizes) => {
                                                setFormData({ ...formData, wholesaleSizes: sizes });
                                                if (sizes.length > 0) setErrors(prev => ({ ...prev, wholesaleSizes: undefined }));
                                            }}
                                            suggestions={wholesaleSuggestions}
                                            placeholder="Type size and press Enter (e.g., 5kg)"
                                            hasError={!!errors.wholesaleSizes}
                                        />
                                        {!formData.categoryId && (
                                            <p className="text-[11px] text-amber-500">Select a category to see suggested sizes</p>
                                        )}
                                    </>
                                )}
                                {errors.wholesaleSizes && (
                                    <p className="text-[12px] text-red-500">{errors.wholesaleSizes}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-3 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/admin/products')}
                            disabled={isSubmitting}
                            className="h-10 px-5 text-[13px] font-medium border-slate-200 text-slate-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-10 px-5 text-[13px] font-medium bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-sm shadow-indigo-500/25"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    {mode === 'create' ? 'Creating...' : 'Saving...'}
                                </>
                            ) : (
                                mode === 'create' ? 'Save' : 'Save Changes'
                            )}
                        </Button>
                    </div>
                </div>

                {/* Right: Preview */}
                <div className="lg:col-span-2">
                    <ProductPreview
                        name={formData.name}
                        brand={selectedBrandName}
                        category={selectedCategoryName}
                        image={formData.image || null}
                        sellingMode={formData.sellingMode}
                        retailSizes={showRetail ? formData.retailSizes : []}
                        wholesaleSizes={showWholesale ? formData.wholesaleSizes : []}
                    />
                </div>
            </div>

            {/* Quick Create Brand/Category Dialog */}
            <Dialog
                open={quickCreate !== null}
                onOpenChange={(open) => {
                    if (!open && !quickCreateSaving) setQuickCreate(null);
                }}
            >
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="text-[15px]">
                            New {quickCreate === 'brand' ? 'Brand' : 'Category'}
                        </DialogTitle>
                        <DialogDescription className="text-[12px]">
                            {quickCreate === 'brand'
                                ? 'Add a new brand. It will be selected automatically.'
                                : 'Add a new category. It will be selected automatically.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label htmlFor="quick-create-name" className="text-[13px] font-semibold text-slate-700">
                            Name
                        </Label>
                        <Input
                            id="quick-create-name"
                            autoFocus
                            value={quickCreateName}
                            onChange={(e) => {
                                setQuickCreateName(e.target.value);
                                if (quickCreateError) setQuickCreateError('');
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleQuickCreate();
                                }
                            }}
                            placeholder={quickCreate === 'brand' ? 'e.g. Aashirvaad' : 'e.g. Rice & Grains'}
                            className="h-10 text-[13px]"
                            disabled={quickCreateSaving}
                        />
                        {quickCreateError && (
                            <div className="flex items-center gap-1.5 text-[12px] text-red-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {quickCreateError}
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setQuickCreate(null)}
                            disabled={quickCreateSaving}
                            className="h-9 text-[13px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleQuickCreate}
                            disabled={quickCreateSaving || !quickCreateName.trim()}
                            className="h-9 text-[13px] bg-indigo-600 hover:bg-indigo-700"
                        >
                            {quickCreateSaving ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Create
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manage Category Sizes Dialog */}
            <Dialog
                open={manageSizesType !== null}
                onOpenChange={(open) => {
                    if (!open && !newSizeAdding && deletingSizeId === null) {
                        setManageSizesType(null);
                        setNewSizeError('');
                    }
                }}
            >
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="text-[15px]">
                            Manage {manageSizesType === 'retail' ? 'Retail' : 'Wholesale'} Sizes
                        </DialogTitle>
                        <DialogDescription className="text-[12px]">
                            {selectedCategoryName ? (
                                <>For category <span className="font-semibold text-slate-700">{selectedCategoryName}</span></>
                            ) : 'Add or remove sizes for the selected category.'}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Add new size */}
                    <div className="space-y-2 pt-1">
                        <Label htmlFor="new-size-input" className="text-[13px] font-semibold text-slate-700">
                            Add Size
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="new-size-input"
                                autoFocus
                                value={newSizeLabel}
                                onChange={(e) => {
                                    setNewSizeLabel(e.target.value);
                                    if (newSizeError) setNewSizeError('');
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addCategorySize();
                                    }
                                }}
                                placeholder={manageSizesType === 'retail' ? 'e.g. 500g, 1kg' : 'e.g. 25kg, 50kg'}
                                className="h-10 text-[13px]"
                                disabled={newSizeAdding}
                            />
                            <Button
                                type="button"
                                onClick={addCategorySize}
                                disabled={newSizeAdding || !newSizeLabel.trim()}
                                className="h-10 text-[13px] bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"
                            >
                                {newSizeAdding ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <>
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        Add
                                    </>
                                )}
                            </Button>
                        </div>
                        {newSizeError && (
                            <div className="flex items-center gap-1.5 text-[12px] text-red-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {newSizeError}
                            </div>
                        )}
                    </div>

                    {/* Existing sizes */}
                    <div className="space-y-2 pt-2">
                        <Label className="text-[13px] font-semibold text-slate-700">
                            Existing Sizes {manageSizesList.length > 0 && (
                                <span className="text-[11px] font-normal text-slate-400">({manageSizesList.length})</span>
                            )}
                        </Label>
                        {manageSizesLoading ? (
                            <div className="flex items-center gap-2 py-3">
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                <span className="text-[12px] text-slate-400">Loading sizes...</span>
                            </div>
                        ) : manageSizesList.length === 0 ? (
                            <p className="text-[12px] text-slate-400 py-2">
                                No sizes yet. Add your first one above.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto py-1">
                                {manageSizesList.map((size) => (
                                    <span
                                        key={size.id}
                                        className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-[12px] font-medium transition-colors"
                                    >
                                        {size.sizeLabel}
                                        <button
                                            type="button"
                                            onClick={() => deleteCategorySize(size.id, size.sizeLabel)}
                                            disabled={deletingSizeId === size.id}
                                            className="ml-0.5 h-5 w-5 flex items-center justify-center rounded-full hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-50"
                                            aria-label={`Remove ${size.sizeLabel}`}
                                        >
                                            {deletingSizeId === size.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <X className="h-3 w-3" />
                                            )}
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setManageSizesType(null)}
                            disabled={newSizeAdding || deletingSizeId !== null}
                            className="h-9 text-[13px]"
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </form>
    );
}
