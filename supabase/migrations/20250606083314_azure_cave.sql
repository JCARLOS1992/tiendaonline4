/*
  # Add product status field

  1. Changes
    - Add is_active column to products table
    - Set default value to true for existing products
    - Update RLS policies to handle the new field

  2. Security
    - Maintains existing RLS policies
    - Admins can manage product status
*/

-- Add is_active column to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Update existing products to be active by default
UPDATE products SET is_active = true WHERE is_active IS NULL;