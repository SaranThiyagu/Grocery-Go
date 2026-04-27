import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorizedResponse();

    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, created_at')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error fetching categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    return NextResponse.json(categories || []);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST — Create a new category
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 });
      }
      console.error('Error creating category:', error);
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

// PUT — Update a category
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
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('categories')
      .update({ name: name.trim() })
      .eq('id', id);

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 });
      }
      console.error('Error updating category:', error);
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE — Remove a category by id
export async function DELETE(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Check if any products use this category
    const { count: productCount } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (productCount && productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${productCount} product${productCount > 1 ? 's' : ''} use this category` },
        { status: 409 }
      );
    }

    // Also check category_sizes
    const { count: sizeCount } = await supabaseAdmin
      .from('category_sizes')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (sizeCount && sizeCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${sizeCount} size${sizeCount > 1 ? 's' : ''} are linked to this category. Remove them first.` },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
