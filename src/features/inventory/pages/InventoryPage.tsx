import React from "react";
import { useAuthStore } from "@/features/auth/stores/useAuthStore";
import { Package, Zap } from "lucide-react";
import { SHOP_ITEMS } from "@/data/items";

const InventoryPage = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  if (!user) return null;

  const handleUseItem = (itemId: string) => {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return;

    // Logic to "use" the item
    let newBuffs = user.active_buffs || [];

    if (item.effectType === "essence_boost") {
      // Add or extend buff
      // Check if already active
      const existingBuffIndex = newBuffs.findIndex((b) => b.itemId === itemId);
      const now = Date.now();
      const duration = item.duration || 24 * 60 * 60 * 1000;

      if (existingBuffIndex >= 0) {
        // Extend
        newBuffs[existingBuffIndex].expiresAt += duration;
      } else {
        // Add new
        newBuffs.push({
          itemId: item.id,
          expiresAt: now + duration,
          multiplier: item.effectValue,
        });
      }
    } else if (item.effectType === "restore_streak") {
      // Logic for restoring streak would go here (complex, needs interaction with habits store)
      alert(
        "La Poción de Olvido ha sido consumida. (Lógica de restauración pendiente de integración)",
      );
    }

    // Remove 1 instance of item from inventory
    const newInventory = [...user.inventory];
    const itemIndex = newInventory.indexOf(itemId);
    if (itemIndex > -1) {
      newInventory.splice(itemIndex, 1);
    }

    setUser({
      ...user,
      inventory: newInventory,
      active_buffs: newBuffs,
    });
  };

  // Group items by ID to show counts
  const inventoryCounts = user.inventory.reduce(
    (acc, itemId) => {
      acc[itemId] = (acc[itemId] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex justify-between items-end border-b border-zinc-900 pb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-1">
            Inventario
          </h2>
          <p className="text-zinc-500">Tus posesiones y artefactos oscuros.</p>
        </div>
        <div className="text-zinc-400 text-sm">
          {user.inventory.length} Ítems
        </div>
      </header>

      {/* Active Buffs Display */}
      {user.active_buffs && user.active_buffs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm uppercase tracking-wider text-zinc-500 font-bold mb-3">
            Efectos Activos
          </h3>
          <div className="flex gap-4 flex-wrap">
            {user.active_buffs.map((buff, idx) => {
              if (buff.expiresAt < Date.now()) return null; // Don't show expired
              const item = SHOP_ITEMS.find((i) => i.id === buff.itemId);
              return (
                <div
                  key={idx}
                  className="bg-ritual-accent/10 border border-ritual-accent/30 px-4 py-2 rounded-lg flex items-center gap-3 text-ritual-accent"
                >
                  <Zap size={16} />
                  <div>
                    <div className="font-bold text-sm">
                      {item?.name || buff.itemId}
                    </div>
                    <div className="text-xs opacity-70">
                      Expira: {new Date(buff.expiresAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {user.inventory.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 text-zinc-500">
          <Package size={48} className="mb-4 opacity-50" />
          <p>Tu inventario está vacío.</p>
          <p className="text-sm mt-2">
            Visita el Mercado Negro para adquirir artefactos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(inventoryCounts).map(([itemId, count]) => {
            const itemDef = SHOP_ITEMS.find((i) => i.id === itemId);
            if (!itemDef) return null; // Unknown item

            return (
              <div
                key={itemId}
                className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center gap-4 transition-colors hover:border-zinc-700"
              >
                <div className="w-16 h-16 bg-zinc-900/50 rounded-lg flex items-center justify-center border border-zinc-800 text-3xl">
                  {itemDef.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white">{itemDef.name}</h4>
                    <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded-full">
                      x{count}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                    {itemDef.description}
                  </p>

                  {itemDef.duration !== -1 && (
                    <button
                      onClick={() => handleUseItem(itemId)}
                      className="mt-3 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors w-full"
                    >
                      Usar Objeto
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
