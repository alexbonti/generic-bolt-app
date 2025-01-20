/*
  # Create news images storage bucket

  1. Storage
    - Create 'news-images' bucket for storing news article images
  
  2. Security
    - Enable public access to read images
    - Allow authenticated users to upload images
    - Restrict file types to images only
*/

-- Create the news-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-images', 'news-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read images
CREATE POLICY "Public can view news images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'news-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload news images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'news-images'
  AND auth.role() = 'authenticated'
  -- Restrict to image files
  AND (storage.extension(name) = 'jpg'
    OR storage.extension(name) = 'jpeg'
    OR storage.extension(name) = 'png'
    OR storage.extension(name) = 'gif'
    OR storage.extension(name) = 'webp')
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own news images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'news-images'
  AND auth.uid() = owner
);
