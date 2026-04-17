-- ============================================================
-- Fix: Auto-populate product_id in order_items
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. BACKFILL: Update existing order_items with NULL product_id
UPDATE order_items oi
SET product_id = p.id
FROM products p
WHERE oi.product_id IS NULL
  AND LOWER(TRIM(oi.name)) = LOWER(TRIM(p.name));

-- 2. TRIGGER: Auto-resolve product_id on future inserts
CREATE OR REPLACE FUNCTION resolve_order_item_product_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only resolve if product_id is not already set
    IF NEW.product_id IS NULL AND NEW.name IS NOT NULL THEN
        SELECT id INTO NEW.product_id
        FROM products
        WHERE LOWER(TRIM(name)) = LOWER(TRIM(NEW.name))
        LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_resolve_order_item_product_id ON order_items;

CREATE TRIGGER trg_resolve_order_item_product_id
    BEFORE INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION resolve_order_item_product_id();
