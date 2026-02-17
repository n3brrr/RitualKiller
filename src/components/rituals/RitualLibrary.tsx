/*
 * RitualLibrary.tsx
 *
 * Este componente muestra la biblioteca de rituales prediseñados.
 * Permite a los usuarios buscar, filtrar e importar rituales de una colección estática,
 * mostrando información relevante de cada ritual como dificultad, esencia y tags.
 */

import React, { useState, useMemo } from "react";
import { Search, BookOpen, Star, Plus } from "lucide-react";
import {
  RitualTemplate,
  RitualCategory,
  RITUAL_LIBRARY,
  getPopularRituals,
  searchRituals,
  convertTemplateToRitual,
} from "../../data/ritualLibrary";
import { useAuthStore } from "../../features/auth/stores/useAuthStore";
import { Difficulty, Ritual } from "../../types";
import {
  translateDifficulty,
  translateFrequency,
} from "../../utils/translations";

interface RitualLibraryProps {
  /*
  Callback que se ejecuta al importar un ritual.
  El ritual importado se genera a partir del template y el id del usuario.
  */
  onImport?: (ritual: Ritual) => void;
}

// Categorías disponibles para filtrar los rituales
const CATEGORIES: { value: RitualCategory; label: string }[] = [
  { value: "health", label: "Salud" },
  { value: "productivity", label: "Productividad" },
  { value: "mental", label: "Mental" },
  { value: "physical", label: "Físico" },
  { value: "learning", label: "Aprendizaje" },
  { value: "creativity", label: "Creatividad" },
  { value: "spiritual", label: "Espiritual" },
];

const RitualLibrary: React.FC<RitualLibraryProps> = ({ onImport }) => {
  const user = useAuthStore((state) => state.user);

  // Estado para filtro de búsqueda, categoría, dificultad y populares
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<RitualCategory | "all">("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | "all">("all");
  const [showPopularOnly, setShowPopularOnly] = useState(false);

  /**
   * Filtra la lista de rituales basada en populares, búsqueda, categoría y dificultad.
   * Usar useMemo para evitar filtrados innecesarios en cada render.
   */
  const filteredRituals = useMemo(() => {
    let filtered: RitualTemplate[] = showPopularOnly
      ? getPopularRituals()
      : RITUAL_LIBRARY;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((r) => r.category === selectedCategory);
    }

    if (selectedDifficulty !== "all") {
      filtered = filtered.filter((r) => r.difficulty === selectedDifficulty);
    }

    if (searchQuery.trim()) {
      filtered = searchRituals(searchQuery);
      if (selectedCategory !== "all") {
        filtered = filtered.filter((r) => r.category === selectedCategory);
      }
      if (selectedDifficulty !== "all") {
        filtered = filtered.filter((r) => r.difficulty === selectedDifficulty);
      }
    }

    return filtered;
  }, [searchQuery, selectedCategory, selectedDifficulty, showPopularOnly]);

  /*
   * Importa un ritual template como ritual de usuario usando el id del usuario actual.
   */
  const handleImportRitual = (template: RitualTemplate) => {
    if (!user || !onImport) return;
    const ritual = convertTemplateToRitual(template, user.id);
    onImport(ritual);
  };

  // Por defecto no previene rituales duplicados (la lógica depende del padre, si fuera necesario)
  const isRitualAlreadyAdded = (templateId: string) => {
    return false;
  };

  // Retorna clases según la dificultad del ritual
  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case "master":
        return "border-red-500/30 text-red-500 bg-red-500/10";
      case "adept":
        return "border-yellow-500/30 text-yellow-500 bg-yellow-500/10";
      default:
        return "border-green-500/30 text-green-500 bg-green-500/10";
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="text-ritual-accent" size={24} />
        <h2 className="text-2xl font-display font-bold">
          Biblioteca de Rituales
        </h2>
      </div>

      {/* Búsqueda y filtros */}
      <div className="space-y-4">
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar rituales..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:border-ritual-accent outline-none"
          />
        </div>

        {/* Filtros por populares, categoría y dificultad */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowPopularOnly(!showPopularOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showPopularOnly
                ? "bg-ritual-accent/10 border-ritual-accent text-ritual-accent"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <Star size={16} />
            Populares
          </button>

          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value as RitualCategory | "all")
            }
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-ritual-accent outline-none"
          >
            <option value="all">Todas las categorías</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) =>
              setSelectedDifficulty(e.target.value as Difficulty | "all")
            }
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-ritual-accent outline-none"
          >
            <option value="all">Todas las dificultades</option>
            <option value="novice">Novato</option>
            <option value="adept">Intermedio</option>
            <option value="master">Maestro</option>
          </select>
        </div>
      </div>

      {/* Grid de rituales filtrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRituals.map((template) => {
          const alreadyAdded = isRitualAlreadyAdded(template.id);

          return (
            <div
              key={template.id}
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all"
            >
              {/* Encabezado de la tarjeta de ritual */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white mb-1">
                    {template.title}
                  </h3>
                  <p className="text-zinc-400 text-sm mb-3">
                    {template.description}
                  </p>
                </div>
                {template.popular && (
                  <Star
                    className="text-yellow-500 fill-yellow-500/20"
                    size={18}
                  />
                )}
              </div>

              {/* Meta-información: dificultad, frecuencia y esencia */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`text-xs px-2 py-1 rounded border ${getDifficultyColor(template.difficulty)}`}
                >
                  {translateDifficulty(template.difficulty)}
                </span>
                <span className="text-xs px-2 py-1 rounded border border-zinc-800 text-zinc-400">
                  {translateFrequency(template.frequency)}
                </span>
                <span className="text-xs px-2 py-1 rounded border border-ritual-accent/30 text-ritual-accent">
                  +{template.essenceReward} Esencia
                </span>
              </div>

              {/* Tags de la tarjeta */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Botón para importar ritual, lo desactiva si ya fue importado */}
              <button
                onClick={() => handleImportRitual(template)}
                disabled={alreadyAdded}
                className={`w-full py-2 px-4 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                  alreadyAdded
                    ? "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                    : "bg-ritual-accent text-black hover:bg-emerald-400"
                }`}
              >
                {alreadyAdded ? (
                  <>
                    <span>Ya agregado</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Importar Ritual
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Mensaje cuando no hay rituales con los filtros aplicados */}
      {filteredRituals.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No se encontraron rituales con los filtros seleccionados.
        </div>
      )}
    </div>
  );
};

export default RitualLibrary;
