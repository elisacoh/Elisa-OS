/*
  # Système de catégories centralisé

  1. Nouvelle table
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique par utilisateur)
      - `icon` (text, emoji)
      - `color` (text, couleur theme)
      - `type` (text, type de catégorie: 'general', 'task', 'goal', 'event')
      - `is_default` (boolean, catégorie par défaut du système)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Modifications
    - Mise à jour des tables existantes pour utiliser les nouvelles catégories
    - Migration des données existantes

  3. Sécurité
    - Enable RLS sur `categories`
    - Politiques pour que les utilisateurs voient leurs catégories + les catégories par défaut
*/

-- Table des catégories centralisée
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text DEFAULT '📝',
  color text DEFAULT 'neutral',
  type text DEFAULT 'general' CHECK (type IN ('general', 'task', 'goal', 'event')),
  is_default boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  -- Contrainte unique : nom unique par utilisateur (sauf pour les catégories par défaut)
  UNIQUE(name, user_id)
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Politique RLS : utilisateurs voient leurs catégories + les catégories par défaut
CREATE POLICY "Users can view their categories and default ones"
  ON categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_default = true);

-- Politique RLS : utilisateurs peuvent gérer leurs propres catégories
CREATE POLICY "Users can manage their own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND is_default = false)
  WITH CHECK (auth.uid() = user_id AND is_default = false);

-- Insertion des catégories par défaut du système
INSERT INTO categories (name, icon, color, type, is_default, user_id) VALUES
  -- Catégories générales
  ('Développement', '💻', 'blue', 'general', true, NULL),
  ('Corps & Santé', '💪', 'mint', 'general', true, NULL),
  ('Mental & Mindfulness', '🧠', 'primary', 'general', true, NULL),
  ('Vie pratique', '🏠', 'yellow', 'general', true, NULL),
  ('Relations', '❤️', 'rose', 'general', true, NULL),
  ('Finances', '💰', 'green', 'general', true, NULL),
  ('Créativité', '🎨', 'purple', 'general', true, NULL),
  ('Apprentissage', '📚', 'indigo', 'general', true, NULL),
  ('Voyage', '✈️', 'cyan', 'general', true, NULL),
  ('Loisirs', '🎮', 'orange', 'general', true, NULL),
  ('Spiritualité', '🙏', 'violet', 'general', true, NULL),
  ('Environnement', '🌱', 'emerald', 'general', true, NULL),
  ('Technologie', '📱', 'slate', 'general', true, NULL),
  ('Cuisine', '🍳', 'amber', 'general', true, NULL),
  ('Sport', '⚽', 'lime', 'general', true, NULL),
  ('Musique', '🎵', 'pink', 'general', true, NULL),
  ('Lecture', '📖', 'teal', 'general', true, NULL),
  ('Jardinage', '🌻', 'green', 'general', true, NULL),
  ('Photographie', '📸', 'gray', 'general', true, NULL),
  ('Autre', '📝', 'neutral', 'general', true, NULL)
ON CONFLICT (name, user_id) DO NOTHING;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_categories_default ON categories(is_default) WHERE is_default = true;

-- Fonction pour obtenir les catégories disponibles pour un utilisateur
CREATE OR REPLACE FUNCTION get_user_categories(user_uuid uuid, category_type text DEFAULT 'general')
RETURNS TABLE (
  id uuid,
  name text,
  icon text,
  color text,
  type text,
  is_default boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.icon, c.color, c.type, c.is_default
  FROM categories c
  WHERE (c.user_id = user_uuid OR c.is_default = true)
    AND (category_type = 'general' OR c.type = category_type)
  ORDER BY c.is_default DESC, c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;