import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('categoryId');

        let query = supabaseAdmin
            .from('category_sizes')
            .select('size_label, type');

        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }

        const { data: sizes, error } = await query;

        if (error) {
            console.error('Error fetching size suggestions:', error);
            return NextResponse.json(
                { error: 'Failed to fetch size suggestions' },
                { status: 500 }
            );
        }

        // Get distinct size labels grouped by type
        const retailSet = new Set<string>();
        const wholesaleSet = new Set<string>();

        for (const size of sizes || []) {
            if (size.type === 'retail') {
                retailSet.add(size.size_label);
            } else if (size.type === 'wholesale') {
                wholesaleSet.add(size.size_label);
            }
        }

        return NextResponse.json({
            retail: Array.from(retailSet),
            wholesale: Array.from(wholesaleSet),
        });
    } catch (error) {
        console.error('Error fetching size suggestions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch size suggestions' },
            { status: 500 }
        );
    }
}
