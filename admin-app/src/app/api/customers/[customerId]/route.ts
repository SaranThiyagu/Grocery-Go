import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ customerId: string }> }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const { customerId } = await params;

        const { data: customer, error } = await supabaseAdmin
            .from('customers')
            .select('*')
            .eq('id', customerId)
            .single();

        if (error || !customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            id: customer.id,
            fullName: customer.full_name,
            storeName: customer.store_name,
            mobileNo: customer.mobile_no,
            alternateContactNo: customer.alternate_contact_no,
            email: customer.email,
            gstNo: customer.gst_no,
            dateOfBirth: customer.date_of_birth,
            anniversaryDate: customer.anniversary_date,
            gender: customer.gender,
            addressLine1: customer.address_line1,
            addressLine2: customer.address_line2,
            city: customer.city,
            state: customer.state,
            pincode: customer.pincode,
            country: customer.country,
            customerType: customer.customer_type,
            status: customer.status,
            tags: customer.tags,
            notes: customer.notes,
            createdAt: customer.created_at,
            updatedAt: customer.updated_at,
            createdBy: customer.created_by,
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        return NextResponse.json(
            { error: 'Failed to fetch customer' },
            { status: 500 }
        );
    }
}
