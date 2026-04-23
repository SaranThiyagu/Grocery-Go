-- Add size column to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size text;

-- Backfill: extract size from the name field where it appears in parentheses
-- e.g., "Moong Dal (250g)" → size = "250g"
UPDATE order_items
SET size = substring(name FROM '\(([^)]+)\)$')
WHERE size IS NULL
  AND name ~ '\([^)]+\)$';
