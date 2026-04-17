import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const { data: orders, error } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    products ( id, name, price, image )
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error fetching orders:', error);
            return NextResponse.json(
                { error: 'Failed to fetch orders' },
                { status: 500 }
            );
        }

        // Collect unique user_ids to fetch profiles
        const userIds = [...new Set((orders || []).map(o => o.user_id).filter(Boolean))];
        let profilesMap: Record<string, any> = {};

        if (userIds.length > 0) {
            const { data: profiles } = await supabaseAdmin
                .from('profiles')
                .select('id, name, email, picture')
                .in('id', userIds);

            if (profiles) {
                profilesMap = Object.fromEntries(profiles.map(p => [p.id, p]));
            }
        }

        // Transform the data to match the admin panel interface
        const transformedOrders = (orders || []).map(order => {
            const profile = profilesMap[order.user_id] || {};
            return {
                id: order.id.toString(),
                userId: order.user_id,
                userName: profile.name || 'Unknown',
                userEmail: profile.email || 'N/A',
                userAvatar: profile.picture,
                totalAmount: order.total_amount,
                status: order.status,
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                invoiceUrl: order.invoice_url || undefined,
                items: (order.order_items || []).map((item: any) => ({
                    id: item.id.toString(),
                    productId: item.product_id,
                    productName: item.products?.name || item.name,
                    productPrice: item.price,
                    productImage: item.products?.image,
                    quantity: item.quantity,
                    total: item.price * item.quantity,
                })),
            };
        });

        return NextResponse.json(transformedOrders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}

// POST - Backfill missing product_id in order_items by matching product name
export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        // Fetch all order_items where product_id is NULL
        const { data: orphanItems, error: fetchError } = await supabaseAdmin
            .from('order_items')
            .select('id, name')
            .is('product_id', null);

        if (fetchError) {
            console.error('Error fetching orphan items:', fetchError);
            return NextResponse.json(
                { error: 'Failed to fetch order items' },
                { status: 500 }
            );
        }

        if (!orphanItems || orphanItems.length === 0) {
            return NextResponse.json({ updated: 0, notFound: 0, message: 'All order items already have product_id linked' });
        }

        // Fetch all products for name matching
        const { data: products, error: prodError } = await supabaseAdmin
            .from('products')
            .select('id, name');

        if (prodError || !products) {
            console.error('Error fetching products:', prodError);
            return NextResponse.json(
                { error: 'Failed to fetch products' },
                { status: 500 }
            );
        }

        // Build a map: lowercase product name → product id
        const productMap = new Map<string, string>();
        for (const p of products) {
            productMap.set(p.name.toLowerCase().trim(), p.id);
        }

        let updated = 0;
        let notFound = 0;
        const notFoundNames: string[] = [];

        for (const item of orphanItems) {
            const productId = productMap.get(item.name.toLowerCase().trim());
            if (productId) {
                const { error: updateError } = await supabaseAdmin
                    .from('order_items')
                    .update({ product_id: productId })
                    .eq('id', item.id);

                if (!updateError) {
                    updated++;
                }
            } else {
                notFound++;
                if (!notFoundNames.includes(item.name)) {
                    notFoundNames.push(item.name);
                }
            }
        }

        return NextResponse.json({
            updated,
            notFound,
            notFoundNames,
            message: `Backfill complete: ${updated} items linked, ${notFound} items had no matching product`,
        });
    } catch (error) {
        console.error('Error backfilling product IDs:', error);
        return NextResponse.json(
            { error: 'Failed to backfill product IDs' },
            { status: 500 }
        );
    }
}
