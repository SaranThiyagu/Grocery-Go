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
                customers ( id, full_name, store_name, mobile_no, email, customer_type ),
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
            const customer = order.customers as any;
            return {
                id: order.id.toString(),
                userId: order.user_id,
                userName: customer?.full_name || profile.name || 'Unknown',
                userEmail: customer?.email || profile.email || 'N/A',
                userAvatar: profile.picture,
                customerId: order.customer_id || null,
                customerName: customer?.full_name || null,
                customerStoreName: customer?.store_name || null,
                customerMobile: customer?.mobile_no || null,
                customerEmail: customer?.email || null,
                customerType: customer?.customer_type || null,
                totalAmount: order.total_amount,
                status: order.status,
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                createdBy: order.created_by || 'customer',
                invoiceUrl: order.invoice_url || undefined,
                deliveryDate: (order as any).delivery_date || null,
                deliverySlot: (order as any).delivery_slot || null,
                cancellationReason: (order as any).cancellation_reason || null,
                cancelledBy: (order as any).cancelled_by || null,
                cancelledAt: (order as any).cancelled_at || null,
                items: (order.order_items || []).map((item: any) => {
                    const sizeMatch = item.name?.match(/\(([^)]+)\)$/);
                    return {
                        id: item.id.toString(),
                        productId: item.product_id,
                        productName: item.products?.name || item.name,
                        productPrice: item.price,
                        productImage: item.products?.image,
                        quantity: item.quantity,
                        total: item.price * item.quantity,
                        size: item.size || sizeMatch?.[1] || null,
                    };
                }),
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

// POST - Create a new order
export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const body = await request.json();
        const { customerId, items } = body;

        if (!customerId) {
            return NextResponse.json({ error: 'Customer is required' }, { status: 400 });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
        }
        for (const item of items) {
            if (!item.productId || !item.productName || !item.quantity || item.quantity < 1) {
                return NextResponse.json({ error: 'Each item must have productId, productName, and quantity >= 1' }, { status: 400 });
            }
        }

        // Generate order ID (timestamp-based like mobile app)
        const orderId = Date.now().toString();

        // Fetch customer to get user_id link
        const { data: customer, error: custError } = await supabaseAdmin
            .from('customers')
            .select('id, created_by')
            .eq('id', customerId)
            .single();

        if (custError || !customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        // Insert order
        const { error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                id: orderId,
                order_no: orderId,
                status: 'Ordered',
                total_amount: 0,
                customer_id: customerId,
                user_id: customer.created_by || null,
                created_by: 'admin',
            });

        if (orderError) {
            console.error('Error creating order:', orderError);
            return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
        }

        // Insert order items
        const orderItems = items.map((item: any) => ({
            order_id: orderId,
            product_id: item.productId,
            name: item.size ? `${item.productName} (${item.size})` : item.productName,
            quantity: item.quantity,
            price: 0,
            size: item.size || null,
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Error creating order items:', itemsError);
            // Rollback order
            await supabaseAdmin.from('orders').delete().eq('id', orderId);
            return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
        }

        return NextResponse.json({ id: orderId, message: 'Order created successfully' }, { status: 201 });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
