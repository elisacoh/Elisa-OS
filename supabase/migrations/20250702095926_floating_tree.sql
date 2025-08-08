/*
  # Correction du système de catégories - Seule "Autre" protégée

  1. Modifications
    - Retirer la protection de toutes les catégories sauf "Autre"
    - Permettre la modification/suppression des catégories prédéfinies
    - Seule "Autre" reste protégée comme fallback

  2. Sécurité
    - Maintenir les politiques RLS existantes
    - Garder la protection uniquement sur "Autre"
    - Permettre la gestion libre des autres catégories
*/

-- Retirer la protection de toutes les catégories sauf "Autre"
UPDATE categories 
SET is_protected = false 
WHERE name != 'Autre';

-- S'assurer que seule "Autre" est protégée
UPDATE categories 
SET is_protected = true 
WHERE name = 'Autre' AND is_default = true AND user_id IS NULL;

-- Modifier la fonction de gestion des suppressions pour être moins restrictive
CREATE OR REPLACE FUNCTION handle_category_deletion()
RETURNS TRIGGER AS $$
DECLARE
  fallback_category_name text := 'Autre';
BEGIN
  -- Seule la catégorie "Autre" protégée ne peut pas être supprimée
  IF OLD.name = 'Autre' AND COALESCE(OLD.is_protected, false) = true THEN
    RAISE EXCEPTION 'Cannot delete protected category "Autre". This category serves as a fallback.';
  END IF;
  
  -- Rediriger toutes les références vers "Autre"
  UPDATE tasks 
  SET category = fallback_category_name
  WHERE category = OLD.name AND (user_id = OLD.user_id OR OLD.user_id IS NULL);
  
  UPDATE goals 
  SET category = fallback_category_name
  WHERE category = OLD.name AND (user_id = OLD.user_id OR OLD.user_id IS NULL);
  
  UPDATE events 
  SET category = fallback_category_name
  WHERE category = OLD.name AND (user_id = OLD.user_id OR OLD.user_id IS NULL);
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Modifier la fonction de protection pour être moins restrictive
CREATE OR REPLACE FUNCTION prevent_protected_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Empêcher seulement la modification de la catégorie "Autre" protégée
  IF OLD.name = 'Autre' AND COALESCE(OLD.is_protected, false) = true THEN
    IF NEW.name != OLD.name OR 
       COALESCE(NEW.is_protected, false) != COALESCE(OLD.is_protected, false) THEN
      RAISE EXCEPTION 'Cannot modify protected category "Autre".';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Modifier les politiques RLS pour être moins restrictives
DROP POLICY IF EXISTS "Users can update non-protected categories" ON categories;
DROP POLICY IF EXISTS "Users can delete non-protected categories" ON categories;

-- UPDATE: Permettre la modification de toutes les catégories sauf "Autre" protégée
CREATE POLICY "Users can update non-protected categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR (
      is_default = true 
      AND user_id IS NULL 
      AND NOT (name = 'Autre' AND COALESCE(is_protected, false) = true)
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR (
      is_default = true 
      AND user_id IS NULL 
      AND NOT (name = 'Autre' AND COALESCE(is_protected, false) = true)
    )
  );

-- DELETE: Permettre la suppression de toutes les catégories sauf "Autre" protégée
CREATE POLICY "Users can delete non-protected categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR (
      is_default = true 
      AND user_id IS NULL 
      AND NOT (name = 'Autre' AND COALESCE(is_protected, false) = true)
    )
  );

-- Modifier les fonctions de vérification des permissions
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
  
  -- Seule la catégorie "Autre" protégée ne peut pas être supprimée
  IF category_record.name = 'Autre' AND COALESCE(category_record.is_protected, false) = true THEN
    RETURN false;
  END IF;
  
  -- Toutes les autres catégories peuvent être supprimées
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  
  -- Seule la catégorie "Autre" protégée ne peut pas être modifiée
  IF category_record.name = 'Autre' AND COALESCE(category_record.is_protected, false) = true THEN
    RETURN false;
  END IF;
  
  -- Toutes les autres catégories peuvent être modifiées
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modifier la fonction ensure_fallback_category_exists pour être plus permissive
CREATE OR REPLACE FUNCTION ensure_fallback_category_exists()
RETURNS TRIGGER AS $$
DECLARE
  fallback_exists boolean;
BEGIN
  -- Vérifier seulement si on supprime la catégorie "Autre" protégée
  IF OLD.name = 'Autre' AND COALESCE(OLD.is_protected, false) = true THEN
    -- Vérifier qu'il reste au moins une catégorie "Autre" protégée
    SELECT EXISTS(
      SELECT 1 FROM categories 
      WHERE name = 'Autre' 
        AND COALESCE(is_protected, false) = true 
        AND id != OLD.id
    ) INTO fallback_exists;
    
    IF NOT fallback_exists THEN
      RAISE EXCEPTION 'Cannot delete the last protected "Autre" category. At least one must exist as fallback.';
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Vérification finale : s'assurer qu'il y a bien une catégorie "Autre" protégée
DO $$
DECLARE
  autre_count integer;
BEGIN
  SELECT COUNT(*) INTO autre_count
  FROM categories 
  WHERE name = 'Autre' AND COALESCE(is_protected, false) = true;
  
  IF autre_count = 0 THEN
    -- Créer ou convertir une catégorie "Autre" en version protégée
    INSERT INTO categories (name, icon, color, type, is_default, is_protected, user_id)
    VALUES ('Autre', '📝', 'neutral', 'general', true, true, NULL)
    ON CONFLICT (name, user_id) 
    DO UPDATE SET 
      is_protected = true,
      is_default = true;
  END IF;
  
  RAISE NOTICE 'Categories system updated: only "Autre" is now protected, all others can be modified/deleted';
END $$;