/*
  # Système d'objectifs avec catégories et liaisons

  1. Nouvelles Tables
    - `goal_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `icon` (text)
      - `color` (text)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `goals`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text, nullable)
      - `category` (text)
      - `context` (text)
      - `timeline` (text)
      - `status` (text)
      - `deadline` (date, nullable)
      - `progress` (decimal, 0.0 to 1.0)
      - `linked_to` (uuid, foreign key to goals)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Modifications
    - Mise à jour de la table `tasks` pour ajouter `goal_linked`

  3. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques pour que les utilisateurs ne voient que leurs données
*/

-- Table des catégories d'objectifs personnalisables
CREATE TABLE IF NOT EXISTS goal_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  icon text DEFAULT '🎯',
  color text DEFAULT 'primary',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Table des objectifs
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text DEFAULT 'vision',
  context text DEFAULT 'perso' CHECK (context IN ('pro', 'perso', 'hybride')),
  timeline text DEFAULT 'monthly' CHECK (timeline IN ('life', 'yearly', 'quarterly', 'monthly', 'weekly', 'daily')),
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'abandoned')),
  deadline date,
  progress decimal DEFAULT 0.0 CHECK (progress >= 0.0 AND progress <= 1.0),
  linked_to uuid REFERENCES goals(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Mise à jour de la table tasks pour ajouter la liaison aux objectifs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'goal_linked'
  ) THEN
    ALTER TABLE tasks ADD COLUMN goal_linked uuid REFERENCES goals(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE goal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour goal_categories
CREATE POLICY "Users can manage their own goal categories"
  ON goal_categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour goals
CREATE POLICY "Users can manage their own goals"
  ON goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger pour updated_at sur goals
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goals_updated_at();

-- Insertion des catégories par défaut
INSERT INTO goal_categories (name, icon, color, user_id) VALUES
  ('dev', '💻', 'blue', auth.uid()),
  ('corps', '💪', 'mint', auth.uid()),
  ('mental', '🧠', 'primary', auth.uid()),
  ('vie pratique', '🏠', 'yellow', auth.uid()),
  ('relations', '❤️', 'rose', auth.uid()),
  ('projet Timz', '🚀', 'purple', auth.uid()),
  ('vision', '🎯', 'primary', auth.uid()),
  ('reset', '🔄', 'peach', auth.uid()),
  ('admin', '📋', 'neutral', auth.uid()),
  ('finance', '💰', 'green', auth.uid())
ON CONFLICT (name) DO NOTHING;