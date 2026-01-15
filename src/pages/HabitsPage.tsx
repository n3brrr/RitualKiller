import React, { useState } from "react";
import { Ritual, RitualLog, User } from "../types";
import { Plus, PenTool, Sparkles } from "lucide-react";
import { generateRitualSuggestions } from "../utils/aiRitualGenerator";
import RitualItem from "../components/rituals/RitualCard"; // Correct path

const HabitsPage = ({
  rituals,
  setRituals,
  logs,
  setLogs,
  user,
  setUser,
}: {
  rituals: Ritual[];
  setRituals: Function;
  logs: RitualLog[];
  setLogs: Function;
  user: User;
  setUser: Function;
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [showCreator, setShowCreator] = useState(false);
  const [createMode, setCreateMode] = useState<"ai" | "manual">("manual");
  const [manualForm, setManualForm] = useState({
    title: "",
    description: "",
    difficulty: "novice" as "novice" | "adept" | "master",
    frequency: "daily" as "daily" | "weekly",
    essenceReward: 10,
  });

  const todayStr = new Date().toISOString().split("T")[0];

  const toggleCompletion = (ritual: Ritual) => {
    const isCompleted = logs.some(
      (l) => l.ritualId === ritual.id && l.date === todayStr
    );

    if (isCompleted) {
      // --- UNDO LOGIC ---
      const newLogs = logs.filter(
        (l) => !(l.ritualId === ritual.id && l.date === todayStr)
      );
      setLogs(newLogs);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const hadStreakYesterday = newLogs.some(
        (l) => l.ritualId === ritual.id && l.date === yesterdayStr
      );
      const recoveredStreak = hadStreakYesterday
        ? Math.max(0, ritual.streak - 1)
        : 0;

      const wasBonusApplied = ritual.streak > 1;
      const bonusToRemove = wasBonusApplied ? 10 : 0;

      setUser({
        ...user,
        essence: Math.max(
          0,
          user.essence - ritual.essenceReward - bonusToRemove
        ),
      });
      setRituals(
        rituals.map((r) =>
          r.id === ritual.id ? { ...r, streak: recoveredStreak } : r
        )
      );
    } else {
      // --- COMPLETE LOGIC ---
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const hasYesterday = logs.some(
        (l) => l.ritualId === ritual.id && l.date === yesterdayStr
      );

      const newStreak = hasYesterday ? ritual.streak + 1 : 1;
      const streakBonus = hasYesterday ? 10 : 0;

      const newLog: RitualLog = {
        id: Date.now().toString(),
        ritualId: ritual.id,
        date: todayStr,
        timestamp: Date.now(),
      };
      setLogs([...logs, newLog]);

      setUser({
        ...user,
        essence: user.essence + ritual.essenceReward + streakBonus,
      });
      setRituals(
        rituals.map((r) =>
          r.id === ritual.id ? { ...r, streak: newStreak } : r
        )
      );
    }
  };

  const handleCreateRitual = async (e: React.FormEvent) => {
    e.preventDefault();

    if (createMode === "ai") {
      if (!goalInput) return;
      setIsGenerating(true);
      const suggestions = await generateRitualSuggestions(goalInput);

      if (suggestions.length > 0) {
        const newRituals: Ritual[] = suggestions.map((s: any, idx: number) => ({
          id: Date.now().toString() + idx,
          title: s.title,
          description: s.description,
          difficulty: s.difficulty,
          frequency: "daily",
          essenceReward:
            s.difficulty === "master" ? 50 : s.difficulty === "adept" ? 25 : 10,
          streak: 0,
        }));
        setRituals([...rituals, ...newRituals]);
        setGoalInput("");
        setShowCreator(false);
      }
      setIsGenerating(false);
    } else {
      // Manual Mode
      if (!manualForm.title) return;
      const newRitual: Ritual = {
        id: Date.now().toString(),
        title: manualForm.title,
        description: manualForm.description,
        difficulty: manualForm.difficulty,
        frequency: manualForm.frequency,
        essenceReward: Number(manualForm.essenceReward),
        streak: 0,
      };
      setRituals([...rituals, newRitual]);
      setManualForm({
        title: "",
        description: "",
        difficulty: "novice",
        frequency: "daily",
        essenceReward: 10,
      });
      setShowCreator(false);
    }
  };

  const deleteRitual = (id: string) => {
    setRituals(rituals.filter((r) => r.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-display font-bold">Grimoire</h2>
        <button
          onClick={() => setShowCreator(!showCreator)}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors border border-zinc-700"
        >
          {showCreator ? "Close" : "New Ritual"} <Plus size={16} />
        </button>
      </div>

      {showCreator && (
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-xl animate-fade-in-down">
          <div className="flex gap-4 mb-6 border-b border-zinc-800 pb-4">
            <button
              onClick={() => setCreateMode("manual")}
              className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider pb-1 ${
                createMode === "manual"
                  ? "text-ritual-accent border-b-2 border-ritual-accent"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <PenTool size={14} /> Manual Entry
            </button>
            <button
              onClick={() => setCreateMode("ai")}
              className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider pb-1 ${
                createMode === "ai"
                  ? "text-ritual-accent border-b-2 border-ritual-accent"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Sparkles size={14} /> AI Summoner
            </button>
          </div>

          <form onSubmit={handleCreateRitual} className="space-y-4">
            {createMode === "ai" ? (
              <>
                <p className="text-zinc-400 text-sm mb-2">
                  State your desire (e.g., "Become physically unstoppable" or
                  "Learn to code"). The system will prescribe your suffering.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    placeholder="What do you seek?"
                    className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-ritual-accent outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="bg-ritual-accent text-black font-bold px-6 py-3 rounded-lg hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                  >
                    {isGenerating ? "Summoning..." : "Summon"}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">
                    Ritual Title
                  </label>
                  <input
                    type="text"
                    value={manualForm.title}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, title: e.target.value })
                    }
                    placeholder="e.g., Morning Run"
                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-ritual-accent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={manualForm.description}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Specific conditions for completion..."
                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-ritual-accent outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">
                      Difficulty
                    </label>
                    <select
                      value={manualForm.difficulty}
                      onChange={(e) =>
                        setManualForm({
                          ...manualForm,
                          difficulty: e.target.value as any,
                        })
                      }
                      className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-ritual-accent outline-none appearance-none"
                    >
                      <option value="novice">Novice</option>
                      <option value="adept">Adept</option>
                      <option value="master">Master</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">
                      Frequency
                    </label>
                    <select
                      value={manualForm.frequency}
                      onChange={(e) =>
                        setManualForm({
                          ...manualForm,
                          frequency: e.target.value as any,
                        })
                      }
                      className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-ritual-accent outline-none appearance-none"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">
                      Essence Reward
                    </label>
                    <input
                      type="number"
                      value={manualForm.essenceReward}
                      onChange={(e) =>
                        setManualForm({
                          ...manualForm,
                          essenceReward: Number(e.target.value),
                        })
                      }
                      className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-ritual-accent outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-white text-black font-bold px-6 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
                  >
                    Create Ritual
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      <div className="space-y-3">
        {rituals.length === 0 ? (
          <div className="text-center py-20 text-zinc-600 italic">
            No rituals established. The void awaits your command.
          </div>
        ) : (
          rituals.map((ritual) => {
            const isDone = logs.some(
              (l) => l.ritualId === ritual.id && l.date === todayStr
            );
            return (
              <RitualItem
                key={ritual.id}
                ritual={ritual}
                isDone={isDone}
                onToggle={toggleCompletion}
                onDelete={deleteRitual}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default HabitsPage;
