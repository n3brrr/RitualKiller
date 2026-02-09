import { supabase } from '@/lib/supabase';
import { Ritual, RitualLog } from '@/types';

export const ritualService = {
  async getRituals(userId: string) {
    try {
      const { data, error } = await supabase
        .from('rituals')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return (data as Ritual[]) || [];
    } catch (error) {
      console.error('Error fetching rituals:', error);
      // Fallback to empty array for mock users or if table doesn't exist yet
      return [];
    }
  },

  async createRitual(ritual: Omit<Ritual, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('rituals')
      .insert([ritual])
      .select()
      .single();
    
    if (error) throw error;
    return data as Ritual;
  },

  async updateRitual(id: string, updates: Partial<Ritual>) {
    const { data, error } = await supabase
      .from('rituals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Ritual;
  },

  async deleteRitual(id: string) {
    const { error } = await supabase
      .from('rituals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async logRitual(log: Omit<RitualLog, 'id'>) {
    const { data, error } = await supabase
      .from('ritual_logs')
      .insert([log])
      .select()
      .single();
    
    if (error) throw error;
    return data as RitualLog;
  },

  async getLogs(userId: string) {
    try {
      const { data, error } = await supabase
        .from('ritual_logs')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return (data as RitualLog[]) || [];
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  }
};
