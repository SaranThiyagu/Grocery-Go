import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const { data: products, error } = await supabaseAdmin
            .from('products')
            .select(`
                id,
                name,
                description,
                price,
                image,
                selling_mode,
                is_active,
                created_at,
                updated_at,
                categories ( id, name ),
                brands ( id, name ),
                product_sizes ( id, size_label, type )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error fetching products:', error);
            return NextResponse.json(
                { error: 'Failed to fetch products' },
                { status: 500 }
            );
        }

        // Transform the data to include proper image paths
        const transformedProducts = (products || []).map(product => {
            const sizes = (product.product_sizes as any[]) || [];
            return {
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
            };
        });

        return NextResponse.json(transformedProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const body = await request.json();
        const { name, description, price, image, category_id, is_active, brand_id, selling_mode, sizes } = body;

        // Validation
        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        if (price !== undefined && price !== null && (typeof price !== 'number' || price < 0)) {
            return NextResponse.json(
                { error: 'Price must be a non-negative number' },
                { status: 400 }
            );
        }

        // Validate selling_mode
        const validSellingModes = ['retail', 'wholesale', 'both'];
        if (selling_mode && !validSellingModes.includes(selling_mode)) {
            return NextResponse.json(
                { error: 'Invalid selling mode' },
                { status: 400 }
            );
        }

        // Check for duplicate product (same name + same category)
        const duplicateQuery = supabaseAdmin
            .from('products')
            .select('id')
            .ilike('name', name.trim());

        if (category_id) {
            duplicateQuery.eq('category_id', category_id);
        } else {
            duplicateQuery.is('category_id', null);
        }

        const { data: existing } = await duplicateQuery.limit(1);

        if (existing && existing.length > 0) {
            return NextResponse.json(
                { error: 'A product with this name already exists in the selected category' },
                { status: 409 }
            );
        }

        // Create product
        const productId = crypto.randomUUID();
        const { data: product, error } = await supabaseAdmin
            .from('products')
            .insert({
                id: productId,
                name,
                description: description || null,
                price: price ?? 0,
                image: image || null,
                category_id: category_id || null,
                brand_id: brand_id || null,
                selling_mode: selling_mode || 'both',
                is_active: is_active !== undefined ? is_active : true,
            })
            .select(`
                *,
                categories ( id, name ),
                brands ( id, name )
            `)
            .single();

        if (error || !product) {
            console.error('Supabase error creating product:', error);
            return NextResponse.json(
                { error: 'Failed to create product' },
                { status: 500 }
            );
        }

        // Insert product sizes if provided
        if (sizes && Array.isArray(sizes) && sizes.length > 0) {
            const sizeRows = sizes.map((s: { size_label: string; type: string }) => ({
                product_id: productId,
                size_label: s.size_label,
                type: s.type,
            }));
            const { error: sizesError } = await supabaseAdmin
                .from('product_sizes')
                .insert(sizeRows);
            if (sizesError) {
                console.error('Error inserting product sizes:', sizesError);
            }
        }

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
            isActive: product.is_active ?? true,
            createdAt: product.created_at,
            updatedAt: product.updated_at,
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const body = await request.json();
        const { id, name, description, price, image, category_id, is_active, brand_id, selling_mode, sizes } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            );
        }

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        if (price !== undefined && price !== null && (typeof price !== 'number' || price < 0)) {
            return NextResponse.json(
                { error: 'Price must be a non-negative number' },
                { status: 400 }
            );
        }

        // Validate selling_mode
        const validSellingModes = ['retail', 'wholesale', 'both'];
        if (selling_mode && !validSellingModes.includes(selling_mode)) {
            return NextResponse.json(
                { error: 'Invalid selling mode' },
                { status: 400 }
            );
        }

        // Check for duplicate product (same name + same category, excluding self)
        const duplicateQuery = supabaseAdmin
            .from('products')
            .select('id')
            .ilike('name', name.trim())
            .neq('id', id);

        if (category_id) {
            duplicateQuery.eq('category_id', category_id);
        } else {
            duplicateQuery.is('category_id', null);
        }

        const { data: existing } = await duplicateQuery.limit(1);

        if (existing && existing.length > 0) {
            return NextResponse.json(
                { error: 'A product with this name already exists in the selected category' },
                { status: 409 }
            );
        }

        const { data: product, error } = await supabaseAdmin
            .from('products')
            .update({
                name,
                description: description || null,
                price: price ?? 0,
                image: image || null,
                category_id: category_id || null,
                brand_id: brand_id || null,
                selling_mode: selling_mode || 'both',
                is_active: is_active !== undefined ? is_active : true,
            })
            .eq('id', id)
            .select(`
                *,
                categories ( id, name ),
                brands ( id, name )
            `)
            .single();

        if (error || !product) {
            console.error('Supabase error updating product:', error);
            return NextResponse.json(
                { error: 'Failed to update product' },
                { status: 500 }
            );
        }

        // Update sizes: delete existing then re-insert
        if (sizes && Array.isArray(sizes)) {
            await supabaseAdmin
                .from('product_sizes')
                .delete()
                .eq('product_id', id);

            if (sizes.length > 0) {
                const sizeRows = sizes.map((s: { size_label: string; type: string }) => ({
                    product_id: id,
                    size_label: s.size_label,
                    type: s.type,
                }));
                const { error: sizesError } = await supabaseAdmin
                    .from('product_sizes')
                    .insert(sizeRows);
                if (sizesError) {
                    console.error('Error updating product sizes:', sizesError);
                }
            }
        }

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
            isActive: product.is_active ?? true,
            createdAt: product.created_at,
            updatedAt: product.updated_at,
        });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json(
            { error: 'Failed to update product' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            );
        }

        // Check if product is referenced in order_items
        const { data: linkedItems, error: checkError } = await supabaseAdmin
            .from('order_items')
            .select('id, order_id')
            .eq('product_id', id)
            .limit(1);

        if (checkError) {
            console.error('Error checking order_items:', checkError);
            return NextResponse.json(
                { error: 'Failed to verify product usage' },
                { status: 500 }
            );
        }

        if (linkedItems && linkedItems.length > 0) {
            return NextResponse.json(
                { error: 'This product cannot be deleted because it is associated with existing orders. Consider marking it as inactive instead.' },
                { status: 409 }
            );
        }

        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase error deleting product:', error);
            return NextResponse.json(
                { error: 'Failed to delete product' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json(
            { error: 'Failed to delete product' },
            { status: 500 }
        );
    }
}
