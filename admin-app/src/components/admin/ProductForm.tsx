'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
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

const RETAIL_SUGGESTIONS = ['50ml', '100ml', '200ml', '500ml', '1L'];
const WHOLESALE_SUGGESTIONS = ['1L', '5L', '10L'];

export default function ProductForm({ mode, initialData, onSubmitSuccess }: ProductFormProps) {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
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
                                <Select
                                    value={formData.brandId}
                                    onValueChange={(value) => setFormData({ ...formData, brandId: value })}
                                >
                                    <SelectTrigger className="h-10 text-[13px] focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300">
                                        <SelectValue placeholder="Select brand" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {brands.map((brand) => (
                                            <SelectItem key={brand.id} value={brand.id.toString()}>
                                                {brand.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[13px] font-semibold text-slate-700">Category</Label>
                                <Select
                                    value={formData.categoryId}
                                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                                >
                                    <SelectTrigger className="h-10 text-[13px] focus-visible:ring-indigo-500/30 focus-visible:border-indigo-300">
                                        <SelectValue placeholder="Choose category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                <TagInput
                                    values={formData.retailSizes}
                                    onChange={(sizes) => {
                                        setFormData({ ...formData, retailSizes: sizes });
                                        if (sizes.length > 0) setErrors(prev => ({ ...prev, retailSizes: undefined }));
                                    }}
                                    suggestions={RETAIL_SUGGESTIONS}
                                    placeholder="Type size and press Enter (e.g., 250ml)"
                                    hasError={!!errors.retailSizes}
                                />
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
                                <TagInput
                                    values={formData.wholesaleSizes}
                                    onChange={(sizes) => {
                                        setFormData({ ...formData, wholesaleSizes: sizes });
                                        if (sizes.length > 0) setErrors(prev => ({ ...prev, wholesaleSizes: undefined }));
                                    }}
                                    suggestions={WHOLESALE_SUGGESTIONS}
                                    placeholder="Type size and press Enter (e.g., 20L)"
                                    hasError={!!errors.wholesaleSizes}
                                />
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
