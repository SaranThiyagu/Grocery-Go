import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ORDER_SELECT = `
    *,
    order_items (
        *,
        products ( id, name, price, image )
    )
`;

// Valid status transitions: Ordered → Confirmed → Delivered
const VALID_TRANSITIONS: Record<string, string> = {
  Ordered: 'Confirmed',
  Confirmed: 'Delivered',
};

// GET single order by ID
export async function GET(
    request: Request,
    { params }: { params: { orderId: string } }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const orderId = params.orderId;

        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select(ORDER_SELECT)
            .eq('id', orderId)
            .single();

        if (error || !order) {
            if (error?.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Order not found' },
                    { status: 404 }
                );
            }
            console.error('Supabase error fetching order:', error);
            return NextResponse.json(
                { error: 'Failed to fetch order' },
                { status: 500 }
            );
        }

        // Fetch user profile
        let profile: any = {};
        if (order.user_id) {
            const { data } = await supabaseAdmin
                .from('profiles')
                .select('id, name, email, picture')
                .eq('id', order.user_id)
                .single();
            if (data) profile = data;
        }

        // Transform the data
        const transformedOrder = {
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

        return NextResponse.json(transformedOrder);
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json(
            { error: 'Failed to fetch order' },
            { status: 500 }
        );
    }
}

// PATCH - Update order status
export async function PATCH(
    request: Request,
    { params }: { params: { orderId: string } }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const orderId = params.orderId;

        const body = await request.json();
        const { status, comment } = body;

        if (!status) {
            return NextResponse.json(
                { error: 'Status is required' },
                { status: 400 }
            );
        }

        // Fetch current order to validate transition
        const { data: currentOrder, error: fetchCurrentError } = await supabaseAdmin
            .from('orders')
            .select('status')
            .eq('id', orderId)
            .single();

        if (fetchCurrentError || !currentOrder) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Validate status transition
        const allowedNext = VALID_TRANSITIONS[currentOrder.status];
        if (allowedNext !== status) {
            return NextResponse.json(
                { error: `Invalid transition: ${currentOrder.status} → ${status}. Allowed: ${currentOrder.status} → ${allowedNext || 'none (terminal state)'}` },
                { status: 400 }
            );
        }

        // Update order status (and comment if provided)
        const updateData: Record<string, string> = { status };
        if (comment !== undefined && comment !== null) {
            updateData.admin_comment = comment;
        }

        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

        if (updateError) {
            console.error('Supabase error updating order:', updateError);
            return NextResponse.json(
                { error: 'Failed to update order' },
                { status: 500 }
            );
        }

        // Re-fetch the updated order with joins
        const { data: updatedOrder, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    products ( name, price )
                )
            `)
            .eq('id', orderId)
            .single();

        if (fetchError || !updatedOrder) {
            console.error('Supabase error re-fetching order:', fetchError);
            return NextResponse.json(
                { error: 'Failed to fetch updated order' },
                { status: 500 }
            );
        }

        // Fetch user profile for email
        let profile: any = {};
        if (updatedOrder.user_id) {
            const { data } = await supabaseAdmin
                .from('profiles')
                .select('name, email')
                .eq('id', updatedOrder.user_id)
                .single();
            if (data) profile = data;
        }

        // Send email if order is delivered
        if (status === 'Delivered' && profile.email) {
            try {
                const { sendOrderCompletionEmail } = await import('@/lib/email');

                await sendOrderCompletionEmail({
                    orderId: updatedOrder.id.toString(),
                    customerName: profile.name || 'Customer',
                    customerEmail: profile.email,
                    totalAmount: updatedOrder.total_amount,
                    items: (updatedOrder.order_items || []).map((item: any) => ({
                        productName: item.products?.name || item.name,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                });

                console.log(`Order completion email sent to ${profile.email}`);
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
            }
        }

        // Send FCM push notification to user's mobile app
        if (updatedOrder.user_id) {
            try {
                const { sendPushNotification } = await import('@/lib/fcm');
                await sendPushNotification(updatedOrder.user_id, {
                    title: status === 'Confirmed'
                        ? 'Order Confirmed! ✅'
                        : 'Order Delivered! 📦',
                    body: status === 'Confirmed'
                        ? `Your order #${updatedOrder.order_no || updatedOrder.id} has been confirmed by the admin.`
                        : `Your order #${updatedOrder.order_no || updatedOrder.id} has been delivered.`,
                    data: {
                        type: 'order_status_update',
                        orderId: updatedOrder.id.toString(),
                        status,
                    },
                });
            } catch (pushError) {
                console.error('Failed to send push notification:', pushError);
            }
        }

        return NextResponse.json({
            id: updatedOrder.id.toString(),
            status: updatedOrder.status,
            message: 'Order status updated successfully',
        });
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500 }
        );
    }
}
