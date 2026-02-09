import React, { useState, useMemo } from 'react';
import { Target, Plus, Calendar, TrendingUp, X } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { Goal } from '../../types';

const GoalsManager: React.FC = () => {
  const { user, rituals, setRituals } = useAppContext();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target_date: '',
    target_value: 100,
    ritual_ids: [] as string[],
  });

  const goalsWithProgress = useMemo(() => {
    return goals.map(goal => {
      const completedRituals = goal.ritual_ids.filter(id => 
        rituals.some(r => r.id === id)
      ).length;
      const progress = (completedRituals / goal.ritual_ids.length) * 100;
      
      return {
        ...goal,
        progress: Math.min(progress, 100),
        completedRituals,
      };
    });
  }, [goals, rituals]);

  const handleCreateGoal = () => {
    if (!user || !newGoal.title || !newGoal.target_date) return;

    const goal: Goal = {
      id: Date.now().toString(),
      user_id: user.id,
      title: newGoal.title,
      description: newGoal.description,
      target_date: newGoal.target_date,
      progress: 0,
      target_value: newGoal.target_value,
      ritual_ids: newGoal.ritual_ids,
      created_at: new Date().toISOString(),
    };

    setGoals(prev => [...prev, goal]);
    setNewGoal({
      title: '',
      description: '',
      target_date: '',
      target_value: 100,
      ritual_ids: [],
    });
    setShowCreator(false);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const toggleRitualSelection = (ritualId: string) => {
    setNewGoal(prev => ({
      ...prev,
      ritual_ids: prev.ritual_ids.includes(ritualId)
        ? prev.ritual_ids.filter(id => id !== ritualId)
        : [...prev.ritual_ids, ritualId],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="text-ritual-accent" size={24} />
          <h2 className="text-2xl font-display font-bold">Objetivos y Metas</h2>
        </div>
        <button
          onClick={() => setShowCreator(!showCreator)}
          className="flex items-center gap-2 px-4 py-2 bg-ritual-accent text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors"
        >
          <Plus size={18} />
          Nuevo Objetivo
        </button>
      </div>

      {/* Goal Creator */}
      {showCreator && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Crear Nuevo Objetivo</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-zinc-400 mb-2">Título</label>
              <input
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                placeholder="Ej: Completar 30 días de ejercicio"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-ritual-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-400 mb-2">Descripción</label>
              <textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                placeholder="Describe tu objetivo..."
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-ritual-accent outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2">Fecha Objetivo</label>
                <input
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-ritual-accent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2">Valor Objetivo</label>
                <input
                  type="number"
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal({ ...newGoal, target_value: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-ritual-accent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-400 mb-2">Rituales Vinculados</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {rituals.map(ritual => (
                  <label
                    key={ritual.id}
                    className="flex items-center gap-2 p-2 bg-zinc-900 rounded-lg cursor-pointer hover:bg-zinc-800"
                  >
                    <input
                      type="checkbox"
                      checked={newGoal.ritual_ids.includes(ritual.id)}
                      onChange={() => toggleRitualSelection(ritual.id)}
                      className="rounded border-zinc-700"
                    />
                    <span className="text-sm text-white">{ritual.title}</span>
                  </label>
                ))}
                {rituals.length === 0 && (
                  <p className="text-sm text-zinc-500">No hay rituales disponibles</p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateGoal}
                className="flex-1 bg-ritual-accent text-black font-bold py-2 px-4 rounded-lg hover:bg-emerald-400 transition-colors"
              >
                Crear Objetivo
              </button>
              <button
                onClick={() => setShowCreator(false)}
                className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goalsWithProgress.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-12 text-center">
            <Target className="mx-auto mb-4 text-zinc-600" size={48} />
            <p className="text-zinc-500">No tienes objetivos definidos aún</p>
            <p className="text-sm text-zinc-600 mt-2">Crea tu primer objetivo para comenzar</p>
          </div>
        ) : (
          goalsWithProgress.map((goal) => {
            const daysRemaining = Math.ceil(
              (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={goal.id}
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-zinc-400 text-sm mb-3">{goal.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(goal.target_date).toLocaleDateString('es-ES')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp size={14} />
                        <span>{daysRemaining} días restantes</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-zinc-500 hover:text-red-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Progreso</span>
                    <span>{goal.progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ritual-accent transition-all duration-500"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-zinc-500">
                    {goal.completedRituals} / {goal.ritual_ids.length} rituales vinculados completados
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GoalsManager;
