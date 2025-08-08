/*
  # Fix category operations - deletion and modification

  1. Corrections
    - Fix RLS policies to properly handle protected categories
    - Ensure triggers work correctly for category deletion
    - Add proper constraints and validations

  2. Security
    - Prevent deletion of protected categories at database level
    - Prevent modification of protected category names
    - Ensure fallback mechanism works properly
*/

-- Supprimer les anciennes politiques pour les recréer proprement
DROP POLICY IF EXISTS "Users can view all categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update non-protected categories" ON categories;
DROP POLICY IF EXISTS "Users can delete non-protected categories" ON categories;

-- Nouvelles politiques RLS plus robustes

-- SELECT: Utilisateurs voient leurs catégories + les catégories par défaut
CREATE POLICY "Users can view all categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_default = true);

-- INSERT: Utilisateurs peuvent créer leurs propres catégories (non protégées)
CREATE POLICY "Users can insert their own categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND is_default = false 
    AND (is_protected = false OR is_protected IS NULL)
  );

-- UPDATE: Utilisateurs peuvent modifier leurs catégories non protégées
CREATE POLICY "Users can update non-protected categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND (is_protected = false OR is_protected IS NULL)
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND (is_protected = false OR is_protected IS NULL)
  );

-- DELETE: Utilisateurs peuvent supprimer leurs catégories non protégées
CREATE POLICY "Users can delete non-protected categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND (is_protected = false OR is_protected IS NULL)
  );

-- Améliorer la fonction de gestion des suppressions
CREATE OR REPLACE FUNCTION handle_category_deletion()
RETURNS TRIGGER AS $$
DECLARE
  fallback_category_name text := 'Autre';
  affected_tasks_count integer;
  affected_goals_count integer;
  affected_events_count integer;
BEGIN
  -- Empêcher absolument la suppression de la catégorie protégée "Autre"
  IF OLD.is_protected = true THEN
    RAISE EXCEPTION 'Cannot delete protected category "%". This category serves as a fallback for other items.', OLD.name;
  END IF;
  
  -- Compter les éléments affectés pour information
  SELECT COUNT(*) INTO affected_tasks_count
  FROM tasks 
  WHERE category = OLD.name AND user_id = OLD.user_id;
  
  SELECT COUNT(*) INTO affected_goals_count
  FROM goals 
  WHERE category = OLD.name AND user_id = OLD.user_id;
  
  SELECT COUNT(*) INTO affected_events_count
  FROM events 
  WHERE category = OLD.name AND user_id = OLD.user_id;
  
  -- Log pour debug (optionnel)
  RAISE NOTICE 'Deleting category "%" will affect % tasks, % goals, % events', 
    OLD.name, affected_tasks_count, affected_goals_count, affected_events_count;
  
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

-- Améliorer la fonction de protection contre les modifications
CREATE OR REPLACE FUNCTION prevent_protected_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Empêcher toute modification des catégories protégées
  IF OLD.is_protected = true THEN
    -- Permettre seulement les modifications qui ne changent pas les champs critiques
    IF NEW.name != OLD.name OR 
       NEW.is_protected != OLD.is_protected OR 
       NEW.is_default != OLD.is_default THEN
      RAISE EXCEPTION 'Cannot modify protected category "%". Protected categories cannot be renamed or have their protection status changed.', OLD.name;
    END IF;
  END IF;
  
  -- Empêcher de rendre une catégorie protégée si elle ne l'était pas
  IF OLD.is_protected = false AND NEW.is_protected = true THEN
    RAISE EXCEPTION 'Cannot make category "%" protected. Only system categories can be protected.', OLD.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ajouter une contrainte pour s'assurer qu'il y a toujours une catégorie "Autre" protégée
CREATE OR REPLACE FUNCTION ensure_fallback_category_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier qu'il reste au moins une catégorie "Autre" protégée après suppression
  IF OLD.name = 'Autre' AND OLD.is_protected = true THEN
    IF NOT EXISTS (
      SELECT 1 FROM categories 
      WHERE name = 'Autre' 
      AND is_protected = true 
      AND id != OLD.id
    ) THEN
      RAISE EXCEPTION 'Cannot delete the last protected "Autre" category. At least one must exist as fallback.';
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour s'assurer qu'il y a toujours une catégorie fallback
DROP TRIGGER IF EXISTS ensure_fallback_category_trigger ON categories;
CREATE TRIGGER ensure_fallback_category_trigger
  BEFORE DELETE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION ensure_fallback_category_exists();

-- Fonction pour vérifier si une catégorie peut être supprimée (pour l'UI)
CREATE OR REPLACE FUNCTION can_delete_category(category_id uuid, user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  category_record categories%ROWTYPE;
BEGIN
  -- Récupérer la catégorie
  SELECT * INTO category_record
  FROM categories
  WHERE id = category_id AND (user_id = user_uuid OR is_default = true);
  
  -- Si la catégorie n'existe pas ou n'appartient pas à l'utilisateur
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Si la catégorie est protégée, elle ne peut pas être supprimée
  IF category_record.is_protected = true THEN
    RETURN false;
  END IF;
  
  -- Si c'est une catégorie par défaut, elle ne peut pas être supprimée par un utilisateur
  IF category_record.is_default = true AND category_record.user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si une catégorie peut être modifiée (pour l'UI)
CREATE OR REPLACE FUNCTION can_modify_category(category_id uuid, user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  category_record categories%ROWTYPE;
BEGIN
  -- Récupérer la catégorie
  SELECT * INTO category_record
  FROM categories
  WHERE id = category_id AND (user_id = user_uuid OR is_default = true);
  
  -- Si la catégorie n'existe pas ou n'appartient pas à l'utilisateur
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Si la catégorie est protégée, elle ne peut pas être modifiée
  IF category_record.is_protected = true THEN
    RETURN false;
  END IF;
  
  -- Si c'est une catégorie par défaut, elle ne peut pas être modifiée par un utilisateur
  IF category_record.is_default = true AND category_record.user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- S'assurer qu'il y a bien une catégorie "Autre" protégée
DO $$
BEGIN
  -- Vérifier s'il existe déjà une catégorie "Autre" protégée
  IF NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE name = 'Autre' AND is_protected = true AND is_default = true
  ) THEN
    -- Créer ou mettre à jour la catégorie "Autre" pour qu'elle soit protégée
    INSERT INTO categories (name, icon, color, type, is_default, is_protected, user_id) 
    VALUES ('Autre', '📝', 'neutral', 'general', true, true, NULL)
    ON CONFLICT (name, user_id) 
    DO UPDATE SET 
      is_protected = true,
      is_default = true;
  END IF;
END $$;