-- Add cancellation fields to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Update status CHECK constraint (if one exists) to allow 'Cancelled'
-- If you have a CHECK constraint on status, run:
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
-- ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('Ordered', 'Confirmed', 'Delivered', 'Cancelled'));
