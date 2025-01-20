/*
  # Add video support to news

  1. Changes
    - Add video_url column to news table for YouTube/external video links
    - Add video_type column to distinguish between different video sources
    - Add video_file_url column for uploaded videos

  2. Security
    - Update RLS policies to allow video uploads
    - Create new storage bucket for video files
*/

-- Add new columns to news table
ALTER TABLE news 
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS video_type text CHECK (video_type IN ('youtube', 'upload', null)),
ADD COLUMN IF NOT EXISTS video_file_url text;

-- Create video-files bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-videos', 'news-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read videos
CREATE POLICY "Public can view news videos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'news-videos');

-- Allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload news videos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'news-videos'
  AND auth.role() = 'authenticated'
  AND (storage.extension(name) = 'mp4'
    OR storage.extension(name) = 'webm'
    OR storage.extension(name) = 'mov')
);
