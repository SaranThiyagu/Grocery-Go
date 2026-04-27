import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorizedResponse();

    const { data: brands, error } = await supabaseAdmin
      .from('brands')
      .select('id, name, created_at')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error fetching brands:', error);
      return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
    }

    return NextResponse.json(brands || []);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

// POST — Create a new brand
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('brands')
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A brand with this name already exists' }, { status: 409 });
      }
      console.error('Error creating brand:', error);
      return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}

// PUT — Update a brand
export async function PUT(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const { id, name } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('brands')
      .update({ name: name.trim() })
      .eq('id', id);

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A brand with this name already exists' }, { status: 409 });
      }
      console.error('Error updating brand:', error);
      return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating brand:', error);
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
  }
}

// DELETE — Remove a brand by id
export async function DELETE(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Check if any products use this brand
    const { count } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${count} product${count > 1 ? 's' : ''} use this brand` },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin
      .from('brands')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting brand:', error);
      return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting brand:', error);
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }
}
