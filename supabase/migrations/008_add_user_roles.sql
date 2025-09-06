-- Add user roles to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- Add user approval status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- Add created_at and updated_at if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create fixture_categories table
CREATE TABLE IF NOT EXISTS fixture_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fixture_options table
CREATE TABLE IF NOT EXISTS fixture_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES fixture_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE fixture_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixture_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fixture_categories
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fixture_categories' 
    AND policyname = 'Anyone can view fixture categories'
  ) THEN
    CREATE POLICY "Anyone can view fixture categories" ON fixture_categories
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fixture_categories' 
    AND policyname = 'Admins can manage fixture categories'
  ) THEN
    CREATE POLICY "Admins can manage fixture categories" ON fixture_categories
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- RLS Policies for fixture_options
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fixture_options' 
    AND policyname = 'Anyone can view fixture options'
  ) THEN
    CREATE POLICY "Anyone can view fixture options" ON fixture_options
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fixture_options' 
    AND policyname = 'Admins can manage fixture options'
  ) THEN
    CREATE POLICY "Admins can manage fixture options" ON fixture_options
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- Note: fixture_categories and fixture_options tables already exist with different schemas
-- The admin panel will work with the existing tables
