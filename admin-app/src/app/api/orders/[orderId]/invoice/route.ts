import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const BUCKET = 'order-invoices';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

// POST - Upload invoice for an order
export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorizedResponse();

    const orderId = params.orderId;

    // Verify order exists
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, invoice_url')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('invoice') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, JPEG, PNG, WebP' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10 MB' },
        { status: 400 }
      );
    }

    // Delete old invoice file if exists
    if (order.invoice_url) {
      const oldPath = extractStoragePath(order.invoice_url);
      if (oldPath) {
        await supabaseAdmin.storage.from(BUCKET).remove([oldPath]);
      }
    }

    // Upload new file
    const ext = file.name.split('.').pop() || 'pdf';
    const sanitizedExt = ext.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const filePath = `${orderId}/invoice-${Date.now()}.${sanitizedExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload invoice' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    const invoiceUrl = urlData.publicUrl;

    // Save URL to order
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ invoice_url: invoiceUrl })
      .eq('id', orderId);

    if (updateError) {
      console.error('DB update error:', updateError);
      // Rollback: remove uploaded file
      await supabaseAdmin.storage.from(BUCKET).remove([filePath]);
      return NextResponse.json(
        { error: 'Failed to save invoice reference' },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoiceUrl });
  } catch (error) {
    console.error('Invoice upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload invoice' },
      { status: 500 }
    );
  }
}

// DELETE - Remove invoice from an order
export async function DELETE(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorizedResponse();

    const orderId = params.orderId;

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, invoice_url')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.invoice_url) {
      return NextResponse.json({ error: 'No invoice to delete' }, { status: 400 });
    }

    // Remove from storage
    const storagePath = extractStoragePath(order.invoice_url);
    if (storagePath) {
      await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    }

    // Clear URL in DB
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ invoice_url: null })
      .eq('id', orderId);

    if (updateError) {
      console.error('DB update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove invoice reference' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Invoice delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}

/** Extract the storage path from a full public URL */
function extractStoragePath(url: string): string | null {
  try {
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(url.substring(idx + marker.length));
  } catch {
    return null;
  }
}
