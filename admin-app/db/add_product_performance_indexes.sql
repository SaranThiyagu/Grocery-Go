-- Indexes to improve mobile product listing query performance
-- Run once in Supabase SQL editor

CREATE INDEX IF NOT EXISTS idx_products_is_active
    ON products (is_active);

CREATE INDEX IF NOT EXISTS idx_products_category_id
    ON products (category_id);

-- Composite index used by the mobile filter:
-- .eq('is_active', true) + category grouping
CREATE INDEX IF NOT EXISTS idx_products_is_active_category
    ON products (is_active, category_id);
