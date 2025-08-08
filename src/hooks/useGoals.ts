import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import type { Database } from '../lib/supabase';

type Goal = Database['public']['Tables']['goals']['Row'];
type GoalInsert = Database['public']['Tables']['goals']['Insert'];
type GoalUpdate = Database['public']['Tables']['goals']['Update'];
type GoalCategory = Database['public']['Tables']['goal_categories']['Row'];

export function useGoals() {
  const { user, loading: authLoading } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<GoalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch goals
  const fetchGoals = async () => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    if (authLoading || !user) return;

    try {
      const { data, error } = await supabase
        .from('goal_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des catégories:', err);
    }
  };

  // Create goal
  const createGoal = async (goalData: GoalInsert) => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert([{ ...goalData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setGoals(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
      throw err;
    }
  };

  // Update goal
  const updateGoal = async (id: string, updates: GoalUpdate) => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setGoals(prev => prev.map(goal => goal.id === id ? data : goal));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      throw err;
    }
  };

  // Delete goal
  const deleteGoal = async (id: string) => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setGoals(prev => prev.filter(goal => goal.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      throw err;
    }
  };

  // Create category
  const createCategory = async (name: string, icon: string = '🎯', color: string = 'primary') => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      const { data, error } = await supabase
        .from('goal_categories')
        .insert([{ name, icon, color, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prev => [...prev, data]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la catégorie');
      throw err;
    }
  };

  // Delete category
  const deleteCategory = async (id: string) => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      const { error } = await supabase
        .from('goal_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression de la catégorie');
      throw err;
    }
  };

  // Get tasks linked to a goal
  const getLinkedTasks = async (goalId: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('goal_linked', goalId)
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erreur lors du chargement des tâches liées:', err);
      return [];
    }
  };

  // Calculate goal progress based on linked tasks
  const calculateGoalProgress = async (goalId: string) => {
    try {
      const tasks = await getLinkedTasks(goalId);
      if (tasks.length === 0) return 0;

      const completedTasks = tasks.filter(task => task.status === 'done').length;
      return completedTasks / tasks.length;
    } catch (err) {
      console.error('Erreur lors du calcul de progression:', err);
      return 0;
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchGoals();
      fetchCategories();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) {
      setGoals([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    // Subscribe to real-time changes only when user is authenticated
    const goalsSubscription = supabase
      .channel('goals_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'goals',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchGoals();
        }
      )
      .subscribe();

    const categoriesSubscription = supabase
      .channel('goal_categories_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'goal_categories',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      goalsSubscription.unsubscribe();
      categoriesSubscription.unsubscribe();
    };
  }, [user]);

  return {
    goals,
    categories,
    loading: loading || authLoading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    createCategory,
    deleteCategory,
    getLinkedTasks,
    calculateGoalProgress,
    refetch: fetchGoals
  };
}