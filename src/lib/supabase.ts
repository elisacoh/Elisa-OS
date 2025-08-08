import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Add better error handling and debugging
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  
  // Provide a more helpful error message
  throw new Error(
    'Missing Supabase environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file. ' +
    'You can find these values in your Supabase project dashboard under Settings > API.'
  );
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}. Please check your VITE_SUPABASE_URL environment variable.`);
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string;
          context: string;
          priority: string;
          status: string;
          date_planned: string | null;
          time_planned: string | null;
          duration_estimate: number | null;
          energy_level: string | null;
          was_planned_for: string | null;
          last_planned_for: string | null;
          reschedule_count: number;
          is_auto_rescheduled: boolean;
          goal_linked: string | null;
          is_recurring: boolean;
          recurrence_rule: string | null;
          recurrence_days: string[] | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category?: string;
          context?: string;
          priority?: string;
          status?: string;
          date_planned?: string | null;
          time_planned?: string | null;
          duration_estimate?: number | null;
          energy_level?: string | null;
          was_planned_for?: string | null;
          last_planned_for?: string | null;
          reschedule_count?: number;
          is_auto_rescheduled?: boolean;
          goal_linked?: string | null;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          recurrence_days?: string[] | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          context?: string;
          priority?: string;
          status?: string;
          date_planned?: string | null;
          time_planned?: string | null;
          duration_estimate?: number | null;
          energy_level?: string | null;
          was_planned_for?: string | null;
          last_planned_for?: string | null;
          reschedule_count?: number;
          is_auto_rescheduled?: boolean;
          goal_linked?: string | null;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          recurrence_days?: string[] | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string;
          context: string;
          timeline: string;
          status: string;
          deadline: string | null;
          progress: number;
          linked_to: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category?: string;
          context?: string;
          timeline?: string;
          status?: string;
          deadline?: string | null;
          progress?: number;
          linked_to?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          context?: string;
          timeline?: string;
          status?: string;
          deadline?: string | null;
          progress?: number;
          linked_to?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      goal_categories: {
        Row: {
          id: string;
          name: string;
          icon: string;
          color: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string;
          color?: string;
          user_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string;
          color?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          date: string;
          mood_morning: string | null;
          mood_morning_level: number | null;
          mood_evening: string | null;
          mood_evening_level: number | null;
          segments: any[];
          goals_today: string[] | null;
          goals_status: string | null;
          task_completion_ratio: number | null;
          efficiency_rating: number | null;
          day_rating: number | null;
          day_tag: string | null;
          proud_of: string[] | null;
          want_to_improve: string[] | null;
          insight: string | null;
          is_at_peace: boolean | null;
          keywords: string[] | null;
          tasks_linked: string[] | null;
          goals_linked: string[] | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          mood_morning?: string | null;
          mood_morning_level?: number | null;
          mood_evening?: string | null;
          mood_evening_level?: number | null;
          segments?: any[];
          goals_today?: string[] | null;
          goals_status?: string | null;
          task_completion_ratio?: number | null;
          efficiency_rating?: number | null;
          day_rating?: number | null;
          day_tag?: string | null;
          proud_of?: string[] | null;
          want_to_improve?: string[] | null;
          insight?: string | null;
          is_at_peace?: boolean | null;
          keywords?: string[] | null;
          tasks_linked?: string[] | null;
          goals_linked?: string[] | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          mood_morning?: string | null;
          mood_morning_level?: number | null;
          mood_evening?: string | null;
          mood_evening_level?: number | null;
          segments?: any[];
          goals_today?: string[] | null;
          goals_status?: string | null;
          task_completion_ratio?: number | null;
          efficiency_rating?: number | null;
          day_rating?: number | null;
          day_tag?: string | null;
          proud_of?: string[] | null;
          want_to_improve?: string[] | null;
          insight?: string | null;
          is_at_peace?: boolean | null;
          keywords?: string[] | null;
          tasks_linked?: string[] | null;
          goals_linked?: string[] | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          start_date_time: string;
          end_date_time: string | null;
          duration: number | null;
          category: string;
          context: string;
          goal_linked: string | null;
          is_recurring: boolean;
          recurrence_rule: string | null;
          location: string | null;
          link: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          start_date_time: string;
          end_date_time?: string | null;
          duration?: number | null;
          category?: string;
          context?: string;
          goal_linked?: string | null;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          location?: string | null;
          link?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          start_date_time?: string;
          end_date_time?: string | null;
          duration?: number | null;
          category?: string;
          context?: string;
          goal_linked?: string | null;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          location?: string | null;
          link?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};