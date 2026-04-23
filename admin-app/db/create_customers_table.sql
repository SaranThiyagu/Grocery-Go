-- Migration: Create customers table
-- Run this in your Supabase SQL Editor

-- 1. Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    store_name TEXT NULL,
    mobile_no CHARACTER VARYING(15) NOT NULL,
    alternate_contact_no CHARACTER VARYING(15) NULL,
    email TEXT NULL,
    gst_no CHARACTER VARYING(15) NULL,
    date_of_birth DATE NULL,
    anniversary_date DATE NULL,
    gender TEXT NULL,
    address_line1 TEXT NULL,
    address_line2 TEXT NULL,
    city TEXT NULL,
    state TEXT NULL,
    pincode CHARACTER VARYING(10) NULL,
    country TEXT NULL DEFAULT 'India',
    customer_type TEXT NULL DEFAULT 'retail',
    status TEXT NULL DEFAULT 'active',
    tags JSONB NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL DEFAULT now(),
    created_by UUID NULL,
    CONSTRAINT customers_pkey PRIMARY KEY (id),
    CONSTRAINT customers_mobile_no_unique UNIQUE (mobile_no),
    CONSTRAINT customers_customer_type_check CHECK (customer_type IN ('retail', 'wholesale')),
    CONSTRAINT customers_status_check CHECK (status IN ('active', 'inactive')),
    CONSTRAINT customers_gender_check CHECK (gender IN ('male', 'female', 'other'))
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_mobile_no ON customers(mobile_no);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_full_name ON customers(full_name);

-- 3. Enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies (read for authenticated users)
CREATE POLICY "Allow authenticated read customers" ON customers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert customers" ON customers
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update customers" ON customers
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete customers" ON customers
    FOR DELETE TO authenticated USING (true);
