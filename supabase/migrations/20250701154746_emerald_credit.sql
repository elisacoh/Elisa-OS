/*
  # Création de la table des entrées de journal

  1. Nouvelle table
    - `journal_entries`
      - `id` (uuid, primary key)
      - `date` (date, unique par utilisateur)
      - `mood_morning` (text, emoji)
      - `mood_morning_level` (integer, 1-5)
      - `mood_evening` (text, emoji)
      - `mood_evening_level` (integer, 1-5)
      - `segments` (jsonb, array des segments d'écriture)
      - `goals_today` (text[], IDs des objectifs du jour)
      - `goals_status` (text, achieved/partial/failed)
      - `task_completion_ratio` (decimal, 0.0-1.0)
      - `efficiency_rating` (integer, 1-5)
      - `day_rating` (integer, 1-10)
      - `day_tag` (text, productive/off/chaotique/fluide/révélateur)
      - `proud_of` (text[], ce dont on est fier)
      - `want_to_improve` (text[], ce qu'on veut améliorer)
      - `insight` (text, insight ou leçon)
      - `is_at_peace` (boolean)
      - `keywords` (text[], mots-clés auto-tags)
      - `tasks_linked` (text[], IDs des tâches liées)
      - `goals_linked` (text[], IDs des objectifs liés)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS sur `journal_entries`
    - Politique pour que les utilisateurs ne voient que leurs entrées
*/

CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  
  -- Moods
  mood_morning text,
  mood_morning_level integer CHECK (mood_morning_level >= 1 AND mood_morning_level <= 5),
  mood_evening text,
  mood_evening_level integer CHECK (mood_evening_level >= 1 AND mood_evening_level <= 5),
  
  -- Segments d'écriture libre
  segments jsonb DEFAULT '[]'::jsonb,
  
  -- Objectifs du jour
  goals_today text[],
  goals_status text CHECK (goals_status IN ('achieved', 'partial', 'failed')),
  task_completion_ratio decimal DEFAULT 0.0 CHECK (task_completion_ratio >= 0.0 AND task_completion_ratio <= 1.0),
  
  -- Évaluations personnelles
  efficiency_rating integer CHECK (efficiency_rating >= 1 AND efficiency_rating <= 5),
  day_rating integer CHECK (day_rating >= 1 AND day_rating <= 10),
  day_tag text CHECK (day_tag IN ('productive', 'off', 'chaotique', 'fluide', 'révélateur', 'épuisante', 'inspirante')),
  
  -- Réflexions personnelles
  proud_of text[],
  want_to_improve text[],
  insight text,
  is_at_peace boolean,
  
  -- Mots-clés et liens
  keywords text[],
  tasks_linked text[],
  goals_linked text[],
  
  -- Système
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contrainte unique : une entrée par jour par utilisateur
  UNIQUE(date, user_id)
);

-- Enable RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Politique RLS
CREATE POLICY "Users can manage their own journal entries"
  ON journal_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_journal_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_journal_entries_updated_at();

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON journal_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_day_rating ON journal_entries(user_id, day_rating DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_keywords ON journal_entries USING GIN(keywords);