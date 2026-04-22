-- Migration: Add brands table, product_sizes table, and new columns to products
-- Run this in your Supabase SQL Editor

-- 1. Create brands table
CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create product_sizes table
CREATE TABLE IF NOT EXISTS product_sizes (
    id SERIAL PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size_label TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('retail', 'wholesale')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (product_id, size_label, type)
);

-- 3. Add new columns to products
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id),
    ADD COLUMN IF NOT EXISTS selling_mode TEXT NOT NULL DEFAULT 'both' CHECK (selling_mode IN ('retail', 'wholesale', 'both'));

-- 4. Make price nullable (currently NOT NULL) since new form omits price
ALTER TABLE products ALTER COLUMN price DROP NOT NULL;
ALTER TABLE products ALTER COLUMN price SET DEFAULT 0;

-- 5. Add is_active column if it doesn't exist (was used in code but not in schema)
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_sizes_product_id ON product_sizes(product_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_selling_mode ON products(selling_mode);

-- 7. Enable RLS on new tables (match existing pattern)
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for brands (read for authenticated users)
CREATE POLICY "Allow authenticated read brands" ON brands
    FOR SELECT TO authenticated USING (true);

-- 9. Create RLS policies for product_sizes (read for authenticated users)
CREATE POLICY "Allow authenticated read product_sizes" ON product_sizes
    FOR SELECT TO authenticated USING (true);
