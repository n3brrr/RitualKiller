import React, { useState, lazy, Suspense } from "react";
import { Frequency, Ritual, RitualLog } from "@/types";
import { Plus, PenTool, Sparkles, BookOpen, Check } from "lucide-react";
import { generateRitualSuggestions } from "@/utils/aiRitualGenerator";
import RitualItem from "@/components/rituals/RitualCard";
import Loading from "@/components/animations/Loading";
import { ritualService } from "@/services/api/ritualService";
import { useAuthStore } from "@/features/auth/stores/useAuthStore";
import { useRitualStore } from "@/features/rituals/stores/useRitualStore";
import { useLoaderData } from "react-router-dom";

// Loader para React Router v7
export const habitsLoader = async () => {
  const user = useAuthStore.getState().user;
  if (!user) return [];
  return ritualService.getRituals(user.id);
};

// Carga diferenciada (lazy loading) de la biblioteca de rituales para optimizar rendimiento
const RitualLibrary = lazy(() => import("@/components/rituals/RitualLibrary"));

const HabitsPage = () => {
  // Datos cargados por el loader
  const loadedRituals = useLoaderData() as Ritual[];

  // Obtiene el estado global de los stores
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { rituals, setRituals, logs, setLogs } = useRitualStore();

  if (!user) return null;

  // Si hay datos cargados y el store está vacío, sincronizar
  React.useEffect(() => {
    if (loadedRituals?.length > 0 && rituals.length === 0) {
      setRituals(loadedRituals);
    }
  }, [loadedRituals, rituals.length, setRituals]);

  // Create a local non-nullable reference for TS narrowing
  const currentUser = user;

  // Controladores y estados locales del componente
  const [isGenerating, setIsGenerating] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [showCreator, setShowCreator] = useState(false);
  const [createMode, setCreateMode] = useState<"ai" | "manual" | "library">(
    "manual",
  );
  const [showLibrary, setShowLibrary] = useState(false);
  const [manualForm, setManualForm] = useState({
    title: "",
    description: "",
    difficulty: "novice" as "novice" | "adept" | "master",
    frequency: "daily" as "daily" | "weekly",
    essenceReward: 10,
  });

  // Cadena con la fecha de hoy en formato AAAA-MM-DD
  const todayStr = new Date().toISOString().split("T")[0] || "";

  // Auto-calculate essence based on difficulty and frequency
  React.useEffect(() => {
    // Only update if not manually edited? Or always? Assuming always for auto-fill helper.
    // If we want to allow manual override, we might need a flag, but for now enforcing rules is safer.
    // Or we can check if it matches previous calculation.
    // Let's just always update it when deps change.
    if (showCreator && createMode === "manual") {
      const base =
        manualForm.difficulty === "master"
          ? 50
          : manualForm.difficulty === "adept"
            ? 25
            : 10;
      const multiplier = manualForm.frequency === "weekly" ? 3 : 1;
      setManualForm((prev) => ({ ...prev, essenceReward: base * multiplier }));
    }
  }, [manualForm.difficulty, manualForm.frequency, showCreator, createMode]);

  /**
   * Marca o desmarca la finalización de un ritual para el día actual.
   * Gestiona tanto la lógica de completar, como deshacer la acción, actualizando los estados necesarios.
   */
  const toggleCompletion = (ritual: Ritual) => {
    const isCompleted = logs.some(
      (l) => l.ritualId === ritual.id && l.date === todayStr,
    );

    if (isCompleted) {
      // Lógica para deshacer la finalización
      const newLogs = logs.filter(
        (l) => !(l.ritualId === ritual.id && l.date === todayStr),
      );
      setLogs(newLogs);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const hadStreakYesterday = newLogs.some(
        (l) => l.ritualId === ritual.id && l.date === yesterdayStr,
      );
      const recoveredStreak = hadStreakYesterday
        ? Math.max(0, ritual.streak - 1)
        : 0;

      const wasBonusApplied = ritual.streak > 1;
      const bonusToRemove = wasBonusApplied ? 10 : 0;

      setUser({
        ...currentUser,
        essence: Math.max(
          0,
          currentUser.essence - ritual.essenceReward - bonusToRemove,
        ),
      });
      setRituals(
        rituals.map((r) =>
          r.id === ritual.id ? { ...r, streak: recoveredStreak } : r,
        ),
      );
    } else {
      // Lógica para marcar como completado y otorgar recompensa/esencia
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const hasYesterday = logs.some(
        (l) => l.ritualId === ritual.id && l.date === yesterdayStr,
      );

      const newStreak = hasYesterday ? ritual.streak + 1 : 1;
      const streakBonus = hasYesterday ? 10 : 0;

      const newLog: RitualLog = {
        id: Date.now().toString(),
        ritualId: ritual.id,
        user_id: currentUser.id,
        date: todayStr,
        timestamp: Date.now(),
        essence_gained: ritual.essenceReward + streakBonus,
      };
      setLogs([...logs, newLog]);

      setUser({
        ...currentUser,
        essence: currentUser.essence + ritual.essenceReward + streakBonus,
      });
      setRituals(
        rituals.map((r) =>
          r.id === ritual.id ? { ...r, streak: newStreak } : r,
        ),
      );
    }
  };

  /**
   * Crea un nuevo ritual basado en modo IA o manual.
   * - En modo IA invoca la función generadora de sugerencias.
   * - En modo manual toma los valores del formulario.
   */
  const handleCreateRitual = async (e: React.FormEvent) => {
    e.preventDefault();

    if (createMode === "ai") {
      if (!goalInput) return;
      setIsGenerating(true);
      const suggestions = await generateRitualSuggestions(goalInput);

      if (suggestions.length > 0) {
        const newRituals: Ritual[] = suggestions.map((s: any, idx: number) => ({
          id: Date.now().toString() + idx,
          user_id: currentUser.id,
          title: s.title,
          description: s.description,
          difficulty: s.difficulty,
          frequency: "daily" as Frequency,
          essenceReward:
            s.difficulty === "master" ? 50 : s.difficulty === "adept" ? 25 : 10,
          streak: 0,
          created_at: new Date().toISOString(),
        }));
        setRituals([...rituals, ...newRituals]);
        setGoalInput("");
        setShowCreator(false);
      }
      setIsGenerating(false);
    } else {
      // Modo manual
      if (!manualForm.title) return;
      const newRitual: Ritual = {
        id: Date.now().toString(),
        user_id: currentUser.id,
        title: manualForm.title,
        description: manualForm.description,
        difficulty: manualForm.difficulty,
        frequency: manualForm.frequency,
        essenceReward: Number(manualForm.essenceReward), //Cambiar esto por esencia determinada dependiendo de la dificultad y frecuencia
        streak: 0,
        created_at: new Date().toISOString(),
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

  // Elimina un ritual por su ID
  const deleteRitual = (id: string) => {
    setRituals(rituals.filter((r) => r.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-display font-bold">Grimoire</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowLibrary(!showLibrary);
              setShowCreator(false);
            }}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors border border-zinc-700"
          >
            <BookOpen size={16} />
            Biblioteca
          </button>
          <button
            onClick={() => {
              setShowCreator(!showCreator);
              setShowLibrary(false);
            }}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors border border-zinc-700"
          >
            {showCreator ? "Cerrar" : "Nuevo Ritual"} <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Mostrar biblioteca de rituales si está activa */}
      {showLibrary && (
        <div className="mb-8">
          <Suspense fallback={<Loading />}>
            <RitualLibrary
              onImport={(ritual) => {
                setRituals([...rituals, ritual]);
                setShowLibrary(false);
              }}
            />
          </Suspense>
        </div>
      )}

      {/* Formulario para crear ritual nuevo (manual o IA) */}
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
              <PenTool size={14} /> Entrada Manual
            </button>
            <button
              onClick={() => setCreateMode("ai")}
              className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider pb-1 ${
                createMode === "ai"
                  ? "text-ritual-accent border-b-2 border-ritual-accent"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Sparkles size={14} /> Invocador IA
            </button>
          </div>

          <form onSubmit={handleCreateRitual} className="space-y-4">
            {createMode === "ai" ? (
              <>
                <p className="text-zinc-400 text-sm mb-2">
                  Expresa tu deseo (ej: "Ser físicamente imparable" o "Aprender
                  a programar"). El sistema prescribirá tu sufrimiento.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    placeholder="¿Qué buscas?"
                    className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-ritual-accent outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="bg-ritual-accent text-black font-bold px-6 py-3 rounded-lg hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                  >
                    {isGenerating ? "Invocando..." : "Invocar"}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">
                    Título del Ritual
                  </label>
                  <input
                    type="text"
                    value={manualForm.title}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, title: e.target.value })
                    }
                    placeholder="ej: Carrera Matutina"
                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-ritual-accent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">
                    Descripción
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
                    placeholder="Condiciones específicas para completar..."
                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-ritual-accent outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">
                      Dificultad
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
                      <option value="novice">Novato</option>
                      <option value="adept">Intermedio</option>
                      <option value="master">Maestro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">
                      Frecuencia
                    </label>
                    <select className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-ritual-accent outline-none appearance-none">
                      <option value="daily">Diario</option>
                      <option value="weekly">Semanal</option>
                    </select>
                  </div>
                  {/* Essence input removed or read-only if auto-calculated? keeping it editable but auto-updates */}
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">
                      Recompensa de Esencia
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
                {/* Auto-calculate essence effect */}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-white text-black font-bold px-6 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
                  >
                    Crear Ritual
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Renderiza los rituales creados por el usuario, o muestra mensaje si no existen */}
      {/* Ritual Lists */}
      <div className="space-y-8">
        {/* Pending Rituals */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-ritual-accent" />
            Pendientes
          </h3>
          <div className="space-y-3">
            {rituals.filter(
              (r) =>
                !logs.some((l) => l.ritualId === r.id && l.date === todayStr),
            ).length === 0 && (
              <div className="text-zinc-600 italic p-4 border border-dashed border-zinc-800 rounded-lg">
                No hay sacrificios pendientes.
              </div>
            )}
            {rituals
              .filter(
                (r) =>
                  !logs.some((l) => l.ritualId === r.id && l.date === todayStr),
              )
              .map((ritual) => (
                <RitualItem
                  key={ritual.id}
                  ritual={ritual}
                  isDone={false}
                  onToggle={toggleCompletion}
                  onDelete={deleteRitual}
                />
              ))}
          </div>
        </div>

        {/* Completed Rituals */}
        {rituals.some((r) =>
          logs.some((l) => l.ritualId === r.id && l.date === todayStr),
        ) && (
          <div className="opacity-60 grayscale-[50%] hover:grayscale-0 transition-all duration-500">
            <h3 className="text-xl font-bold text-zinc-400 mb-4 flex items-center gap-2">
              <Check size={20} />
              Completados
            </h3>
            <div className="space-y-3">
              {rituals
                .filter((r) =>
                  logs.some((l) => l.ritualId === r.id && l.date === todayStr),
                )
                .map((ritual) => (
                  <RitualItem
                    key={ritual.id}
                    ritual={ritual}
                    isDone={true}
                    onToggle={toggleCompletion}
                    onDelete={deleteRitual}
                    disabled={true} // Add this prop to RitualItem
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitsPage;
