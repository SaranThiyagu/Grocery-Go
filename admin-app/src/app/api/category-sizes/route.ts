import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET — List all category sizes with category name, optional filter by categoryId
export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('categoryId');

        let query = supabaseAdmin
            .from('category_sizes')
            .select('id, category_id, size_label, type, created_at, categories ( id, name )')
            .order('category_id', { ascending: true })
            .order('type', { ascending: true })
            .order('size_label', { ascending: true });

        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching category sizes:', error);
            return NextResponse.json({ error: 'Failed to fetch category sizes' }, { status: 500 });
        }

        const transformed = (data || []).map((row: any) => ({
            id: row.id,
            categoryId: row.category_id,
            categoryName: row.categories?.name || 'Unknown',
            sizeLabel: row.size_label,
            type: row.type,
            createdAt: row.created_at,
        }));

        return NextResponse.json(transformed);
    } catch (error) {
        console.error('Error fetching category sizes:', error);
        return NextResponse.json({ error: 'Failed to fetch category sizes' }, { status: 500 });
    }
}

// POST — Create one or more category sizes
export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const body = await request.json();
        const { categoryId, sizeLabel, type, sizes } = body;

        // Batch mode: sizes is an array of { sizeLabel, type }
        if (Array.isArray(sizes) && categoryId) {
            const rows = sizes.map((s: { sizeLabel: string; type: string }) => ({
                category_id: categoryId,
                size_label: s.sizeLabel.trim(),
                type: s.type,
            }));

            const { data, error } = await supabaseAdmin
                .from('category_sizes')
                .insert(rows)
                .select();

            if (error) {
                if (error.code === '23505') {
                    return NextResponse.json({ error: 'One or more sizes already exist for this category' }, { status: 409 });
                }
                console.error('Error creating category sizes:', error);
                return NextResponse.json({ error: 'Failed to create category sizes' }, { status: 500 });
            }

            return NextResponse.json(data, { status: 201 });
        }

        // Single mode
        if (!categoryId || !sizeLabel || !type) {
            return NextResponse.json({ error: 'categoryId, sizeLabel, and type are required' }, { status: 400 });
        }

        if (!['retail', 'wholesale'].includes(type)) {
            return NextResponse.json({ error: 'type must be retail or wholesale' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('category_sizes')
            .insert({ category_id: categoryId, size_label: sizeLabel.trim(), type })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'This size already exists for the selected category and type' }, { status: 409 });
            }
            console.error('Error creating category size:', error);
            return NextResponse.json({ error: 'Failed to create category size' }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Error creating category size:', error);
        return NextResponse.json({ error: 'Failed to create category size' }, { status: 500 });
    }
}

// PUT — Update a category size
export async function PUT(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const body = await request.json();
        const { id, sizeLabel, type } = body;

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const updateData: Record<string, any> = {};
        if (sizeLabel !== undefined) updateData.size_label = sizeLabel.trim();
        if (type !== undefined) {
            if (!['retail', 'wholesale'].includes(type)) {
                return NextResponse.json({ error: 'type must be retail or wholesale' }, { status: 400 });
            }
            updateData.type = type;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('category_sizes')
            .update(updateData)
            .eq('id', id);

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'This size already exists for the selected category and type' }, { status: 409 });
            }
            console.error('Error updating category size:', error);
            return NextResponse.json({ error: 'Failed to update category size' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating category size:', error);
        return NextResponse.json({ error: 'Failed to update category size' }, { status: 500 });
    }
}

// DELETE — Remove a category size by id
export async function DELETE(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('category_sizes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting category size:', error);
            return NextResponse.json({ error: 'Failed to delete category size' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting category size:', error);
        return NextResponse.json({ error: 'Failed to delete category size' }, { status: 500 });
    }
}
