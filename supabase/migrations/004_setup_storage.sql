-- Enable Supabase Storage
-- This creates the storage system for file uploads

-- Create a storage bucket for assessment photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assessment-photos', 'assessment-photos', true);

-- Create storage policies for assessment photos
-- Users can upload photos to their own assessments
CREATE POLICY "Users can upload their own assessment photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'assessment-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own assessment photos
CREATE POLICY "Users can view their own assessment photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'assessment-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own assessment photos
CREATE POLICY "Users can update their own assessment photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'assessment-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own assessment photos
CREATE POLICY "Users can delete their own assessment photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'assessment-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
