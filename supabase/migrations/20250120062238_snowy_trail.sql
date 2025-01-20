/*
  # Add email functionality

  1. New Tables
    - `email_templates`
      - `id` (uuid, primary key)
      - `name` (text)
      - `subject` (text)
      - `content` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `sent_emails`
      - `id` (uuid, primary key)
      - `template_id` (uuid, references email_templates)
      - `user_id` (uuid, references profiles)
      - `subject` (text)
      - `content` (text)
      - `status` (text)
      - `sent_at` (timestamp)
      
  2. Security
    - Enable RLS on both tables
    - Add policies for admin access
*/

-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sent emails table
CREATE TABLE IF NOT EXISTS sent_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES email_templates(id),
  user_id uuid REFERENCES profiles(id),
  subject text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;

-- Email templates policies
CREATE POLICY "Only admins can manage email templates"
  ON email_templates
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Sent emails policies
CREATE POLICY "Only admins can view and manage sent emails"
  ON sent_emails
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
