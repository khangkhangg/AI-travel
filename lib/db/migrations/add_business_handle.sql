-- Add business handle for friendly URLs
-- Handle format: lowercase letters, numbers, hyphens (e.g., saigon-tours, vn-adventures)

-- Add handle column to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS handle VARCHAR(50) UNIQUE;

-- Create index for fast handle lookups
CREATE INDEX IF NOT EXISTS idx_businesses_handle ON businesses(handle) WHERE handle IS NOT NULL;

-- Function to generate a default handle from business name
CREATE OR REPLACE FUNCTION generate_business_handle(name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_handle TEXT;
  final_handle TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens
  base_handle := lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'));
  -- Remove leading/trailing hyphens
  base_handle := trim(both '-' from base_handle);
  -- Limit to 45 chars to leave room for suffix
  base_handle := substring(base_handle from 1 for 45);

  final_handle := base_handle;

  -- Check for uniqueness and add suffix if needed
  WHILE EXISTS (SELECT 1 FROM businesses WHERE handle = final_handle) LOOP
    counter := counter + 1;
    final_handle := base_handle || '-' || counter;
  END LOOP;

  RETURN final_handle;
END;
$$ LANGUAGE plpgsql;

-- Optional: Generate handles for existing businesses that don't have one
-- UPDATE businesses SET handle = generate_business_handle(business_name) WHERE handle IS NULL;
