import { useEffect, useRef } from "react";
import Ritual from "../../types/index.ts";
import { Check, Trash2, Zap } from "lucide-react";
import gsap from "gsap";

const RitualItem = ({
  ritual,
  isDone,
  onToggle,
  onDelete,
}: {
  ritual: Ritual;
  isDone: boolean;
  onToggle: (r: Ritual) => void;
  onDelete: (id: string) => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isDone && cardRef.current && buttonRef.current) {
      // Flash Effect on Card
      gsap.fromTo(
        cardRef.current,
        { boxShadow: "0 0 0px rgba(34, 197, 94, 0)", borderColor: "#27272a" },
        {
          boxShadow: "0 0 30px rgba(34, 197, 94, 0.2)",
          borderColor: "rgba(34, 197, 94, 0.5)",
          duration: 0.4,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
        }
      );

      // Pop effect on Button
      gsap.fromTo(
        buttonRef.current,
        { scale: 1 },
        {
          scale: 1.4,
          duration: 0.3,
          ease: "back.out(1.7)",
          yoyo: true,
          repeat: 1,
        }
      );
    }
  }, [isDone]);

  return (
    <div
      ref={cardRef}
      className={`group relative bg-zinc-950 border ${
        isDone ? "border-ritual-accent/30" : "border-zinc-800"
      } p-5 rounded-xl transition-all duration-300 hover:border-zinc-600 flex justify-between items-center overflow-hidden`}
    >
      {isDone && (
        <div className="absolute inset-0 bg-ritual-accent/5 pointer-events-none transition-opacity duration-500"></div>
      )}

      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <h4
            className={`font-bold text-lg transition-all duration-300 ${
              isDone
                ? "text-ritual-accent line-through opacity-70"
                : "text-zinc-200"
            }`}
          >
            {ritual.title}
          </h4>
          {ritual.streak > 1 && (
            <div className="flex items-center gap-1 text-xs text-yellow-500 font-mono bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
              <Zap size={10} fill="currentColor" /> {ritual.streak} Day Streak
            </div>
          )}
        </div>
        <p className="text-zinc-500 text-sm">{ritual.description}</p>
        <div className="flex gap-2 mt-2">
          <span
            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${
              ritual.difficulty === "master"
                ? "border-red-900 text-red-500"
                : ritual.difficulty === "adept"
                ? "border-yellow-900 text-yellow-500"
                : "border-green-900 text-green-500"
            }`}
          >
            {ritual.difficulty}
          </span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-zinc-800 text-zinc-400">
            +{ritual.essenceReward} Essence
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 relative z-10">
        <button
          ref={buttonRef}
          onClick={() => onToggle(ritual)}
          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
            isDone
              ? "bg-ritual-accent text-black border-ritual-accent shadow-[0_0_15px_rgba(34,197,94,0.5)]"
              : "bg-transparent border-zinc-700 text-zinc-700 hover:border-ritual-accent hover:text-ritual-accent"
          }`}
        >
          <Check size={24} />
        </button>
        <button
          onClick={() => onDelete(ritual.id)}
          className="text-zinc-700 hover:text-red-500 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default RitualItem;
