-- Update assessments table to support dynamic room types
-- Remove the CHECK constraint on room_type to allow any room type from room_types table

-- Drop the existing CHECK constraint
ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_room_type_check;

-- Update any existing data to use the new room type names if needed
-- (This is optional - you might want to keep existing data as is)
-- UPDATE assessments SET room_type = 'guest_bathroom' WHERE room_type = 'guest_bathroom';
-- UPDATE assessments SET room_type = 'master_bathroom' WHERE room_type = 'master_bathroom';
-- UPDATE assessments SET room_type = 'kitchen' WHERE room_type = 'kitchen';
-- UPDATE assessments SET room_type = 'other' WHERE room_type = 'other';

-- Add a foreign key constraint to room_types table (optional)
-- This ensures room_type references a valid room type
-- ALTER TABLE assessments ADD CONSTRAINT fk_assessments_room_type 
--   FOREIGN KEY (room_type) REFERENCES room_types(name) ON DELETE RESTRICT;
