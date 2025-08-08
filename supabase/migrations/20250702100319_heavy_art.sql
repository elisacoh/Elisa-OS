/*
  # Correction finale du système de catégories

  1. Nettoyage complet
    - Suppression de tous les triggers, politiques et fonctions existants
    - Nettoyage des doublons de catégories "Autre"
    - Réinitialisation des protections

  2. Nouveau système simplifié
    - Seule "Autre" est protégée comme fallback
    - Toutes les autres catégories peuvent être créées/modifiées/supprimées
    - Politiques RLS simples et permissives

  3. Fonctions de protection
    - Protection absolue de "Autre"
    - Redirection automatique vers "Autre" lors des suppressions
    - Fonctions utilitaires pour l'interface
*/

-- =============================================
-- NETTOYAGE COMPLET
-- =============================================

-- Supprimer tous les triggers existants
DROP TRIGGER IF EXISTS category_deletion_handler ON categories;
DROP TRIGGER IF EXISTS prevent_protected_modification_trigger ON categories;
DROP TRIGGER IF EXISTS ensure_fallback_category_trigger ON categories;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can view all categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update non-protected categories" ON categories;
DROP POLICY IF EXISTS "Users can delete non-protected categories" ON categories;

-- Supprimer toutes les fonctions existantes (avec signature complète)
DROP FUNCTION IF EXISTS handle_category_deletion();
DROP FUNCTION IF EXISTS prevent_protected_modification();
DROP FUNCTION IF EXISTS ensure_fallback_category_exists();
DROP FUNCTION IF EXISTS can_delete_category(uuid, uuid);
DROP FUNCTION IF EXISTS can_modify_category(uuid, uuid);
DROP FUNCTION IF EXISTS get_fallback_category_id(uuid);
DROP FUNCTION IF EXISTS get_user_categories(uuid, text);

-- =============================================
-- NETTOYAGE DES DONNÉES
-- =============================================

-- Retirer la protection de toutes les catégories
UPDATE categories SET is_protected = false WHERE is_protected = true;

-- Nettoyer les doublons de "Autre" en gardant seulement la version par défaut
DO $$
DECLARE
  protected_autre_id uuid;
  duplicate_record RECORD;
BEGIN
  -- Trouver ou créer LA catégorie "Autre" protégée unique
  SELECT id INTO protected_autre_id
  FROM categories 
  WHERE name = 'Autre' 
    AND COALESCE(is_default, false) = true 
    AND user_id IS NULL
  LIMIT 1;
  
  -- Si elle n'existe pas, la créer
  IF protected_autre_id IS NULL THEN
    INSERT INTO categories (name, icon, color, type, is_default, is_protected, user_id)
    VALUES ('Autre', '📝', 'neutral', 'general', true, true, NULL)
    RETURNING id INTO protected_autre_id;
  ELSE
    -- Marquer comme protégée
    UPDATE categories 
    SET is_protected = true 
    WHERE id = protected_autre_id;
  END IF;
  
  -- Supprimer tous les autres "Autre"
  FOR duplicate_record IN 
    SELECT id FROM categories 
    WHERE name = 'Autre' AND id != protected_autre_id
  LOOP
    -- Rediriger les références avant suppression
    UPDATE tasks SET category = 'Autre' WHERE category = 'Autre';
    UPDATE goals SET category = 'Autre' WHERE category = 'Autre';
    UPDATE events SET category = 'Autre' WHERE category = 'Autre';
    
    -- Supprimer le doublon
    DELETE FROM categories WHERE id = duplicate_record.id;
  END LOOP;
END $$;

-- =============================================
-- NOUVELLES POLITIQUES RLS SIMPLES
-- =============================================

-- SELECT: Voir toutes les catégories (siennes + par défaut)
CREATE POLICY "Users can view all categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR COALESCE(is_default, false) = true);

-- INSERT: Créer ses propres catégories
CREATE POLICY "Users can insert their own categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND COALESCE(is_default, false) = false 
    AND COALESCE(is_protected, false) = false
  );

-- UPDATE: Modifier toutes les catégories SAUF "Autre" protégée
CREATE POLICY "Users can update non-protected categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = user_id OR COALESCE(is_default, false) = true)
    AND NOT (name = 'Autre' AND COALESCE(is_protected, false) = true)
  )
  WITH CHECK (
    (auth.uid() = user_id OR COALESCE(is_default, false) = true)
    AND NOT (name = 'Autre' AND COALESCE(is_protected, false) = true)
  );

-- DELETE: Supprimer toutes les catégories SAUF "Autre" protégée
CREATE POLICY "Users can delete non-protected categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (
    (auth.uid() = user_id OR COALESCE(is_default, false) = true)
    AND NOT (name = 'Autre' AND COALESCE(is_protected, false) = true)
  );

-- =============================================
-- NOUVELLES FONCTIONS SIMPLIFIÉES
-- =============================================

-- Fonction de gestion des suppressions (redirection vers "Autre")
CREATE FUNCTION handle_category_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Empêcher absolument la suppression de "Autre" protégée
  IF OLD.name = 'Autre' AND COALESCE(OLD.is_protected, false) = true THEN
    RAISE EXCEPTION 'Cannot delete protected category "Autre". This category serves as a fallback.';
  END IF;
  
  -- Rediriger toutes les références vers "Autre"
  UPDATE tasks SET category = 'Autre' WHERE category = OLD.name;
  UPDATE goals SET category = 'Autre' WHERE category = OLD.name;
  UPDATE events SET category = 'Autre' WHERE category = OLD.name;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Fonction de protection de "Autre"
CREATE FUNCTION prevent_protected_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Empêcher la modification de "Autre" protégée
  IF OLD.name = 'Autre' AND COALESCE(OLD.is_protected, false) = true THEN
    IF NEW.name != OLD.name OR 
       COALESCE(NEW.is_protected, false) != COALESCE(OLD.is_protected, false) THEN
      RAISE EXCEPTION 'Cannot modify protected category "Autre".';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier les permissions de suppression (pour l'UI)
CREATE FUNCTION can_delete_category(category_id uuid, user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  category_record categories%ROWTYPE;
BEGIN
  SELECT * INTO category_record FROM categories WHERE id = category_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Seule "Autre" protégée ne peut pas être supprimée
  IF category_record.name = 'Autre' AND COALESCE(category_record.is_protected, false) = true THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier les permissions de modification (pour l'UI)
CREATE FUNCTION can_modify_category(category_id uuid, user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  category_record categories%ROWTYPE;
BEGIN
  SELECT * INTO category_record FROM categories WHERE id = category_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Seule "Autre" protégée ne peut pas être modifiée
  IF category_record.name = 'Autre' AND COALESCE(category_record.is_protected, false) = true THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer les catégories utilisateur
CREATE FUNCTION get_user_categories(user_uuid uuid, category_type text DEFAULT 'general')
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

-- =============================================
-- CRÉATION DES TRIGGERS
-- =============================================

CREATE TRIGGER category_deletion_handler
  BEFORE DELETE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION handle_category_deletion();

CREATE TRIGGER prevent_protected_modification_trigger
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION prevent_protected_modification();

-- =============================================
-- VÉRIFICATION FINALE
-- =============================================

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
CREATE INDEX IF NOT EXISTS idx_categories_protected_default ON categories(is_protected, is_default) 
WHERE COALESCE(is_protected, false) = true;