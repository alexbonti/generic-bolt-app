/*
  # Add LinkedIn-like profile fields

  1. New Fields
    - Added to profiles table:
      - headline (text): Professional headline/title
      - bio (text): About section
      - location (text): User's location
      - avatar_url (text): Profile picture URL
      - website (text): Personal website
      - company (text): Current company
      - position (text): Current position
      - skills (text[]): Array of skills
      - education (jsonb[]): Array of education history
      - experience (jsonb[]): Array of work experience

  2. Storage
    - Create avatar-images bucket for profile pictures
    - Add policies for avatar image access and management

  3. Changes
    - Add default values and constraints
    - Enable RLS policies for new storage bucket
*/

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headline text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS position text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education jsonb[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience jsonb[] DEFAULT '{}';

-- Create avatar-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar-images', 'avatar-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read avatar images
CREATE POLICY "Public can view avatar images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatar-images');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatar-images'
  AND auth.uid() = owner
  AND (storage.extension(name) = 'jpg'
    OR storage.extension(name) = 'jpeg'
    OR storage.extension(name) = 'png'
    OR storage.extension(name) = 'gif'
    OR storage.extension(name) = 'webp')
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatar-images'
  AND auth.uid() = owner
);
