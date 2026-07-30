-- Add cart_abandonment_sent column to orders table for Cart Abandonment Cron
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cart_abandonment_sent BOOLEAN DEFAULT FALSE;
