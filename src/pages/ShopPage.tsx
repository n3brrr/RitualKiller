import { useState } from "react";
import { User, ShopItem } from "../types";
import { Zap, Check, X } from "lucide-react";
import { gsap } from "gsap";
import { MOCK_SHOP_ITEMS } from "../mocks";

const ShopPage = ({ user, setUser }: { user: User; setUser: Function }) => {
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

  const buyItem = (item: ShopItem) => {
    if (user.essence >= item.cost) {
      // Animation for specific item card background in grid to show purchase
      gsap.to(`#shop-item-${item.id}`, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          gsap.fromTo(
            `#shop-item-${item.id}`,
            { borderColor: "#27272a" },
            {
              borderColor: "#22c55e",
              duration: 0.5,
              onComplete: () => {
                gsap.to(`#shop-item-${item.id}`, {
                  borderColor: "#27272a",
                  duration: 0.5,
                });
              },
            }
          );

          setUser({
            ...user,
            essence: user.essence - item.cost,
            inventory: [...user.inventory, item.id],
          });
          setSelectedItem(null); // Close modal
        },
      });
    } else {
      // Shake animation for error on the Modal content if open, or Card if closed
      const target = selectedItem ? "#modal-content" : `#shop-item-${item.id}`;
      gsap.to(target, {
        x: 10,
        duration: 0.1,
        yoyo: true,
        repeat: 3,
        borderColor: "#ef4444",
        onComplete: () => {
          gsap.to(target, {
            borderColor: selectedItem ? "#27272a" : "#27272a",
            duration: 0.5,
          });
        },
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-display font-bold">Black Market</h2>
        <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 text-ritual-accent font-mono font-bold">
          {user.essence} Essence
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_SHOP_ITEMS.map((item) => {
          const owned = user.inventory.includes(item.id);
          return (
            <div
              key={item.id}
              id={`shop-item-${item.id}`}
              onClick={() => !owned && setSelectedItem(item)}
              className={`bg-zinc-950 border p-6 rounded-xl flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 ${
                owned
                  ? "border-zinc-800 opacity-50 cursor-default"
                  : "border-zinc-800 hover:border-ritual-accent hover:shadow-[0_0_20px_rgba(34,197,94,0.1)] cursor-pointer"
              }`}
            >
              {owned && (
                <div className="absolute top-2 right-2 text-zinc-500">
                  <Check size={16} />
                </div>
              )}

              <div className="text-4xl mb-4 grayscale group-hover:grayscale-0">
                {item.icon}
              </div>
              <h3 className="font-bold text-lg text-white mb-2">{item.name}</h3>
              <p className="text-zinc-500 text-sm mb-6 h-10 line-clamp-2">
                {item.description}
              </p>

              <div
                className={`w-full py-2 rounded font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 ${
                  owned
                    ? "bg-zinc-900 text-zinc-600"
                    : "bg-zinc-100/10 text-zinc-300"
                }`}
              >
                {owned ? (
                  "Acquired"
                ) : (
                  <>
                    {item.cost}{" "}
                    <span className="text-xs opacity-70">Essence</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Shop Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          ></div>
          <div
            id="modal-content"
            className="relative bg-zinc-950 border border-zinc-800 p-8 rounded-2xl max-w-md w-full shadow-2xl animate-fade-in-up"
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X size={24} />
            </button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="text-6xl mb-6 p-6 bg-zinc-900/50 rounded-full border border-zinc-800">
                {selectedItem.icon}
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-2">
                {selectedItem.name}
              </h3>
              <div
                className={`text-xs uppercase tracking-widest px-3 py-1 rounded-full border mb-4 ${
                  selectedItem.rarity === "legendary"
                    ? "border-yellow-500/30 text-yellow-500 bg-yellow-500/10"
                    : selectedItem.rarity === "rare"
                    ? "border-purple-500/30 text-purple-500 bg-purple-500/10"
                    : "border-zinc-500/30 text-zinc-500 bg-zinc-500/10"
                }`}
              >
                {selectedItem.rarity}
              </div>
              <p className="text-zinc-400 leading-relaxed">
                {selectedItem.description}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => buyItem(selectedItem)}
                className="flex-1 bg-ritual-accent text-black font-bold py-3 rounded-lg hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
              >
                Purchase for {selectedItem.cost} <Zap size={16} fill="black" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
