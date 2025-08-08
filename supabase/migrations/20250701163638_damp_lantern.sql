/*
  # Create events table

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `start_date_time` (timestamptz, required)
      - `end_date_time` (timestamptz, optional)
      - `duration` (integer, optional - minutes)
      - `category` (text, with constraints)
      - `context` (text, with constraints)
      - `goal_linked` (uuid, optional foreign key)
      - `is_recurring` (boolean, default false)
      - `recurrence_rule` (text, optional)
      - `location` (text, optional)
      - `link` (text, optional)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `events` table
    - Add policy for authenticated users to manage their own events

  3. Triggers
    - Add trigger to update `updated_at` on changes
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date_time timestamptz NOT NULL,
  end_date_time timestamptz,
  duration integer, -- Duration in minutes if no end_date_time
  category text NOT NULL DEFAULT 'autre',
  context text NOT NULL DEFAULT 'perso',
  goal_linked uuid REFERENCES goals(id) ON DELETE SET NULL,
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  location text,
  link text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE events ADD CONSTRAINT events_category_check 
  CHECK (category = ANY (ARRAY['corps'::text, 'mental'::text, 'dev'::text, 'admin'::text, 'relations'::text, 'vision'::text, 'projet Timz'::text, 'reset'::text, 'vie pratique'::text, 'autre'::text]));

ALTER TABLE events ADD CONSTRAINT events_context_check 
  CHECK (context = ANY (ARRAY['pro'::text, 'perso'::text, 'hybride'::text]));

ALTER TABLE events ADD CONSTRAINT events_duration_check 
  CHECK (duration IS NULL OR duration > 0);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own events"
  ON events
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_user_date ON events(user_id, start_date_time);
CREATE INDEX IF NOT EXISTS idx_events_goal_linked ON events(goal_linked);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();