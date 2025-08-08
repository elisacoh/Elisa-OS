/*
  # Fix categories system and remove duplicates

  1. Cleanup
    - Remove duplicate "Autre" categories safely
    - Ensure only one protected "Autre" category exists
    - Update all references to use the correct category

  2. Security
    - Enhanced RLS policies
    - Protection functions for categories
    - Triggers to prevent unauthorized modifications

  3. Functions
    - Permission checking functions
    - Updated get_user_categories function
*/

-- Désactiver temporairement les triggers pour permettre le nettoyage
DROP TRIGGER IF EXISTS category_deletion_handler ON categories;
DROP TRIGGER IF EXISTS prevent_protected_modification_trigger ON categories;

-- Nettoyer les doublons de catégories "Autre"
DO $$
DECLARE
  protected_autre_id uuid;
  duplicate_record RECORD;
  autre_count integer;
BEGIN
  -- Compter combien de catégories "Autre" existent
  SELECT COUNT(*) INTO autre_count
  FROM categories 
  WHERE name = 'Autre';
  
  RAISE NOTICE 'Found % "Autre" categories', autre_count;
  
  -- Trouver ou créer la catégorie "Autre" protégée
  SELECT id INTO protected_autre_id
  FROM categories 
  WHERE name = 'Autre' 
    AND COALESCE(is_protected, false) = true 
    AND COALESCE(is_default, false) = true 
    AND user_id IS NULL
  LIMIT 1;
  
  -- Si elle n'existe pas, en créer une ou convertir la première trouvée
  IF protected_autre_id IS NULL THEN
    -- Essayer de convertir une catégorie "Autre" existante
    SELECT id INTO protected_autre_id
    FROM categories 
    WHERE name = 'Autre'
    LIMIT 1;
    
    IF protected_autre_id IS NOT NULL THEN
      -- Convertir cette catégorie en version protégée
      UPDATE categories 
      SET is_protected = true, 
          is_default = true, 
          user_id = NULL,
          icon = '📝',
          color = 'neutral',
          type = 'general'
      WHERE id = protected_autre_id;
      
      RAISE NOTICE 'Converted existing "Autre" category to protected version: %', protected_autre_id;
    ELSE
      -- Créer une nouvelle catégorie "Autre" protégée
      INSERT INTO categories (name, icon, color, type, is_default, is_protected, user_id)
      VALUES ('Autre', '📝', 'neutral', 'general', true, true, NULL)
      RETURNING id INTO protected_autre_id;
      
      RAISE NOTICE 'Created new protected "Autre" category: %', protected_autre_id;
    END IF;
  ELSE
    RAISE NOTICE 'Found existing protected "Autre" category: %', protected_autre_id;
  END IF;
  
  -- Supprimer tous les autres "Autre" (sans déclencher les triggers)
  FOR duplicate_record IN 
    SELECT id, user_id FROM categories 
    WHERE name = 'Autre' AND id != protected_autre_id
  LOOP
    RAISE NOTICE 'Removing duplicate "Autre" category: %', duplicate_record.id;
    
    -- Mettre à jour les références avant suppression
    UPDATE tasks 
    SET category = 'Autre'
    WHERE category = 'Autre' AND user_id = duplicate_record.user_id;
    
    UPDATE goals 
    SET category = 'Autre'
    WHERE category = 'Autre' AND user_id = duplicate_record.user_id;
    
    UPDATE events 
    SET category = 'Autre'
    WHERE category = 'Autre' AND user_id = duplicate_record.user_id;
    
    -- Supprimer le doublon directement
    DELETE FROM categories WHERE id = duplicate_record.id;
  END LOOP;
  
  -- Vérifier le résultat
  SELECT COUNT(*) INTO autre_count
  FROM categories 
  WHERE name = 'Autre';
  
  RAISE NOTICE 'After cleanup: % "Autre" categories remaining', autre_count;
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
    AND COALESCE(is_default, false) = false 
    AND COALESCE(is_protected, false) = false
  );

CREATE POLICY "Users can update non-protected categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND COALESCE(is_protected, false) = false
    AND NOT (COALESCE(is_default, false) = true AND user_id IS NULL)
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND COALESCE(is_protected, false) = false
    AND NOT (COALESCE(is_default, false) = true AND user_id IS NULL)
  );

CREATE POLICY "Users can delete non-protected categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND COALESCE(is_protected, false) = false
    AND NOT (COALESCE(is_default, false) = true AND user_id IS NULL)
  );

-- Fonction pour s'assurer qu'une catégorie de fallback existe
CREATE OR REPLACE FUNCTION ensure_fallback_category_exists()
RETURNS TRIGGER AS $$
DECLARE
  fallback_exists boolean;
BEGIN
  -- Vérifier qu'il reste au moins une catégorie "Autre" protégée
  SELECT EXISTS(
    SELECT 1 FROM categories 
    WHERE name = 'Autre' 
      AND COALESCE(is_protected, false) = true 
      AND COALESCE(is_default, false) = true
  ) INTO fallback_exists;
  
  IF NOT fallback_exists THEN
    RAISE EXCEPTION 'Cannot delete the last fallback category. At least one "Autre" category must exist.';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Fonction améliorée pour gérer les suppressions
CREATE OR REPLACE FUNCTION handle_category_deletion()
RETURNS TRIGGER AS $$
DECLARE
  fallback_category_name text := 'Autre';
BEGIN
  -- Vérifications de sécurité
  IF COALESCE(OLD.is_protected, false) = true THEN
    RAISE EXCEPTION 'Cannot delete protected category "%". This category serves as a fallback.', OLD.name;
  END IF;
  
  IF COALESCE(OLD.is_default, false) = true AND OLD.user_id IS NULL THEN
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
  IF COALESCE(OLD.is_protected, false) = true THEN
    IF NEW.name != OLD.name OR 
       COALESCE(NEW.is_protected, false) != COALESCE(OLD.is_protected, false) OR 
       COALESCE(NEW.is_default, false) != COALESCE(OLD.is_default, false) THEN
      RAISE EXCEPTION 'Cannot modify protected category "%".', OLD.name;
    END IF;
  END IF;
  
  -- Empêcher la modification des catégories système
  IF COALESCE(OLD.is_default, false) = true AND OLD.user_id IS NULL THEN
    IF NEW.name != OLD.name OR COALESCE(NEW.is_default, false) != COALESCE(OLD.is_default, false) THEN
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
  IF COALESCE(category_record.is_protected, false) = true THEN
    RETURN false;
  END IF;
  
  IF COALESCE(category_record.is_default, false) = true AND category_record.user_id IS NULL THEN
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
  IF COALESCE(category_record.is_protected, false) = true THEN
    RETURN false;
  END IF;
  
  IF COALESCE(category_record.is_default, false) = true AND category_record.user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour la fonction get_user_categories
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
  SELECT c.id, c.name, c.icon, c.color, c.type, 
         COALESCE(c.is_default, false) as is_default,
         COALESCE(c.is_protected, false) as is_protected, 
         c.user_id
  FROM categories c
  WHERE (c.user_id = user_uuid OR COALESCE(c.is_default, false) = true)
    AND (category_type = 'general' OR c.type = category_type)
  ORDER BY 
    CASE WHEN COALESCE(c.is_protected, false) = true THEN 0 ELSE 1 END,
    CASE WHEN COALESCE(c.is_default, false) = true THEN 0 ELSE 1 END,
    c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Réactiver les triggers de protection
CREATE TRIGGER ensure_fallback_category_trigger
  BEFORE DELETE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION ensure_fallback_category_exists();

CREATE TRIGGER category_deletion_handler
  BEFORE DELETE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION handle_category_deletion();

CREATE TRIGGER prevent_protected_modification_trigger
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION prevent_protected_modification();

-- S'assurer que tous les éléments ont des catégories valides
UPDATE tasks SET category = 'Autre' 
WHERE category NOT IN (
  SELECT name FROM categories 
  WHERE COALESCE(is_default, false) = true OR user_id = tasks.user_id
);

UPDATE goals SET category = 'Autre' 
WHERE category NOT IN (
  SELECT name FROM categories 
  WHERE COALESCE(is_default, false) = true OR user_id = goals.user_id
);

UPDATE events SET category = 'Autre' 
WHERE category NOT IN (
  SELECT name FROM categories 
  WHERE COALESCE(is_default, false) = true OR user_id = events.user_id
);

-- Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_categories_user_protected ON categories(user_id, is_protected);
CREATE INDEX IF NOT EXISTS idx_categories_name_user ON categories(name, user_id);
CREATE INDEX IF NOT EXISTS idx_categories_protected_default ON categories(is_protected, is_default) WHERE COALESCE(is_protected, false) = true;