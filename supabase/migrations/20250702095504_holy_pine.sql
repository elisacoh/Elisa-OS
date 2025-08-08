/*
  # Fix categories system - Clean duplicates and fix permissions

  1. Clean up
    - Remove duplicate "Autre" categories
    - Ensure only one protected "Autre" category exists
    - Clean up orphaned data

  2. Fix permissions
    - Update RLS policies to be more restrictive
    - Ensure proper protection of system categories
    - Fix triggers and functions

  3. Data integrity
    - Ensure all items reference valid categories
    - Set up proper fallback mechanism
*/

-- Nettoyer les doublons de catégories "Autre"
DO $$
DECLARE
  protected_autre_id uuid;
  duplicate_record RECORD;
BEGIN
  -- Trouver la catégorie "Autre" protégée (celle qu'on veut garder)
  SELECT id INTO protected_autre_id
  FROM categories 
  WHERE name = 'Autre' 
    AND is_protected = true 
    AND is_default = true 
    AND user_id IS NULL
  LIMIT 1;
  
  -- Si elle n'existe pas, créer la catégorie "Autre" protégée
  IF protected_autre_id IS NULL THEN
    INSERT INTO categories (name, icon, color, type, is_default, is_protected, user_id)
    VALUES ('Autre', '📝', 'neutral', 'general', true, true, NULL)
    RETURNING id INTO protected_autre_id;
  END IF;
  
  -- Supprimer tous les autres "Autre" en redirigeant les références
  FOR duplicate_record IN 
    SELECT id FROM categories 
    WHERE name = 'Autre' AND id != protected_autre_id
  LOOP
    -- Mettre à jour les tâches qui référencent le doublon
    UPDATE tasks 
    SET category = 'Autre'
    WHERE category = 'Autre';
    
    -- Mettre à jour les objectifs qui référencent le doublon
    UPDATE goals 
    SET category = 'Autre'
    WHERE category = 'Autre';
    
    -- Mettre à jour les événements qui référencent le doublon
    UPDATE events 
    SET category = 'Autre'
    WHERE category = 'Autre';
    
    -- Supprimer le doublon
    DELETE FROM categories WHERE id = duplicate_record.id;
  END LOOP;
END $$;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view all categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update non-protected categories" ON categories;
DROP POLICY IF EXISTS "Users can delete non-protected categories" ON categories;

-- Nouvelles politiques RLS plus strictes
CREATE POLICY "Users can view all categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can insert their own categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND is_default = false 
    AND (is_protected = false OR is_protected IS NULL)
  );

CREATE POLICY "Users can update non-protected categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND (is_protected = false OR is_protected IS NULL)
    AND (is_default = false OR user_id IS NOT NULL)
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND (is_protected = false OR is_protected IS NULL)
    AND (is_default = false OR user_id IS NOT NULL)
  );

CREATE POLICY "Users can delete non-protected categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND (is_protected = false OR is_protected IS NULL)
    AND (is_default = false OR user_id IS NOT NULL)
  );

-- Fonction améliorée pour gérer les suppressions
CREATE OR REPLACE FUNCTION handle_category_deletion()
RETURNS TRIGGER AS $$
DECLARE
  fallback_category_name text := 'Autre';
BEGIN
  -- Vérifications de sécurité
  IF OLD.is_protected = true THEN
    RAISE EXCEPTION 'Cannot delete protected category "%". This category serves as a fallback.', OLD.name;
  END IF;
  
  IF OLD.is_default = true AND OLD.user_id IS NULL THEN
    RAISE EXCEPTION 'Cannot delete system default category "%".', OLD.name;
  END IF;
  
  -- Rediriger toutes les références vers "Autre"
  UPDATE tasks 
  SET category = fallback_category_name
  WHERE category = OLD.name AND user_id = OLD.user_id;
  
  UPDATE goals 
  SET category = fallback_category_name
  WHERE category = OLD.name AND user_id = OLD.user_id;
  
  UPDATE events 
  SET category = fallback_category_name
  WHERE category = OLD.name AND user_id = OLD.user_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour empêcher la modification des catégories protégées
CREATE OR REPLACE FUNCTION prevent_protected_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Empêcher toute modification des catégories protégées
  IF OLD.is_protected = true THEN
    IF NEW.name != OLD.name OR 
       NEW.is_protected != OLD.is_protected OR 
       NEW.is_default != OLD.is_default THEN
      RAISE EXCEPTION 'Cannot modify protected category "%".', OLD.name;
    END IF;
  END IF;
  
  -- Empêcher la modification des catégories système
  IF OLD.is_default = true AND OLD.user_id IS NULL THEN
    IF NEW.name != OLD.name OR NEW.is_default != OLD.is_default THEN
      RAISE EXCEPTION 'Cannot modify system category "%".', OLD.name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier les permissions de suppression
CREATE OR REPLACE FUNCTION can_delete_category(category_id uuid, user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  category_record categories%ROWTYPE;
BEGIN
  SELECT * INTO category_record
  FROM categories
  WHERE id = category_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Vérifier la propriété
  IF category_record.user_id != user_uuid THEN
    RETURN false;
  END IF;
  
  -- Vérifier les protections
  IF category_record.is_protected = true THEN
    RETURN false;
  END IF;
  
  IF category_record.is_default = true AND category_record.user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier les permissions de modification
CREATE OR REPLACE FUNCTION can_modify_category(category_id uuid, user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  category_record categories%ROWTYPE;
BEGIN
  SELECT * INTO category_record
  FROM categories
  WHERE id = category_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Vérifier la propriété
  IF category_record.user_id != user_uuid THEN
    RETURN false;
  END IF;
  
  -- Vérifier les protections
  IF category_record.is_protected = true THEN
    RETURN false;
  END IF;
  
  IF category_record.is_default = true AND category_record.user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour la fonction get_user_categories pour inclure les informations de protection
DROP FUNCTION IF EXISTS get_user_categories(uuid, text);

CREATE OR REPLACE FUNCTION get_user_categories(user_uuid uuid, category_type text DEFAULT 'general')
RETURNS TABLE (
  id uuid,
  name text,
  icon text,
  color text,
  type text,
  is_default boolean,
  is_protected boolean,
  user_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.icon, c.color, c.type, c.is_default, 
         COALESCE(c.is_protected, false) as is_protected, c.user_id
  FROM categories c
  WHERE (c.user_id = user_uuid OR c.is_default = true)
    AND (category_type = 'general' OR c.type = category_type)
  ORDER BY 
    CASE WHEN c.is_protected = true THEN 0 ELSE 1 END,
    CASE WHEN c.is_default = true THEN 0 ELSE 1 END,
    c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- S'assurer que tous les éléments ont des catégories valides
UPDATE tasks SET category = 'Autre' 
WHERE category NOT IN (SELECT name FROM categories WHERE is_default = true OR user_id = tasks.user_id);

UPDATE goals SET category = 'Autre' 
WHERE category NOT IN (SELECT name FROM categories WHERE is_default = true OR user_id = goals.user_id);

UPDATE events SET category = 'Autre' 
WHERE category NOT IN (SELECT name FROM categories WHERE is_default = true OR user_id = events.user_id);

-- Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_categories_user_protected ON categories(user_id, is_protected);
CREATE INDEX IF NOT EXISTS idx_categories_name_user ON categories(name, user_id);