-- Create room_types table
CREATE TABLE room_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for room_types
CREATE INDEX idx_room_types_display_order ON room_types(display_order);
CREATE INDEX idx_room_types_is_active ON room_types(is_active);

-- Enable RLS for room_types
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for room_types (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view room types" ON room_types
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert default room types
INSERT INTO room_types (name, display_name, description, icon, display_order) VALUES
  ('guest_bathroom', 'Guest Bathroom', 'Secondary bathroom for guests', '🚿', 1),
  ('master_bathroom', 'Master Bathroom', 'Primary bathroom connected to master bedroom', '🛁', 2),
  ('powder_room', 'Powder Room', 'Half bathroom with toilet and sink', '🚽', 3),
  ('kitchen', 'Kitchen', 'Kitchen space for cooking and food preparation', '🍳', 4),
  ('laundry_room', 'Laundry Room', 'Room for washing machines and dryers', '🧺', 5),
  ('mudroom', 'Mudroom', 'Entry room for storing outdoor gear', '👢', 6),
  ('closet', 'Closet', 'Storage space for clothes and belongings', '👕', 7),
  ('other', 'Other', 'Custom room type', '🏠', 8);

-- Update assessments table to reference room_types
ALTER TABLE assessments 
DROP CONSTRAINT IF EXISTS assessments_room_type_check;

-- Add foreign key constraint to room_types
ALTER TABLE assessments 
ADD CONSTRAINT assessments_room_type_fkey 
FOREIGN KEY (room_type) REFERENCES room_types(name) ON UPDATE CASCADE;

-- Create trigger for room_types updated_at
CREATE TRIGGER update_room_types_updated_at 
BEFORE UPDATE ON room_types 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
