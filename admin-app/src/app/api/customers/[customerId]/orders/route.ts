import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ customerId: string }> }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const { customerId } = await params;
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '3', 10), 50);

        // Fetch orders for this customer
        const { data: orders, error } = await supabaseAdmin
            .from('orders')
            .select(`
                id,
                status,
                created_at,
                order_items (
                    id,
                    quantity,
                    products ( id, name, price, image )
                )
            `)
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching customer orders:', error);
            return NextResponse.json(
                { error: 'Failed to fetch customer orders' },
                { status: 500 }
            );
        }

        // Fetch aggregate stats
        const { data: allOrders, error: statsError } = await supabaseAdmin
            .from('orders')
            .select('id, status, created_at')
            .eq('customer_id', customerId);

        if (statsError) {
            console.error('Error fetching order stats:', statsError);
        }

        const totalOrders = allOrders?.length || 0;
        const statusCounts: Record<string, number> = {};
        allOrders?.forEach(o => {
            statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        });

        // Last order date
        const lastOrderDate = allOrders && allOrders.length > 0
            ? allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
            : null;

        const transformedOrders = (orders || []).map(order => {
            const items = (order.order_items as any[]) || [];
            const totalQty = items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
            return {
                id: order.id.toString(),
                status: order.status,
                createdAt: order.created_at,
                totalQty,
                items: items.map((item: any) => ({
                    id: item.id,
                    productName: item.products?.name || item.name || 'Unknown Product',
                    productImage: item.products?.image || null,
                    quantity: item.quantity,
                    price: item.products?.price || item.price || 0,
                })),
            };
        });

        return NextResponse.json({
            orders: transformedOrders,
            stats: {
                totalOrders,
                statusCounts,
                lastOrderDate,
            },
        });
    } catch (error) {
        console.error('Error fetching customer orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch customer orders' },
            { status: 500 }
        );
    }
}
