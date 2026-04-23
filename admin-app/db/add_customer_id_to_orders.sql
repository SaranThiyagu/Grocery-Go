-- Migration: Add customer_id to orders table
-- Run this in your Supabase SQL Editor

-- 1. Add customer_id column to orders table
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer_id UUID NULL REFERENCES customers(id);

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
