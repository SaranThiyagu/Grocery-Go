'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Package, ChevronRight } from 'lucide-react';

interface ProductPreviewProps {
    name: string;
    brand: string | null;
    category: string | null;
    image: string | null;
    sellingMode: string;
    retailSizes: string[];
    wholesaleSizes: string[];
}

const RETAIL_SUGGESTIONS = ['50ml', '100ml', '200ml', '500ml', '1L'];
const WHOLESALE_SUGGESTIONS = ['1L', '5L', '10L'];

export default function ProductPreview({
    name,
    brand,
    category,
    image,
    sellingMode,
    retailSizes,
    wholesaleSizes,
}: ProductPreviewProps) {
    const showRetail = sellingMode === 'retail' || sellingMode === 'both';
    const showWholesale = sellingMode === 'wholesale' || sellingMode === 'both';

    const unusedRetailSuggestions = RETAIL_SUGGESTIONS.filter(s => !retailSizes.includes(s));
    const unusedWholesaleSuggestions = WHOLESALE_SUGGESTIONS.filter(s => !wholesaleSizes.includes(s));

    return (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 sticky top-28">
            <h3 className="text-[14px] font-semibold text-slate-900 mb-5">Product Preview</h3>

            {/* Image */}
            <div className="w-full aspect-square relative rounded-xl overflow-hidden bg-slate-50 border border-slate-200/60 mb-5">
                {image ? (
                    <Image src={image} alt={name || 'Product'} fill className="object-contain p-4" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-slate-200" />
                    </div>
                )}
            </div>

            {/* Name */}
            <h4 className="text-[16px] font-semibold text-slate-900 mb-1">
                {name || 'Product Name'}
            </h4>

            {/* Brand */}
            {brand && (
                <div className="flex items-center gap-1 mb-2">
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="text-[13px] text-slate-500">{brand}</span>
                </div>
            )}

            {/* Category */}
            {category && (
                <Badge className="mb-4 bg-indigo-50 text-indigo-700 border border-indigo-200/50 hover:bg-indigo-50 text-[11px] font-semibold">
                    <Package className="h-3 w-3 mr-1" />
                    {category}
                </Badge>
            )}

            {/* Retail Sizes */}
            {showRetail && retailSizes.length > 0 && (
                <div className="mt-4">
                    <p className="text-[12px] font-medium text-slate-600 mb-2">Available in Retail Sizes:</p>
                    <div className="flex flex-wrap gap-1.5">
                        {retailSizes.map(size => (
                            <Badge
                                key={size}
                                variant="outline"
                                className="text-[11px] font-medium border-slate-300 text-slate-700 bg-white"
                            >
                                {size}
                            </Badge>
                        ))}
                    </div>
                    {unusedRetailSuggestions.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] text-slate-400">Suggested:</span>
                            {unusedRetailSuggestions.map(s => (
                                <span key={s} className="text-[10px] text-indigo-400">{s}</span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Wholesale Sizes */}
            {showWholesale && wholesaleSizes.length > 0 && (
                <div className="mt-4">
                    <p className="text-[12px] font-medium text-slate-600 mb-2">Available in Wholesale Sizes:</p>
                    <div className="flex flex-wrap gap-1.5">
                        {wholesaleSizes.map(size => (
                            <Badge
                                key={size}
                                variant="outline"
                                className="text-[11px] font-medium border-slate-300 text-slate-700 bg-white"
                            >
                                {size}
                            </Badge>
                        ))}
                    </div>
                    {unusedWholesaleSuggestions.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] text-slate-400">Suggested:</span>
                            {unusedWholesaleSuggestions.map(s => (
                                <span key={s} className="text-[10px] text-indigo-400">{s}</span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
