import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
  is_default: boolean;
  is_protected: boolean;
  user_id: string | null;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Create category
  const createCategory = async (name: string, icon: string = '🎯', color: string = 'primary') => {
    try {
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase
        .from('categories')
        .insert([{ 
          name: name.trim(), 
          icon, 
          color, 
          type: 'general',
          is_default: false,
          is_protected: false,
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error creating category:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la catégorie';
      setError(errorMessage);
      throw err;
    }
  };

  // Update category
  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      setError(null);
      
      // Vérifier si la catégorie peut être modifiée
      const category = categories.find(c => c.id === id);
      if (category?.name === 'Autre' && category?.is_protected) {
        throw new Error('La catégorie "Autre" ne peut pas être modifiée car elle sert de fallback.');
      }

      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prev => prev.map(cat => cat.id === id ? data : cat));
      return data;
    } catch (err) {
      console.error('Error updating category:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la catégorie';
      setError(errorMessage);
      throw err;
    }
  };

  // Delete category
  const deleteCategory = async (id: string) => {
    try {
      setError(null);
      
      // Vérifier si la catégorie peut être supprimée
      const category = categories.find(c => c.id === id);
      if (category?.name === 'Autre' && category?.is_protected) {
        throw new Error('La catégorie "Autre" ne peut pas être supprimée car elle sert de fallback.');
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (err) {
      console.error('Error deleting category:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la catégorie';
      setError(errorMessage);
      throw err;
    }
  };

  // Check if category can be deleted
  const canDeleteCategory = (category: Category): boolean => {
    return !(category.name === 'Autre' && category.is_protected);
  };

  // Check if category can be modified
  const canModifyCategory = (category: Category): boolean => {
    return !(category.name === 'Autre' && category.is_protected);
  };

  useEffect(() => {
    fetchCategories();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('categories_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    canDeleteCategory,
    canModifyCategory,
    refetch: fetchCategories
  };
}