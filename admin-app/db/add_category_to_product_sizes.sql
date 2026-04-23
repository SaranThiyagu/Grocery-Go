-- Migration: Add category_sizes table for predefined size suggestions per category
-- Run this in your Supabase SQL Editor

-- 1. Create category_sizes table (predefined size suggestions per category)
CREATE TABLE IF NOT EXISTS category_sizes (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    size_label TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('retail', 'wholesale')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (category_id, size_label, type)
);

-- 2. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_category_sizes_category_id ON category_sizes(category_id);

-- 3. Enable RLS
ALTER TABLE category_sizes ENABLE ROW LEVEL SECURITY;

-- 4. RLS policy for authenticated read
CREATE POLICY "Allow authenticated read category_sizes" ON category_sizes
    FOR SELECT TO authenticated USING (true);

-- =====================================================
-- 5. Seed size suggestions per category
-- Each category has UNIQUE, business-relevant sizes
-- based on how products are actually sold in grocery retail
-- =====================================================

-- Vegetables (id: 1) — sold by weight AND by piece/bunch
INSERT INTO category_sizes (category_id, size_label, type) VALUES
    (1, '100g', 'retail'),
    (1, '250g', 'retail'),
    (1, '500g', 'retail'),
    (1, '1kg', 'retail'),
    (1, 'per piece', 'retail'),
    (1, 'per bunch', 'retail'),
    (1, '5kg', 'wholesale'),
    (1, '10kg', 'wholesale'),
    (1, '25kg', 'wholesale'),
    (1, '50kg', 'wholesale')
ON CONFLICT (category_id, size_label, type) DO NOTHING;

-- Fruits (id: 2) — sold by piece, dozen, kg
INSERT INTO category_sizes (category_id, size_label, type) VALUES
    (2, 'per piece', 'retail'),
    (2, 'per dozen', 'retail'),
    (2, '250g', 'retail'),
    (2, '500g', 'retail'),
    (2, '1kg', 'retail'),
    (2, '5kg', 'wholesale'),
    (2, '10kg', 'wholesale'),
    (2, '20kg', 'wholesale'),
    (2, '1 crate', 'wholesale')
ON CONFLICT (category_id, size_label, type) DO NOTHING;

-- Dairy (id: 3) — sold by volume (milk/curd) and weight (paneer/cheese)
INSERT INTO category_sizes (category_id, size_label, type) VALUES
    (3, '100ml', 'retail'),
    (3, '200ml', 'retail'),
    (3, '500ml', 'retail'),
    (3, '1L', 'retail'),
    (3, '100g', 'retail'),
    (3, '200g', 'retail'),
    (3, '500g', 'retail'),
    (3, '5L', 'wholesale'),
    (3, '10L', 'wholesale'),
    (3, '25L', 'wholesale'),
    (3, '5kg', 'wholesale'),
    (3, '10kg', 'wholesale')
ON CONFLICT (category_id, size_label, type) DO NOTHING;

-- Grains (id: 4) — sold by weight in larger quantities
INSERT INTO category_sizes (category_id, size_label, type) VALUES
    (4, '500g', 'retail'),
    (4, '1kg', 'retail'),
    (4, '2kg', 'retail'),
    (4, '5kg', 'retail'),
    (4, '10kg', 'wholesale'),
    (4, '25kg', 'wholesale'),
    (4, '50kg', 'wholesale'),
    (4, '100kg', 'wholesale')
ON CONFLICT (category_id, size_label, type) DO NOTHING;

-- Spices (id: 5) — sold in small weight packets
INSERT INTO category_sizes (category_id, size_label, type) VALUES
    (5, '25g', 'retail'),
    (5, '50g', 'retail'),
    (5, '100g', 'retail'),
    (5, '200g', 'retail'),
    (5, '500g', 'retail'),
    (5, '1kg', 'wholesale'),
    (5, '5kg', 'wholesale'),
    (5, '10kg', 'wholesale'),
    (5, '25kg', 'wholesale')
ON CONFLICT (category_id, size_label, type) DO NOTHING;

-- Snacks (id: 6) — sold by pack/weight
INSERT INTO category_sizes (category_id, size_label, type) VALUES
    (6, '25g', 'retail'),
    (6, '50g', 'retail'),
    (6, '100g', 'retail'),
    (6, '200g', 'retail'),
    (6, '400g', 'retail'),
    (6, '1kg', 'wholesale'),
    (6, '5kg', 'wholesale'),
    (6, '1 box (12pc)', 'wholesale'),
    (6, '1 box (24pc)', 'wholesale')
ON CONFLICT (category_id, size_label, type) DO NOTHING;

-- Beverages (id: 7) — sold by volume (bottle/can sizes)
INSERT INTO category_sizes (category_id, size_label, type) VALUES
    (7, '200ml', 'retail'),
    (7, '330ml', 'retail'),
    (7, '500ml', 'retail'),
    (7, '1L', 'retail'),
    (7, '2L', 'retail'),
    (7, '5L', 'wholesale'),
    (7, '10L', 'wholesale'),
    (7, '20L', 'wholesale'),
    (7, '1 case (12)', 'wholesale'),
    (7, '1 case (24)', 'wholesale')
ON CONFLICT (category_id, size_label, type) DO NOTHING;

-- Household (id: 8) — sold by volume and count
INSERT INTO category_sizes (category_id, size_label, type) VALUES
    (8, '100ml', 'retail'),
    (8, '250ml', 'retail'),
    (8, '500ml', 'retail'),
    (8, '1L', 'retail'),
    (8, '1 pack', 'retail'),
    (8, '3 pack', 'retail'),
    (8, '5L', 'wholesale'),
    (8, '10L', 'wholesale'),
    (8, '25L', 'wholesale'),
    (8, '1 box (6)', 'wholesale'),
    (8, '1 box (12)', 'wholesale')
ON CONFLICT (category_id, size_label, type) DO NOTHING;

-- Pulses (id: 9) — sold by weight
INSERT INTO category_sizes (category_id, size_label, type) VALUES
    (9, '250g', 'retail'),
    (9, '500g', 'retail'),
    (9, '1kg', 'retail'),
    (9, '2kg', 'retail'),
    (9, '5kg', 'wholesale'),
    (9, '10kg', 'wholesale'),
    (9, '25kg', 'wholesale'),
    (9, '50kg', 'wholesale')
ON CONFLICT (category_id, size_label, type) DO NOTHING;
