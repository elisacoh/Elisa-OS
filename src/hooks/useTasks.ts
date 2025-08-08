import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import type { Database } from '../lib/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export function useTasks() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks
  const fetchTasks = async () => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Create task
  const createTask = async (taskData: TaskInsert) => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...taskData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
      throw err;
    }
  };

  // Update task
  const updateTask = async (id: string, updates: TaskUpdate) => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => prev.map(task => task.id === id ? data : task));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      throw err;
    }
  };

  // Delete task
  const deleteTask = async (id: string) => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      throw err;
    }
  };

  // Fonction améliorée pour vérifier si une tâche récurrente doit apparaître pour une date donnée
  const shouldShowRecurringTaskToday = (task: any, targetDate?: string) => {
    if (!task.is_recurring || !task.recurrence_rule) return false;
    
    const checkDate = targetDate ? new Date(targetDate) : new Date();
    const todayDayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    switch (task.recurrence_rule) {
      case 'daily':
        return true;
        
      case 'weekly':
        // Si la tâche a une date planifiée, vérifier si c'est le même jour de la semaine
        if (task.date_planned) {
          const taskDay = new Date(task.date_planned).getDay();
          const targetDay = checkDate.getDay();
          return taskDay === targetDay;
        }
        // Si pas de date planifiée, utiliser la date de création comme référence
        if (task.created_at) {
          const createdDay = new Date(task.created_at).getDay();
          const targetDay = checkDate.getDay();
          return createdDay === targetDay;
        }
        return false;
        
      case 'monthly':
        // Si la tâche a une date planifiée, vérifier si c'est le même jour du mois
        if (task.date_planned) {
          const taskDate = new Date(task.date_planned).getDate();
          const targetDateNum = checkDate.getDate();
          return taskDate === targetDateNum;
        }
        // Si pas de date planifiée, utiliser la date de création comme référence
        if (task.created_at) {
          const createdDate = new Date(task.created_at).getDate();
          const targetDateNum = checkDate.getDate();
          return createdDate === targetDateNum;
        }
        return false;
        
      case 'yearly':
        // Si la tâche a une date planifiée, vérifier si c'est le même jour et mois
        if (task.date_planned) {
          const taskDate = new Date(task.date_planned);
          return taskDate.getDate() === checkDate.getDate() && 
                 taskDate.getMonth() === checkDate.getMonth();
        }
        // Si pas de date planifiée, utiliser la date de création comme référence
        if (task.created_at) {
          const createdDate = new Date(task.created_at);
          return createdDate.getDate() === checkDate.getDate() && 
                 createdDate.getMonth() === checkDate.getMonth();
        }
        return false;
        
      case 'custom':
        // Vérifier si le jour actuel est dans les jours sélectionnés
        return task.recurrence_days && task.recurrence_days.includes(todayDayName);
        
      default:
        return false;
    }
  };

  // Fonction pour obtenir toutes les tâches pour une date donnée (incluant récurrentes)
  const getTasksForDate = (targetDate: string) => {
    // Tâches régulières planifiées pour cette date
    const regularTasks = tasks.filter(task => task.date_planned === targetDate);
    
    // Tâches récurrentes qui doivent apparaître ce jour
    const recurringTasks = tasks.filter(task => 
      task.is_recurring && 
      shouldShowRecurringTaskToday(task, targetDate) &&
      !regularTasks.some(rt => rt.id === task.id) // Éviter les doublons
    );

    return {
      regular: regularTasks,
      recurring: recurringTasks,
      all: [...regularTasks, ...recurringTasks]
    };
  };

  // Toggle task status - Gestion spéciale pour les tâches récurrentes
  const toggleTaskStatus = async (id: string, isRecurringInstance = false, targetDate?: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Pour les tâches récurrentes affichées dans une vue de date spécifique
    if (isRecurringInstance && task.is_recurring) {
      const dateToUse = targetDate || new Date().toISOString().split('T')[0];
      
      // Vérifier si une instance existe déjà pour cette date
      const instancePattern = `[RECURRING_INSTANCE:${task.id}:${dateToUse}]`;
      const existingInstance = tasks.find(t => 
        t.title.includes(instancePattern)
      );

      if (existingInstance) {
        // Si l'instance existe, la supprimer (toggle off)
        await deleteTask(existingInstance.id);
        return;
      }

      try {
        // Créer une instance spécifique pour cette date avec un identifiant unique
        const instanceData = {
          title: `${task.title} [RECURRING_INSTANCE:${task.id}:${dateToUse}]`,
          description: task.description,
          category: task.category,
          context: task.context,
          priority: task.priority,
          status: 'done' as const,
          date_planned: dateToUse,
          time_planned: task.time_planned,
          duration_estimate: task.duration_estimate,
          energy_level: task.energy_level,
          goal_linked: task.goal_linked,
          is_recurring: false, // L'instance n'est pas récurrente
          recurrence_rule: null,
          recurrence_days: null,
          was_planned_for: dateToUse,
          reschedule_count: 0,
          is_auto_rescheduled: false
        };

        await createTask(instanceData);
        return;
      } catch (err) {
        console.error('Erreur lors de la création de l\'instance récurrente:', err);
        return;
      }
    }

    // Pour les tâches normales ou les tâches récurrentes dans leur vue originale
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await updateTask(id, { status: newStatus });
  };

  // Vérifier si une instance récurrente a été complétée pour une date donnée
  const isRecurringInstanceCompletedToday = (recurringTaskId: string, targetDate?: string) => {
    const checkDate = targetDate || new Date().toISOString().split('T')[0];
    const instancePattern = `[RECURRING_INSTANCE:${recurringTaskId}:${checkDate}]`;
    
    return tasks.some(task => 
      task.title.includes(instancePattern) && 
      task.status === 'done' &&
      task.date_planned === checkDate &&
      !task.is_recurring
    );
  };

  useEffect(() => {
    if (!authLoading) {
      fetchTasks();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    // Subscribe to real-time changes only when user is authenticated
    const subscription = supabase
      .channel('tasks_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    tasks,
    loading: loading || authLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    shouldShowRecurringTaskToday,
    isRecurringInstanceCompletedToday,
    getTasksForDate,
    refetch: fetchTasks
  };
}