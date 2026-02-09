import React, { useState, useMemo } from 'react';
import { Search, Filter, BookOpen, Star, Plus } from 'lucide-react';
import { RitualTemplate, RitualCategory, RITUAL_LIBRARY, getRitualsByCategory, getPopularRituals, searchRituals, convertTemplateToRitual } from '../../data/ritualLibrary';
import { useAppContext } from '../../contexts/AppContext';
import { Difficulty } from '../../types';

const CATEGORIES: { value: RitualCategory; label: string }[] = [
  { value: 'health', label: 'Salud' },
  { value: 'productivity', label: 'Productividad' },
  { value: 'mental', label: 'Mental' },
  { value: 'physical', label: 'Físico' },
  { value: 'learning', label: 'Aprendizaje' },
  { value: 'creativity', label: 'Creatividad' },
  { value: 'spiritual', label: 'Espiritual' },
];

const RitualLibrary: React.FC = () => {
  const { user, rituals, setRituals } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RitualCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [showPopularOnly, setShowPopularOnly] = useState(false);

  const filteredRituals = useMemo(() => {
    let filtered: RitualTemplate[] = showPopularOnly ? getPopularRituals() : RITUAL_LIBRARY;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(r => r.difficulty === selectedDifficulty);
    }

    if (searchQuery.trim()) {
      filtered = searchRituals(searchQuery);
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(r => r.category === selectedCategory);
      }
      if (selectedDifficulty !== 'all') {
        filtered = filtered.filter(r => r.difficulty === selectedDifficulty);
      }
    }

    return filtered;
  }, [searchQuery, selectedCategory, selectedDifficulty, showPopularOnly]);

  const handleImportRitual = (template: RitualTemplate) => {
    if (!user) return;
    
    const ritual = convertTemplateToRitual(template, user.id);
    setRituals(prev => [...prev, ritual]);
  };

  const isRitualAlreadyAdded = (templateId: string) => {
    return rituals.some(r => r.id.startsWith(templateId));
  };

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'master': return 'border-red-500/30 text-red-500 bg-red-500/10';
      case 'adept': return 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10';
      default: return 'border-green-500/30 text-green-500 bg-green-500/10';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="text-ritual-accent" size={24} />
        <h2 className="text-2xl font-display font-bold">Biblioteca de Rituales</h2>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={20} />
          <input
            type="text"
            placeholder="Buscar rituales..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:border-ritual-accent outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowPopularOnly(!showPopularOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showPopularOnly
                ? 'bg-ritual-accent/10 border-ritual-accent text-ritual-accent'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <Star size={16} />
            Populares
          </button>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as RitualCategory | 'all')}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-ritual-accent outline-none"
          >
            <option value="all">Todas las categorías</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty | 'all')}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-ritual-accent outline-none"
          >
            <option value="all">Todas las dificultades</option>
            <option value="novice">Novato</option>
            <option value="adept">Intermedio</option>
            <option value="master">Maestro</option>
          </select>
        </div>
      </div>

      {/* Rituals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRituals.map((template) => {
          const alreadyAdded = isRitualAlreadyAdded(template.id);
          
          return (
            <div
              key={template.id}
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white mb-1">{template.title}</h3>
                  <p className="text-zinc-400 text-sm mb-3">{template.description}</p>
                </div>
                {template.popular && (
                  <Star className="text-yellow-500 fill-yellow-500/20" size={18} />
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`text-xs px-2 py-1 rounded border ${getDifficultyColor(template.difficulty)}`}>
                  {template.difficulty}
                </span>
                <span className="text-xs px-2 py-1 rounded border border-zinc-800 text-zinc-400">
                  {template.frequency}
                </span>
                <span className="text-xs px-2 py-1 rounded border border-ritual-accent/30 text-ritual-accent">
                  +{template.essenceReward} Essence
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-500">
                    {tag}
                  </span>
                ))}
              </div>

              <button
                onClick={() => handleImportRitual(template)}
                disabled={alreadyAdded}
                className={`w-full py-2 px-4 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                  alreadyAdded
                    ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                    : 'bg-ritual-accent text-black hover:bg-emerald-400'
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

      {filteredRituals.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No se encontraron rituales con los filtros seleccionados.
        </div>
      )}
    </div>
  );
};

export default RitualLibrary;
