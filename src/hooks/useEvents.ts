import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import type { Database } from '../lib/supabase';

type Event = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];
type EventUpdate = Database['public']['Tables']['events']['Update'];

export function useEvents() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events
  const fetchEvents = async () => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Create event
  const createEvent = async (eventData: EventInsert) => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{ ...eventData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setEvents(prev => [...prev, data].sort((a, b) => 
        new Date(a.start_date_time).getTime() - new Date(b.start_date_time).getTime()
      ));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
      throw err;
    }
  };

  // Update event
  const updateEvent = async (id: string, updates: EventUpdate) => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setEvents(prev => prev.map(event => event.id === id ? data : event));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      throw err;
    }
  };

  // Delete event
  const deleteEvent = async (id: string) => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      throw err;
    }
  };

  // Get events for a specific date
  const getEventsForDate = (date: string) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date_time).toISOString().split('T')[0];
      return eventDate === date;
    });
  };

  // Get events for a date range
  const getEventsForRange = (startDate: string, endDate: string) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date_time).toISOString().split('T')[0];
      return eventDate >= startDate && eventDate <= endDate;
    });
  };

  useEffect(() => {
    if (!authLoading) {
      fetchEvents();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    // Subscribe to real-time changes only when user is authenticated
    const subscription = supabase
      .channel('events_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'events',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    events,
    loading: loading || authLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getEventsForRange,
    refetch: fetchEvents
  };
}