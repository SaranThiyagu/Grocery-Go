import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { isDeliverySlot } from '@/lib/delivery';

export const dynamic = 'force-dynamic';

/** Returns YYYY-MM-DD for today in server-local time. */
function todayIsoDate(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

const ORDER_SELECT = `
    *,
    customers ( id, full_name, store_name, mobile_no, email, customer_type ),
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
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const { orderId } = await params;

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
        const customer = (order as any).customers as any;
        const transformedOrder = {
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
            createdBy: (order as any).created_by || 'customer',
            invoiceUrl: order.invoice_url || undefined,
            deliveryDate: (order as any).delivery_date || null,
            deliverySlot: (order as any).delivery_slot || null,
            deliveryDateHistory: (order as any).delivery_date_history || [],
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
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const { orderId } = await params;

        const body = await request.json();
        const {
            status,
            comment,
            deliveryDate,
            deliverySlot,
            rescheduleReason,
        }: {
            status?: string;
            comment?: string | null;
            deliveryDate?: string | null;
            deliverySlot?: string | null;
            rescheduleReason?: string | null;
        } = body;

        // Fetch current order (needed for both status updates and reschedule).
        const { data: currentOrder, error: fetchCurrentError } = await supabaseAdmin
            .from('orders')
            .select('status, delivery_date, delivery_slot, delivery_date_history')
            .eq('id', orderId)
            .single();

        if (fetchCurrentError || !currentOrder) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        const updateData: Record<string, unknown> = {};
        const isStatusChange = !!status && status !== currentOrder.status;
        const isReschedule = !isStatusChange && (deliveryDate !== undefined || deliverySlot !== undefined);

        if (!isStatusChange && !isReschedule && comment === undefined) {
            return NextResponse.json(
                { error: 'Status or delivery update is required' },
                { status: 400 }
            );
        }

        // ----- Status transition -----
        if (isStatusChange) {
            const allowedNext = VALID_TRANSITIONS[currentOrder.status];
            if (allowedNext !== status) {
                return NextResponse.json(
                    { error: `Invalid transition: ${currentOrder.status} → ${status}. Allowed: ${currentOrder.status} → ${allowedNext || 'none (terminal state)'}` },
                    { status: 400 }
                );
            }
            updateData.status = status;

            // Ordered → Confirmed requires delivery_date + delivery_slot.
            if (currentOrder.status === 'Ordered' && status === 'Confirmed') {
                if (!deliveryDate || !deliverySlot) {
                    return NextResponse.json(
                        { error: 'Delivery date and slot are required to confirm an order.' },
                        { status: 400 }
                    );
                }
                if (!isDeliverySlot(deliverySlot)) {
                    return NextResponse.json(
                        { error: 'Invalid delivery slot. Use Morning, Afternoon or Evening.' },
                        { status: 400 }
                    );
                }
                if (deliveryDate < todayIsoDate()) {
                    return NextResponse.json(
                        { error: 'Delivery date cannot be in the past.' },
                        { status: 400 }
                    );
                }
                updateData.delivery_date = deliveryDate;
                updateData.delivery_slot = deliverySlot;
                const history = Array.isArray(currentOrder.delivery_date_history)
                    ? currentOrder.delivery_date_history
                    : [];
                updateData.delivery_date_history = [
                    ...history,
                    {
                        from: null,
                        to: deliveryDate,
                        slot_from: null,
                        slot_to: deliverySlot,
                        reason: 'Initial schedule on confirmation',
                        by: user.id || user.email || 'admin',
                        at: new Date().toISOString(),
                    },
                ];
            }
        }

        // ----- Reschedule (no status change) -----
        if (isReschedule) {
            if (currentOrder.status !== 'Confirmed') {
                return NextResponse.json(
                    { error: 'Delivery date can only be rescheduled while the order is Confirmed.' },
                    { status: 400 }
                );
            }
            const newDate = deliveryDate ?? currentOrder.delivery_date;
            const newSlot = deliverySlot ?? currentOrder.delivery_slot;
            if (!newDate || !newSlot) {
                return NextResponse.json(
                    { error: 'Delivery date and slot are required.' },
                    { status: 400 }
                );
            }
            if (!isDeliverySlot(newSlot)) {
                return NextResponse.json(
                    { error: 'Invalid delivery slot.' },
                    { status: 400 }
                );
            }
            if (newDate < todayIsoDate()) {
                return NextResponse.json(
                    { error: 'Delivery date cannot be in the past.' },
                    { status: 400 }
                );
            }
            const reason = (rescheduleReason || '').trim();
            if (!reason) {
                return NextResponse.json(
                    { error: 'A reason is required when rescheduling delivery.' },
                    { status: 400 }
                );
            }
            updateData.delivery_date = newDate;
            updateData.delivery_slot = newSlot;
            const history = Array.isArray(currentOrder.delivery_date_history)
                ? currentOrder.delivery_date_history
                : [];
            updateData.delivery_date_history = [
                ...history,
                {
                    from: currentOrder.delivery_date,
                    to: newDate,
                    slot_from: currentOrder.delivery_slot,
                    slot_to: newSlot,
                    reason,
                    by: user.id || user.email || 'admin',
                    at: new Date().toISOString(),
                },
            ];
        }

        if (comment !== undefined && comment !== null) {
            updateData.admin_comment = comment;
        }

        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update(updateData as never)
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

        const finalDeliveryDate: string | null = (updatedOrder as any).delivery_date || null;
        const finalDeliverySlot: string | null = (updatedOrder as any).delivery_slot || null;

        // Email (status change → Confirmed/Delivered, or reschedule)
        if (profile.email) {
            try {
                const emailLib = await import('@/lib/email');
                if (isStatusChange && status === 'Confirmed') {
                    await emailLib.sendOrderConfirmedEmail({
                        orderId: updatedOrder.id.toString(),
                        customerName: profile.name || 'Customer',
                        customerEmail: profile.email,
                        deliveryDate: finalDeliveryDate,
                        deliverySlot: finalDeliverySlot,
                    });
                } else if (isStatusChange && status === 'Delivered') {
                    await emailLib.sendOrderCompletionEmail({
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
                } else if (isReschedule) {
                    await emailLib.sendDeliveryRescheduledEmail({
                        orderId: updatedOrder.id.toString(),
                        customerName: profile.name || 'Customer',
                        customerEmail: profile.email,
                        deliveryDate: finalDeliveryDate,
                        deliverySlot: finalDeliverySlot,
                        reason: (rescheduleReason || '').trim(),
                    });
                }
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
            }
        }

        // FCM push (status change or reschedule)
        if (updatedOrder.user_id && (isStatusChange || isReschedule)) {
            try {
                const { sendPushNotification } = await import('@/lib/fcm');
                const orderRef = `#${updatedOrder.order_no || updatedOrder.id}`;
                let title = '';
                let bodyText = '';
                if (isReschedule) {
                    title = 'Delivery rescheduled 🔄';
                    bodyText = `Order ${orderRef} delivery moved to ${finalDeliveryDate || ''}, ${finalDeliverySlot || ''}.`;
                } else if (status === 'Confirmed') {
                    title = 'Order Confirmed! ✅';
                    bodyText = `Your order ${orderRef} is confirmed. Delivery: ${finalDeliveryDate || ''}, ${finalDeliverySlot || ''}.`;
                } else if (status === 'Delivered') {
                    title = 'Order Delivered! 📦';
                    bodyText = `Your order ${orderRef} has been delivered.`;
                }
                if (title) {
                    await sendPushNotification(updatedOrder.user_id, {
                        title,
                        body: bodyText,
                        data: {
                            type: isReschedule ? 'order_delivery_reschedule' : 'order_status_update',
                            orderId: updatedOrder.id.toString(),
                            status: updatedOrder.status,
                            deliveryDate: finalDeliveryDate || '',
                            deliverySlot: finalDeliverySlot || '',
                        },
                    });
                }
            } catch (pushError) {
                console.error('Failed to send push notification:', pushError);
            }
        }

        return NextResponse.json({
            id: updatedOrder.id.toString(),
            status: updatedOrder.status,
            deliveryDate: finalDeliveryDate,
            deliverySlot: finalDeliverySlot,
            message: isReschedule
                ? 'Delivery rescheduled successfully'
                : 'Order status updated successfully',
        });
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500 }
        );
    }
}

// PUT - Update order items (add, remove, change qty)
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const { orderId } = await params;
        const body = await request.json();
        const { items } = body;

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'At least one item is required' },
                { status: 400 }
            );
        }

        // Validate each item
        for (const item of items) {
            if (!item.productId || !item.productName || !item.quantity || item.quantity < 1) {
                return NextResponse.json(
                    { error: 'Each item must have productId, productName, and quantity >= 1' },
                    { status: 400 }
                );
            }
        }

        // Verify order exists and is not delivered
        const { data: currentOrder, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('id, status')
            .eq('id', orderId)
            .single();

        if (fetchError || !currentOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (currentOrder.status === 'Delivered') {
            return NextResponse.json(
                { error: 'Cannot edit a delivered order' },
                { status: 400 }
            );
        }

        // Delete existing order items
        const { error: deleteError } = await supabaseAdmin
            .from('order_items')
            .delete()
            .eq('order_id', orderId);

        if (deleteError) {
            console.error('Error deleting old order items:', deleteError);
            return NextResponse.json({ error: 'Failed to update order items' }, { status: 500 });
        }

        // Insert new order items
        const newItems = items.map((item: any) => ({
            order_id: orderId,
            product_id: item.productId,
            name: item.size ? `${item.productName} (${item.size})` : item.productName,
            quantity: item.quantity,
            price: 0,
            size: item.size || null,
        }));

        const { error: insertError } = await supabaseAdmin
            .from('order_items')
            .insert(newItems);

        if (insertError) {
            console.error('Error inserting order items:', insertError);
            return NextResponse.json({ error: 'Failed to update order items' }, { status: 500 });
        }

        // Update total_amount to 0 (no pricing) and updated_at
        await supabaseAdmin
            .from('orders')
            .update({ total_amount: 0, updated_at: new Date().toISOString() })
            .eq('id', orderId);

        // Re-fetch updated order
        const { data: updatedOrder, error: reFetchError } = await supabaseAdmin
            .from('orders')
            .select(ORDER_SELECT)
            .eq('id', orderId)
            .single();

        if (reFetchError || !updatedOrder) {
            return NextResponse.json({ error: 'Failed to fetch updated order' }, { status: 500 });
        }

        // Fetch user profile
        let profile: any = {};
        if (updatedOrder.user_id) {
            const { data } = await supabaseAdmin
                .from('profiles')
                .select('id, name, email, picture')
                .eq('id', updatedOrder.user_id)
                .single();
            if (data) profile = data;
        }

        const customer = (updatedOrder as any).customers as any;
        const transformedOrder = {
            id: updatedOrder.id.toString(),
            userId: updatedOrder.user_id,
            userName: customer?.full_name || profile.name || 'Unknown',
            userEmail: customer?.email || profile.email || 'N/A',
            userAvatar: profile.picture,
            customerId: updatedOrder.customer_id || null,
            customerName: customer?.full_name || null,
            customerStoreName: customer?.store_name || null,
            customerMobile: customer?.mobile_no || null,
            customerEmail: customer?.email || null,
            customerType: customer?.customer_type || null,
            totalAmount: updatedOrder.total_amount,
            status: updatedOrder.status,
            createdAt: updatedOrder.created_at,
            updatedAt: updatedOrder.updated_at,
            invoiceUrl: updatedOrder.invoice_url || undefined,
            deliveryDate: (updatedOrder as any).delivery_date || null,
            deliverySlot: (updatedOrder as any).delivery_slot || null,
            items: (updatedOrder.order_items || []).map((item: any) => {
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

        return NextResponse.json(transformedOrder);
    } catch (error) {
        console.error('Error updating order items:', error);
        return NextResponse.json(
            { error: 'Failed to update order items' },
            { status: 500 }
        );
    }
}
