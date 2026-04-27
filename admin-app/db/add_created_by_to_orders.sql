-- Add created_by column to orders table
-- Values: 'customer' (placed via mobile app) or 'admin' (placed via admin panel)

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT 'customer';

-- Backfill: all existing orders were created by customers
UPDATE orders SET created_by = 'customer' WHERE created_by IS NULL;

COMMENT ON COLUMN orders.created_by IS 'Who created the order: customer or admin';
