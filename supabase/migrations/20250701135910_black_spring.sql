/*
  # Create tasks table

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `category` (text, required)
      - `context` (text, required)
      - `priority` (text, required)
      - `status` (text, required)
      - `date_planned` (date, optional)
      - `time_planned` (time, optional)
      - `duration_estimate` (integer, optional)
      - `energy_level` (text, optional)
      - `was_planned_for` (date, optional)
      - `last_planned_for` (date, optional)
      - `reschedule_count` (integer, default 0)
      - `is_auto_rescheduled` (boolean, default false)
      - `goal_linked` (text, optional)
      - `is_recurring` (boolean, default false)
      - `recurrence_rule` (text, optional)
      - `recurrence_days` (text[], optional)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `tasks` table
    - Add policy for authenticated users to manage their own tasks
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'autre',
  context text NOT NULL DEFAULT 'perso',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'todo',
  date_planned date,
  time_planned time,
  duration_estimate integer,
  energy_level text,
  was_planned_for date,
  last_planned_for date,
  reschedule_count integer DEFAULT 0,
  is_auto_rescheduled boolean DEFAULT false,
  goal_linked text,
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  recurrence_days text[],
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own tasks
CREATE POLICY "Users can manage their own tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();