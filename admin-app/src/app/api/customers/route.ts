import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const customerType = searchParams.get('customer_type');
        const status = searchParams.get('status');

        let query = supabaseAdmin
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

        if (search) {
            query = query.or(
                `full_name.ilike.%${search}%,store_name.ilike.%${search}%,mobile_no.ilike.%${search}%,email.ilike.%${search}%`
            );
        }

        if (customerType && customerType !== 'all') {
            query = query.eq('customer_type', customerType);
        }

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: customers, error } = await query;

        if (error) {
            console.error('Supabase error fetching customers:', error);
            return NextResponse.json(
                { error: 'Failed to fetch customers' },
                { status: 500 }
            );
        }

        const transformed = (customers || []).map(c => ({
            id: c.id,
            fullName: c.full_name,
            storeName: c.store_name,
            mobileNo: c.mobile_no,
            alternateContactNo: c.alternate_contact_no,
            email: c.email,
            gstNo: c.gst_no,
            dateOfBirth: c.date_of_birth,
            anniversaryDate: c.anniversary_date,
            gender: c.gender,
            addressLine1: c.address_line1,
            addressLine2: c.address_line2,
            city: c.city,
            state: c.state,
            pincode: c.pincode,
            country: c.country,
            customerType: c.customer_type,
            status: c.status,
            tags: c.tags,
            notes: c.notes,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            createdBy: c.created_by,
        }));

        return NextResponse.json(transformed);
    } catch (error) {
        console.error('Error fetching customers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch customers' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const body = await request.json();
        const {
            full_name, store_name, mobile_no, alternate_contact_no,
            email, gst_no, date_of_birth, anniversary_date, gender,
            address_line1, address_line2, city, state, pincode, country,
            customer_type, status, tags, notes,
        } = body;

        if (!full_name || !mobile_no) {
            return NextResponse.json(
                { error: 'Full name and mobile number are required' },
                { status: 400 }
            );
        }

        // Check for duplicate mobile number
        const { data: existing } = await supabaseAdmin
            .from('customers')
            .select('id')
            .eq('mobile_no', mobile_no.trim())
            .limit(1);

        if (existing && existing.length > 0) {
            return NextResponse.json(
                { error: 'A customer with this mobile number already exists' },
                { status: 409 }
            );
        }

        const { data: customer, error } = await supabaseAdmin
            .from('customers')
            .insert({
                full_name: full_name.trim(),
                store_name: store_name?.trim() || null,
                mobile_no: mobile_no.trim(),
                alternate_contact_no: alternate_contact_no?.trim() || null,
                email: email?.trim() || null,
                gst_no: gst_no?.trim() || null,
                date_of_birth: date_of_birth || null,
                anniversary_date: anniversary_date || null,
                gender: gender || null,
                address_line1: address_line1?.trim() || null,
                address_line2: address_line2?.trim() || null,
                city: city?.trim() || null,
                state: state?.trim() || null,
                pincode: pincode?.trim() || null,
                country: country?.trim() || 'India',
                customer_type: customer_type || 'retail',
                status: status || 'active',
                tags: tags || null,
                notes: notes?.trim() || null,
                created_by: user.id,
            })
            .select()
            .single();

        if (error || !customer) {
            console.error('Supabase error creating customer:', error);
            return NextResponse.json(
                { error: 'Failed to create customer' },
                { status: 500 }
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
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating customer:', error);
        return NextResponse.json(
            { error: 'Failed to create customer' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const body = await request.json();
        const {
            id, full_name, store_name, mobile_no, alternate_contact_no,
            email, gst_no, date_of_birth, anniversary_date, gender,
            address_line1, address_line2, city, state, pincode, country,
            customer_type, status, tags, notes,
        } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Customer ID is required' },
                { status: 400 }
            );
        }

        if (!full_name || !mobile_no) {
            return NextResponse.json(
                { error: 'Full name and mobile number are required' },
                { status: 400 }
            );
        }

        // Check for duplicate mobile number (excluding self)
        const { data: existing } = await supabaseAdmin
            .from('customers')
            .select('id')
            .eq('mobile_no', mobile_no.trim())
            .neq('id', id)
            .limit(1);

        if (existing && existing.length > 0) {
            return NextResponse.json(
                { error: 'A customer with this mobile number already exists' },
                { status: 409 }
            );
        }

        const { data: customer, error } = await supabaseAdmin
            .from('customers')
            .update({
                full_name: full_name.trim(),
                store_name: store_name?.trim() || null,
                mobile_no: mobile_no.trim(),
                alternate_contact_no: alternate_contact_no?.trim() || null,
                email: email?.trim() || null,
                gst_no: gst_no?.trim() || null,
                date_of_birth: date_of_birth || null,
                anniversary_date: anniversary_date || null,
                gender: gender || null,
                address_line1: address_line1?.trim() || null,
                address_line2: address_line2?.trim() || null,
                city: city?.trim() || null,
                state: state?.trim() || null,
                pincode: pincode?.trim() || null,
                country: country?.trim() || 'India',
                customer_type: customer_type || 'retail',
                status: status || 'active',
                tags: tags || null,
                notes: notes?.trim() || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error || !customer) {
            console.error('Supabase error updating customer:', error);
            return NextResponse.json(
                { error: 'Failed to update customer' },
                { status: 500 }
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
        console.error('Error updating customer:', error);
        return NextResponse.json(
            { error: 'Failed to update customer' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return unauthorizedResponse();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Customer ID is required' },
                { status: 400 }
            );
        }

        // Check if customer is referenced in orders
        const { data: linkedOrders, error: checkError } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('user_id', id)
            .limit(1);

        if (checkError) {
            console.error('Error checking orders:', checkError);
            return NextResponse.json(
                { error: 'Failed to verify customer usage' },
                { status: 500 }
            );
        }

        if (linkedOrders && linkedOrders.length > 0) {
            return NextResponse.json(
                { error: 'This customer cannot be deleted because they have existing orders. Consider marking them as inactive instead.' },
                { status: 409 }
            );
        }

        const { error } = await supabaseAdmin
            .from('customers')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase error deleting customer:', error);
            return NextResponse.json(
                { error: 'Failed to delete customer' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting customer:', error);
        return NextResponse.json(
            { error: 'Failed to delete customer' },
            { status: 500 }
        );
    }
}
