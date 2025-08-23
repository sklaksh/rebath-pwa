-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'employee', 'manager')) DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  address TEXT NOT NULL,
  project_type TEXT CHECK (project_type IN ('bathroom', 'kitchen', 'full_remodel')) NOT NULL,
  status TEXT CHECK (status IN ('assessment', 'quote_ready', 'in_progress', 'completed', 'cancelled')) DEFAULT 'assessment',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  estimated_start_date DATE,
  estimated_completion_date DATE,
  actual_start_date DATE,
  actual_completion_date DATE,
  total_budget DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assessments table
CREATE TABLE assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  room_type TEXT CHECK (room_type IN ('guest_bathroom', 'master_bathroom', 'kitchen', 'other')) NOT NULL,
  room_name TEXT NOT NULL,
  fixtures JSONB NOT NULL DEFAULT '[]',
  measurements JSONB NOT NULL DEFAULT '{}',
  photos TEXT[],
  notes TEXT,
  status TEXT CHECK (status IN ('draft', 'submitted', 'reviewed')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quotes table
CREATE TABLE quotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
  quote_number TEXT UNIQUE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_percentage DECIMAL(5,4) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  valid_until DATE NOT NULL,
  status TEXT CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')) DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fixture categories table
CREATE TABLE fixture_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fixture options table
CREATE TABLE fixture_options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES fixture_categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  size TEXT,
  material TEXT,
  color TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  installation_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offline drafts table
CREATE TABLE offline_drafts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('assessment', 'quote', 'project')) NOT NULL,
  data JSONB NOT NULL,
  sync_status TEXT CHECK (sync_status IN ('pending', 'synced', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

CREATE INDEX idx_assessments_project_id ON assessments(project_id);
CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_room_type ON assessments(room_type);
CREATE INDEX idx_assessments_status ON assessments(status);

CREATE INDEX idx_quotes_project_id ON quotes(project_id);
CREATE INDEX idx_quotes_user_id ON quotes(user_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);

CREATE INDEX idx_fixture_options_category_id ON fixture_options(category_id);
CREATE INDEX idx_fixture_options_brand ON fixture_options(brand);
CREATE INDEX idx_fixture_options_is_active ON fixture_options(is_active);

CREATE INDEX idx_offline_drafts_user_id ON offline_drafts(user_id);
CREATE INDEX idx_offline_drafts_type ON offline_drafts(type);
CREATE INDEX idx_offline_drafts_sync_status ON offline_drafts(sync_status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fixture_options_updated_at BEFORE UPDATE ON fixture_options FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offline_drafts_updated_at BEFORE UPDATE ON offline_drafts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixture_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixture_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_drafts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for assessments
CREATE POLICY "Users can view their own assessments" ON assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessments" ON assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments" ON assessments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assessments" ON assessments
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for quotes
CREATE POLICY "Users can view their own quotes" ON quotes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotes" ON quotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes" ON quotes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes" ON quotes
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for fixture categories (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view fixture categories" ON fixture_categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create RLS policies for fixture options (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view fixture options" ON fixture_options
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create RLS policies for offline drafts
CREATE POLICY "Users can view their own offline drafts" ON offline_drafts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own offline drafts" ON offline_drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offline drafts" ON offline_drafts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own offline drafts" ON offline_drafts
  FOR DELETE USING (auth.uid() = user_id);

-- Insert default fixture categories
INSERT INTO fixture_categories (name, description, display_order) VALUES
  ('Faucets', 'Kitchen and bathroom faucets', 1),
  ('Sinks', 'Kitchen and bathroom sinks', 2),
  ('Toilets', 'Toilet fixtures and accessories', 3),
  ('Tubs & Showers', 'Bathtubs, shower bases, and enclosures', 4),
  ('Cabinets & Vanities', 'Bathroom vanities and storage', 5),
  ('Countertops', 'Kitchen and bathroom countertops', 6),
  ('Lighting', 'Bathroom and kitchen lighting fixtures', 7),
  ('Hardware', 'Door handles, towel bars, and accessories', 8);

-- Insert sample fixture options
INSERT INTO fixture_options (category_id, name, description, brand, model, size, material, color, base_price, installation_cost, is_active) VALUES
  ((SELECT id FROM fixture_categories WHERE name = 'Faucets'), 'Single Handle Kitchen Faucet', 'Modern single handle kitchen faucet with pull-down sprayer', 'Delta', 'Trinsic', '8.5"', 'Brass', 'Chrome', 299.99, 150.00, true),
  ((SELECT id FROM fixture_categories WHERE name = 'Faucets'), 'Widespread Bathroom Faucet', 'Elegant 3-hole bathroom faucet', 'Moen', 'Align', '8"', 'Brass', 'Brushed Nickel', 189.99, 120.00, true),
  ((SELECT id FROM fixture_categories WHERE name = 'Sinks'), 'Undermount Kitchen Sink', 'Stainless steel undermount kitchen sink', 'Kohler', 'Vault', '33" x 22"', 'Stainless Steel', 'Silver', 399.99, 200.00, true),
  ((SELECT id FROM fixture_categories WHERE name = 'Sinks'), 'Drop-in Bathroom Sink', 'Ceramic drop-in bathroom sink', 'American Standard', 'Cadet', '19" x 16"', 'Ceramic', 'White', 89.99, 80.00, true),
  ((SELECT id FROM fixture_categories WHERE name = 'Toilets'), 'One-Piece Toilet', 'Modern one-piece toilet with dual flush', 'Toto', 'Ultramax II', '28.5" x 16.5"', 'Vitreous China', 'Cotton White', 599.99, 250.00, true),
  ((SELECT id FROM fixture_categories WHERE name = 'Tubs & Showers'), 'Acrylic Bathtub', 'Freestanding acrylic bathtub', 'American Standard', 'Evolution', '60" x 32"', 'Acrylic', 'White', 899.99, 400.00, true),
  ((SELECT id FROM fixture_categories WHERE name = 'Cabinets & Vanities'), 'Double Vanity', '60" double bathroom vanity with marble top', 'Kohler', 'Purist', '60" x 21"', 'Wood', 'White', 1299.99, 300.00, true),
  ((SELECT id FROM fixture_categories WHERE name = 'Countertops'), 'Quartz Countertop', 'Premium quartz countertop', 'Caesarstone', 'Frosty Carrina', 'Custom', 'Quartz', 'White', 89.99, 45.00, true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
