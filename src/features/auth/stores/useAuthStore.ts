import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, ShopItem } from '../../../types';
import { SHOP_ITEMS } from '@/data/items';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  buyItem: (item: ShopItem) => boolean;
  useItem: (itemId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
      buyItem: (item) => {
        const { user } = get();
        if (!user) return false;
        
        if (user.essence >= item.cost) {
            const newInventory = [...user.inventory, item.id];
            set({
                user: {
                    ...user,
                    essence: user.essence - item.cost,
                    inventory: newInventory
                }
            });
            return true;
        }
        return false;
      },
      useItem: (itemId) => {
        const { user } = get();
        if (!user) return;

        const item = SHOP_ITEMS.find((i) => i.id === itemId);
        if (!item) return;

        let newBuffs = user.active_buffs ? [...user.active_buffs] : [];
        
        // Handle effects
        if (item.effectType === "essence_boost") {
            const existingBuffIndex = newBuffs.findIndex((b) => b.itemId === itemId);
            const now = Date.now();
            const duration = item.duration || 24 * 60 * 60 * 1000;

            if (existingBuffIndex >= 0) {
                 // Extend existing
                 const currentBuff = newBuffs[existingBuffIndex];
                 if (currentBuff) { // Type guard
                     const updatedBuff = { 
                         ...currentBuff, 
                         expiresAt: currentBuff.expiresAt + duration
                     };
                     newBuffs[existingBuffIndex] = updatedBuff;
                 }
            } else {
                // Add new
                newBuffs.push({
                    itemId: item.id,
                    expiresAt: now + duration,
                    multiplier: item.effectValue ?? 1 // Default to 1 if undefined
                });
            }
        } else if (item.effectType === "restore_streak") {
             // Logic placeholder
             alert("La Poción de Olvido ha sido consumida. (Lógica de restauración pendiente)");
        }
        
        // Remove one instance of item
        const newInventory = [...user.inventory];
        const itemIndex = newInventory.indexOf(itemId);
        if (itemIndex > -1) {
            newInventory.splice(itemIndex, 1);
        }

        set({
            user: {
                ...user,
                inventory: newInventory,
                active_buffs: newBuffs
            }
        });
      },
    }),
    {
      name: 'rk_auth_storage',
      // We only want to persist the user, not the loading state
      partialize: (state) => ({ user: state.user }),
    }
  )
);
