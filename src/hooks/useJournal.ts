import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';

export interface JournalSegment {
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  note: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  mood_morning?: string;
  mood_morning_level?: number;
  mood_evening?: string;
  mood_evening_level?: number;
  segments: JournalSegment[];
  goals_today?: string[];
  goals_status?: 'achieved' | 'partial' | 'failed';
  task_completion_ratio?: number;
  efficiency_rating?: number;
  day_rating?: number;
  day_tag?: 'productive' | 'off' | 'chaotique' | 'fluide' | 'révélateur' | 'épuisante' | 'inspirante';
  proud_of?: string[];
  want_to_improve?: string[];
  insight?: string;
  is_at_peace?: boolean;
  keywords?: string[];
  tasks_linked?: string[];
  goals_linked?: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useJournal() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all entries
  const fetchEntries = async () => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching journal entries:', error);
        throw error;
      }
      setEntries(data || []);
    } catch (err) {
      console.error('Failed to fetch journal entries:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors du chargement des entrées';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get or create entry for a specific date
  const getOrCreateEntry = async (date: string): Promise<JournalEntry> => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      setError(null);

      // Try to get existing entry filtering by both date and user_id
      const { data: existing, error: fetchError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('date', date)
        .eq('user_id', user.id)
        .limit(1);

      if (fetchError) {
        console.error('Error fetching existing entry:', fetchError);
        throw fetchError;
      }

      // If entry exists, return it
      if (existing && existing.length > 0) {
        return existing[0];
      }

      // Create new entry if doesn't exist
      const { data: newEntry, error: createError } = await supabase
        .from('journal_entries')
        .insert([{
          date,
          segments: [],
          user_id: user.id
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating new entry:', createError);
        throw createError;
      }
      
      setEntries(prev => [newEntry, ...prev.filter(e => e.date !== date)]);
      return newEntry;
    } catch (err) {
      console.error('Error in getOrCreateEntry:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de l\'entrée';
      setError(errorMessage);
      throw err;
    }
  };

  // Update entry
  const updateEntry = async (date: string, updates: Partial<JournalEntry>) => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('journal_entries')
        .update(updates)
        .eq('date', date)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating entry:', error);
        throw error;
      }
      
      setEntries(prev => prev.map(entry => 
        entry.date === date ? data : entry
      ));
      
      if (currentEntry?.date === date) {
        setCurrentEntry(data);
      }
      
      return data;
    } catch (err) {
      console.error('Error in updateEntry:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(errorMessage);
      throw err;
    }
  };

  // Add segment to entry
  const addSegment = async (date: string, segment: Omit<JournalSegment, 'createdAt'>) => {
    try {
      const entry = await getOrCreateEntry(date);
      const newSegment: JournalSegment = {
        ...segment,
        createdAt: new Date().toISOString()
      };
      
      const updatedSegments = [...(entry.segments || []), newSegment];
      return await updateEntry(date, { segments: updatedSegments });
    } catch (err) {
      throw err;
    }
  };

  // Update mood
  const updateMood = async (date: string, timeOfDay: 'morning' | 'evening', mood: string, level: number) => {
    try {
      const updates = timeOfDay === 'morning' 
        ? { mood_morning: mood, mood_morning_level: level }
        : { mood_evening: mood, mood_evening_level: level };
      
      return await updateEntry(date, updates);
    } catch (err) {
      throw err;
    }
  };

  // Set current entry for a date
  const setCurrentEntryForDate = async (date: string) => {
    try {
      setError(null);
      const entry = await getOrCreateEntry(date);
      setCurrentEntry(entry);
      return entry;
    } catch (err) {
      console.error('Error in setCurrentEntryForDate:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de l\'entrée';
      setError(errorMessage);
      throw err;
    }
  };

  // Search entries
  const searchEntries = (filters: {
    minRating?: string;
    maxRating?: string;
    mood?: string;
    dayTag?: string;
    keyword?: string;
    hasProudMoments?: boolean;
    hasImprovements?: boolean;
  }) => {
    return entries.filter(entry => {
      if (filters.minRating && (!entry.day_rating || entry.day_rating < parseInt(filters.minRating))) return false;
      if (filters.maxRating && (!entry.day_rating || entry.day_rating > parseInt(filters.maxRating))) return false;
      if (filters.mood && entry.mood_morning !== filters.mood && entry.mood_evening !== filters.mood) return false;
      if (filters.dayTag && entry.day_tag !== filters.dayTag) return false;
      if (filters.keyword) {
        const searchText = [
          ...entry.segments.map(s => s.note),
          entry.insight || '',
          ...(entry.proud_of || []),
          ...(entry.want_to_improve || []),
          ...(entry.keywords || [])
        ].join(' ').toLowerCase();
        
        if (!searchText.includes(filters.keyword.toLowerCase())) return false;
      }
      if (filters.hasProudMoments && (!entry.proud_of || entry.proud_of.length === 0)) return false;
      if (filters.hasImprovements && (!entry.want_to_improve || entry.want_to_improve.length === 0)) return false;
      
      return true;
    });
  };

  useEffect(() => {
    if (!authLoading) {
      fetchEntries();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setCurrentEntry(null);
      setLoading(false);
      return;
    }

    // Subscribe to real-time changes only when user is authenticated
    const subscription = supabase
      .channel('journal_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'journal_entries',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchEntries();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    entries,
    currentEntry,
    loading: loading || authLoading,
    error,
    getOrCreateEntry,
    updateEntry,
    addSegment,
    updateMood,
    setCurrentEntryForDate,
    searchEntries,
    refetch: fetchEntries
  };
}