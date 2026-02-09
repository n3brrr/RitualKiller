import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Ritual, RitualLog } from '../../../types';

interface RitualState {
  rituals: Ritual[];
  logs: RitualLog[];
  setRituals: (rituals: Ritual[] | ((prev: Ritual[]) => Ritual[])) => void;
  setLogs: (logs: RitualLog[] | ((prev: RitualLog[]) => RitualLog[])) => void;
  resetRituals: () => void;
}

export const useRitualStore = create<RitualState>()(
  persist(
    (set) => ({
      rituals: [],
      logs: [],
      setRituals: (rituals) => 
        set((state) => ({ 
          rituals: typeof rituals === 'function' ? rituals(state.rituals) : rituals 
        })),
      setLogs: (logs) => 
        set((state) => ({ 
          logs: typeof logs === 'function' ? logs(state.logs) : logs 
        })),
      resetRituals: () => set({ rituals: [], logs: [] }),
    }),
    {
      name: 'rk_rituals_storage',
    }
  )
);
