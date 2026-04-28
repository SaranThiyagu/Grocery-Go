-- Adds delivery scheduling fields to the orders table.
-- The owner is required to set delivery_date + delivery_slot when an order
-- transitions from 'Ordered' -> 'Confirmed'. delivery_date_history records
-- every reschedule with reason for audit.

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS delivery_date DATE,
    ADD COLUMN IF NOT EXISTS delivery_slot TEXT,
    ADD COLUMN IF NOT EXISTS delivery_date_history JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Allowed values for delivery_slot.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_delivery_slot_check'
    ) THEN
        ALTER TABLE orders
            ADD CONSTRAINT orders_delivery_slot_check
            CHECK (delivery_slot IS NULL OR delivery_slot IN ('Morning', 'Afternoon', 'Evening'));
    END IF;
END$$;

-- Index for filtering / sorting by upcoming delivery.
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date
    ON orders (delivery_date)
    WHERE delivery_date IS NOT NULL;

COMMENT ON COLUMN orders.delivery_date IS 'Date promised to the customer for delivery (set when order is Confirmed).';
COMMENT ON COLUMN orders.delivery_slot IS 'Delivery time slot: Morning | Afternoon | Evening.';
COMMENT ON COLUMN orders.delivery_date_history IS 'Audit log of delivery_date / delivery_slot changes: [{from, to, slot_from, slot_to, reason, by, at}].';
