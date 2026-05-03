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

    // 1. Fetch order details to get order_no and other info
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, delivery_date, delivery_slot, user_id, customer_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const actualUserId = userId || order.customer_id || order.user_id;

    if (!actualUserId) {
      console.log(`No user associated with order ${orderId}, skipping notification.`);
      return NextResponse.json({ success: true, sent: 0, message: 'No user to notify' });
    }

    // 2. Fetch the specific customer's FCM token from 'User' table
    // (This is already handled inside sendPushNotification in @/lib/fcm)
    
    // 3. Send notification
    const orderRef = `#${order.id}`;
    const result = await sendPushNotification(actualUserId, {
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

  } catch (error: any) {
    console.error('Notification API Error Details:', error);
    return NextResponse.json(
      { error: `Notification System Error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
