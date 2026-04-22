import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ productId: string }> }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const { productId } = await params;

        const { data: product, error } = await supabaseAdmin
            .from('products')
            .select(`
                *,
                categories ( id, name ),
                brands ( id, name ),
                product_sizes ( id, size_label, type )
            `)
            .eq('id', productId)
            .single();

        if (error || !product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        const sizes = (product.product_sizes as any[]) || [];

        return NextResponse.json({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            category: (product.categories as any)?.name || null,
            categoryId: (product.categories as any)?.id || null,
            brand: (product.brands as any)?.name || null,
            brandId: (product.brands as any)?.id || null,
            sellingMode: product.selling_mode || 'both',
            retailSizes: sizes.filter((s: any) => s.type === 'retail').map((s: any) => s.size_label),
            wholesaleSizes: sizes.filter((s: any) => s.type === 'wholesale').map((s: any) => s.size_label),
            isActive: product.is_active ?? true,
            createdAt: product.created_at,
            updatedAt: product.updated_at,
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        );
    }
}
