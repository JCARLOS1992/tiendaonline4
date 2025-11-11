-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('company', '{"name":"JuBeTech","ruc":"20123456789","address":"Av. Principal 123, Lima, Perú","phone":"+51 987 654 321","email":"ventas@jubetech.com","website":"https://www.jubetech.com"}'::jsonb),
  ('shipping', '{"freeShippingThreshold":100,"shippingCost":15,"estimatedDays":3}'::jsonb),
  ('payment', '{"yapeEnabled":true,"plinEnabled":true,"bankTransferEnabled":true,"cardEnabled":false,"yapeNumber":"987654321","plinNumber":"987654321","bankAccount":"CCI: 003-12345678901234567890","bankName":"Interbank"}'::jsonb),
  ('receipt', '{"headerText":"¡Gracias por su compra!","footerText":"Conserve este documento para sus registros.","showIGV":true,"receiptPrefix":"BOL"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read settings
CREATE POLICY "Settings are viewable by everyone"
  ON settings FOR SELECT
  USING (true);

-- Policy: Only authenticated users can update settings
CREATE POLICY "Settings are updatable by authenticated users"
  ON settings FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Only authenticated users can insert settings
CREATE POLICY "Settings are insertable by authenticated users"
  ON settings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

