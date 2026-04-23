'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
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
                                <Label className="text-[13px] font-semibold text-slate-700">Brand</Label>
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
                                <Label className="text-[13px] font-semibold text-slate-700">Category</Label>
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
                                <div>
                                    <Label className="text-[13px] font-semibold text-slate-700">
                                        Retail Packaging <span className="text-red-500">*</span>
                                    </Label>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Small quantities for individual customers</p>
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
                                <div>
                                    <Label className="text-[13px] font-semibold text-slate-700">
                                        Wholesale Packaging <span className="text-red-500">*</span>
                                    </Label>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Bulk quantities for business customers</p>
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
        </form>
    );
}
