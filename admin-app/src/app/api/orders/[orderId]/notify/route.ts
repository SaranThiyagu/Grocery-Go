import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { sendPushNotification } from '@/lib/fcm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorizedResponse();

    const { orderId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Fetch order details to get order_no and other info
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, delivery_date, delivery_slot')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Fetch the specific customer's FCM token from 'User' table
    // (This is already handled inside sendPushNotification in @/lib/fcm)
    
    // 3. Send notification
    const orderRef = `#${order.id}`;
    const result = await sendPushNotification(userId, {
      title: 'Order Confirmed ✅',
      body: `Your order ${orderRef} is confirmed. Delivery: ${order.delivery_date || ''}, ${order.delivery_slot || ''}.`,
      data: {
        type: 'order_status_update',
        orderId: order.id.toString(),
        status: order.status,
      },
    });

    if (result.success) {
      return NextResponse.json({ success: true, sent: result.sent });
    } else {
      return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in notify route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
