/*
  # Initial Schema for JuBeTech E-commerce

  1. New Tables
    - `users`: Store user profiles and preferences
      - `id` (uuid, primary key): User's unique identifier
      - `email` (text): User's email address
      - `full_name` (text): User's full name
      - `phone` (text): User's phone number
      - `address` (text): User's shipping address
      - `created_at` (timestamp): Account creation timestamp
      - `updated_at` (timestamp): Last update timestamp

    - `products`: Store product catalog
      - `id` (uuid, primary key): Product's unique identifier
      - `name` (text): Product name
      - `description` (text): Product description
      - `price` (numeric): Product base price
      - `category` (text): Product category
      - `image_url` (text): Product image URL
      - `available_colors` (text[]): Available color options
      - `available_sizes` (text[]): Available size options
      - `stock` (integer): Current stock quantity
      - `created_at` (timestamp): Product creation timestamp
      - `updated_at` (timestamp): Last update timestamp

    - `orders`: Store customer orders
      - `id` (uuid, primary key): Order's unique identifier
      - `user_id` (uuid, foreign key): Reference to users table
      - `status` (text): Order status (pending, processing, completed, etc.)
      - `total_amount` (numeric): Total order amount
      - `shipping_address` (text): Shipping address
      - `payment_method` (text): Payment method used
      - `created_at` (timestamp): Order creation timestamp
      - `updated_at` (timestamp): Last update timestamp

    - `order_items`: Store items within orders
      - `id` (uuid, primary key): Order item's unique identifier
      - `order_id` (uuid, foreign key): Reference to orders table
      - `product_id` (uuid, foreign key): Reference to products table
      - `print_job_id` (uuid, foreign key): Reference to print_jobs table
      - `quantity` (integer): Item quantity
      - `unit_price` (numeric): Price per unit
      - `customization` (jsonb): Customization details
      - `created_at` (timestamp): Creation timestamp

    - `print_jobs`: Store printing service orders
      - `id` (uuid, primary key): Print job's unique identifier
      - `user_id` (uuid, foreign key): Reference to users table
      - `file_url` (text): URL to the file to be printed
      - `paper_type` (text): Type of paper selected
      - `color` (boolean): Color or black and white
      - `size` (text): Paper size
      - `copies` (integer): Number of copies
      - `notes` (text): Additional notes
      - `status` (text): Job status
      - `price` (numeric): Total price
      - `created_at` (timestamp): Job creation timestamp
      - `updated_at` (timestamp): Last update timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Read their own data
      - Create new orders and print jobs
      - Update their own orders and print jobs
    - Add policies for public access to products catalog
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  category text NOT NULL,
  image_url text,
  available_colors text[],
  available_sizes text[],
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  shipping_address text NOT NULL,
  payment_method text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create print_jobs table
CREATE TABLE IF NOT EXISTS print_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL,
  paper_type text NOT NULL,
  color boolean NOT NULL DEFAULT false,
  size text NOT NULL,
  copies integer NOT NULL DEFAULT 1 CHECK (copies > 0),
  notes text,
  status text NOT NULL DEFAULT 'pending',
  price numeric NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  print_job_id uuid REFERENCES print_jobs(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  customization jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT item_type_check CHECK (
    (product_id IS NOT NULL AND print_job_id IS NULL) OR
    (product_id IS NULL AND print_job_id IS NOT NULL)
  )
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Create policies for products table
CREATE POLICY "Anyone can read products" ON products
  FOR SELECT
  TO public
  USING (true);

-- Create policies for orders table
CREATE POLICY "Users can read own orders" ON orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for order_items table
CREATE POLICY "Users can read own order items" ON order_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can create order items" ON order_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  ));

-- Create policies for print_jobs table
CREATE POLICY "Users can read own print jobs" ON print_jobs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create print jobs" ON print_jobs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own print jobs" ON print_jobs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_print_jobs_updated_at
  BEFORE UPDATE ON print_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();