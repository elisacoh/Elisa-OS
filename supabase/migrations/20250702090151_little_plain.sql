/*
  # Système de catégories centralisé avec gestion complète

  1. Modifications de la table categories
    - Ajout de la colonne is_protected
    - Mise à jour des politiques RLS
    - Protection de la catégorie "Autre"

  2. Fonctions de gestion
    - Fonction de fallback pour catégorie par défaut
    - Fonction de gestion des suppressions avec fallback automatique
    - Trigger pour gérer les références orphelines

  3. Sécurité
    - Empêcher la suppression de la catégorie protégée
    - Fallback automatique vers "Autre" lors des suppressions
*/

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;
DROP POLICY IF EXISTS "Users can view their categories and default ones" ON categories;

-- Ajouter une colonne pour identifier la catégorie protégée
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_protected boolean DEFAULT false;

-- S'assurer qu'il y a une catégorie "Autre" par défaut avant de la marquer comme protégée
INSERT INTO categories (name, icon, color, type, is_default, user_id) VALUES
  ('Autre', '📝', 'neutral', 'general', true, NULL)
ON CONFLICT (name, user_id) DO NOTHING;

-- Marquer "Autre" comme catégorie protégée
UPDATE categories SET is_protected = true WHERE name = 'Autre' AND is_default = true;

-- Nouvelles politiques RLS plus permissives
CREATE POLICY "Users can view all categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can manage non-protected categories"
  ON categories
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (auth.uid() = user_id AND (is_protected = false OR is_protected IS NULL))
  WITH CHECK (auth.uid() = user_id AND (is_protected = false OR is_protected IS NULL));

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
  -- Empêcher la suppression de la catégorie protégée "Autre"
  IF OLD.is_protected = true AND OLD.name = 'Autre' THEN
    RAISE EXCEPTION 'Cannot delete protected category "Autre"';
  END IF;
  
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

-- Fonction pour empêcher la modification de la catégorie protégée
CREATE OR REPLACE FUNCTION prevent_protected_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Empêcher la modification du nom ou du statut protégé de la catégorie "Autre" par défaut
  IF OLD.is_protected = true AND OLD.name = 'Autre' AND OLD.is_default = true THEN
    IF NEW.name != OLD.name OR NEW.is_protected != OLD.is_protected THEN
      RAISE EXCEPTION 'Cannot modify protected category "Autre"';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour empêcher la modification de la catégorie protégée
DROP TRIGGER IF EXISTS prevent_protected_modification_trigger ON categories;
CREATE TRIGGER prevent_protected_modification_trigger
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION prevent_protected_modification();

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

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_categories_protected ON categories(is_protected) WHERE is_protected = true;
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_categories_default ON categories(is_default) WHERE is_default = true;