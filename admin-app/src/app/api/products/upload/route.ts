import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const BUCKET = 'product-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

// Output image constraints
const OUTPUT_MAX_DIMENSION = 800; // px — largest side
const OUTPUT_WEBP_QUALITY = 82;

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorizedResponse();

    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5 MB' },
        { status: 400 }
      );
    }

    // Generate a safe unique filename — always .webp after compression
    const filePath = `${crypto.randomUUID()}.webp`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compress and convert to WebP — resize to fit within 800×800, preserve aspect ratio
    let compressed: Buffer;
    try {
      compressed = await sharp(buffer)
        .resize(OUTPUT_MAX_DIMENSION, OUTPUT_MAX_DIMENSION, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: OUTPUT_WEBP_QUALITY })
        .toBuffer();
    } catch (sharpError) {
      console.error('Image processing error:', sharpError);
      return NextResponse.json({ error: 'Failed to process image' }, { status: 422 });
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, compressed, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({ imageUrl: urlData.publicUrl });
  } catch (error) {
    console.error('Product image upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
