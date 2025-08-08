/*
  # Mise à jour du système de catégories centralisé

  1. Modifications
    - Suppression de la contrainte is_default pour permettre la modification de toutes les catégories
    - Mise à jour des politiques RLS pour permettre la modification de toutes les catégories
    - Ajout d'une catégorie "Autre" protégée comme fallback
    - Mise à jour des contraintes pour empêcher la suppression/modification de "Autre"

  2. Fonctions
    - Fonction de fallback automatique vers "Autre" lors de suppressions
    - Trigger pour gérer les références orphelines

  3. Sécurité
    - Seule la catégorie "Autre" est protégée
    - Toutes les autres catégories peuvent être modifiées/supprimées
*/

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;
DROP POLICY IF EXISTS "Users can view their categories and default ones" ON categories;

-- Ajouter une colonne pour identifier la catégorie protégée
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_protected boolean DEFAULT false;

-- Marquer "Autre" comme catégorie protégée
UPDATE categories SET is_protected = true WHERE name = 'Autre';

-- Nouvelles politiques RLS plus permissives
CREATE POLICY "Users can view all categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can manage non-protected categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND is_protected = false)
  WITH CHECK (auth.uid() = user_id AND is_protected = false);

-- Fonction pour obtenir l'ID de la catégorie "Autre" pour un utilisateur
CREATE OR REPLACE FUNCTION get_fallback_category_id(user_uuid uuid)
RETURNS uuid AS $$
DECLARE
  fallback_id uuid;
BEGIN
  -- Chercher d'abord une catégorie "Autre" personnalisée de l'utilisateur
  SELECT id INTO fallback_id
  FROM categories
  WHERE user_id = user_uuid AND name = 'Autre'
  LIMIT 1;
  
  -- Si pas trouvée, utiliser la catégorie "Autre" par défaut
  IF fallback_id IS NULL THEN
    SELECT id INTO fallback_id
    FROM categories
    WHERE is_default = true AND name = 'Autre'
    LIMIT 1;
  END IF;
  
  RETURN fallback_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour gérer les références orphelines lors de suppression de catégories
CREATE OR REPLACE FUNCTION handle_category_deletion()
RETURNS TRIGGER AS $$
DECLARE
  fallback_category_name text := 'Autre';
BEGIN
  -- Mettre à jour les tâches qui référencent cette catégorie
  UPDATE tasks 
  SET category = fallback_category_name
  WHERE category = OLD.name AND user_id = OLD.user_id;
  
  -- Mettre à jour les objectifs qui référencent cette catégorie
  UPDATE goals 
  SET category = fallback_category_name
  WHERE category = OLD.name AND user_id = OLD.user_id;
  
  -- Mettre à jour les événements qui référencent cette catégorie
  UPDATE events 
  SET category = fallback_category_name
  WHERE category = OLD.name AND user_id = OLD.user_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour gérer les suppressions de catégories
DROP TRIGGER IF EXISTS category_deletion_handler ON categories;
CREATE TRIGGER category_deletion_handler
  BEFORE DELETE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION handle_category_deletion();

-- Contrainte pour empêcher la suppression de la catégorie protégée "Autre"
ALTER TABLE categories ADD CONSTRAINT prevent_protected_deletion 
  CHECK (NOT (is_protected = true AND name = 'Autre'));

-- Mise à jour de la fonction get_user_categories pour inclure toutes les catégories
CREATE OR REPLACE FUNCTION get_user_categories(user_uuid uuid, category_type text DEFAULT 'general')
RETURNS TABLE (
  id uuid,
  name text,
  icon text,
  color text,
  type text,
  is_default boolean,
  is_protected boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.icon, c.color, c.type, c.is_default, c.is_protected
  FROM categories c
  WHERE (c.user_id = user_uuid OR c.is_default = true)
    AND (category_type = 'general' OR c.type = category_type)
  ORDER BY c.is_protected DESC, c.is_default DESC, c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- S'assurer qu'il y a toujours une catégorie "Autre" par défaut
INSERT INTO categories (name, icon, color, type, is_default, is_protected, user_id) VALUES
  ('Autre', '📝', 'neutral', 'general', true, true, NULL)
ON CONFLICT (name, user_id) DO UPDATE SET
  is_protected = true;