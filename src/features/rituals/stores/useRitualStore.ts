import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Ritual, RitualLog } from '../../../types';

interface RitualState {
  rituals: Ritual[];
  logs: RitualLog[];
  setRituals: (rituals: Ritual[] | ((prev: Ritual[]) => Ritual[])) => void;
  setLogs: (logs: RitualLog[] | ((prev: RitualLog[]) => RitualLog[])) => void;
  addRitual: (ritual: Ritual) => void;
  removeRitual: (id: string) => void;
  toggleRitual: (ritualId: string, dateStr: string) => { essenceChange: number, success: boolean };
}

export const useRitualStore = create<RitualState>()(
  persist(
    (set, get) => ({
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
      
      addRitual: (ritual) => set((state) => ({ rituals: [...state.rituals, ritual] })),
      
      removeRitual: (id) => set((state) => ({ rituals: state.rituals.filter(r => r.id !== id) })),
      
      toggleRitual: (ritualId, dateStr) => {
          const state = get();
          const ritual = state.rituals.find(r => r.id === ritualId);
          if (!ritual) return { essenceChange: 0, success: false };

          const isCompleted = state.logs.some(
            (l) => l.ritualId === ritualId && l.date === dateStr
          );

          if (isCompleted) {
              // Undo completion
              const newLogs = state.logs.filter(
                (l) => !(l.ritualId === ritualId && l.date === dateStr)
              );
              
              // Recalculate streak
              // Logic from component: check yesterday
              const yesterday = new Date(dateStr);
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split("T")[0];
              
              const hadStreakYesterday = newLogs.some(
                (l) => l.ritualId === ritualId && l.date === yesterdayStr
              );
              
              const recoveredStreak = hadStreakYesterday ? Math.max(0, ritual.streak - 1) : 0;
              
              const wasBonusApplied = ritual.streak > 1; // Assuming streak > 1 implies we had a bonus? 
              // Wait, the component logic was: "wasBonusApplied = ritual.streak > 1". 
              // If current streak is 2, it means yesterday we had 1. 2 > 1 so yes bonus.
              // If current streak is 1, it means yesterday we had 0 or didn't do it. 1 > 1 is false.
              // The component logic seems to assume that if we are treating it as "undo", we reverse what was done.
              
              // Let's stick to the component's logic for consistency, but refined.
              const streakBonus = (ritual.streak > 1) ? 10 : 0; // If current streak is > 1 involved a bonus?
              // Actually, simpler: calculate what WAS gained and subtract it.
              // But we don't store exactly what was gained in the log easily accessible without searching.
              // We do have essence_gained in RitualLog!
              
              const logToRemove = state.logs.find(l => l.ritualId === ritualId && l.date === dateStr);
              const essenceToDeduct = logToRemove?.essence_gained || ritual.essenceReward; // Fallback

              set({
                  logs: newLogs,
                  rituals: state.rituals.map(r => r.id === ritualId ? { ...r, streak: recoveredStreak } : r)
              });

              return { essenceChange: -essenceToDeduct, success: true };

          } else {
              // Complete ritual
              const yesterday = new Date(dateStr);
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split("T")[0];
              
              const hasYesterday = state.logs.some(
                (l) => l.ritualId === ritualId && l.date === yesterdayStr
              );

              const newStreak = hasYesterday ? ritual.streak + 1 : 1;
              const streakBonus = hasYesterday ? 10 : 0;
              const totalEssence = ritual.essenceReward + streakBonus;

              const newLog: RitualLog = {
                id: Date.now().toString(),
                ritualId: ritual.id,
                user_id: ritual.user_id,
                date: dateStr,
                timestamp: Date.now(),
                essence_gained: totalEssence,
              };

              set({
                  logs: [...state.logs, newLog],
                  rituals: state.rituals.map(r => r.id === ritualId ? { ...r, streak: newStreak } : r)
              });

              return { essenceChange: totalEssence, success: true };
          }
      }
    }),
    {
      name: 'rk_rituals_storage',
    }
  )
);
