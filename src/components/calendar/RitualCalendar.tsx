/**
 * RitualCalendar.tsx
 * 
 * Muestra un calendario mensual visualizando el progreso diario de los rituales completados.
 * Presenta cada día con un indicador de avance y permite navegar entre meses.
 * Utiliza colores para señalar días completos, parciales o sin actividad.
 */

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useRitualStore } from "../../features/rituals/stores/useRitualStore";

const RitualCalendar: React.FC = () => {
  const { rituals, logs } = useRitualStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // Navega al mes anterior
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // Navega al mes siguiente
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  /**
   * Retorna cuántos rituales fueron completados en un día concreto.
   */
  const getDayCompletionStatus = (
    day: number,
  ): { completed: number; total: number } => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayLogs = logs.filter((log) => log.date === dateStr);
    return {
      completed: dayLogs.length,
      total: rituals.length,
    };
  };

  /*
   * Devuelve la clase de color según porcentaje completado ese día.
   */
  const getCompletionColor = (completed: number, total: number): string => {
    if (total === 0) return "bg-zinc-900";
    const ratio = completed / total;
    if (ratio === 1) return "bg-ritual-accent";
    if (ratio >= 0.7) return "bg-ritual-accent/60";
    if (ratio >= 0.4) return "bg-ritual-accent/40";
    return "bg-zinc-900";
  };

  const days: (number | null)[] = [];

  // Celdas vacías iniciales según el día de inicio del mes
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  // Días numerados del mes
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-zinc-900 rounded-lg transition-colors"
        >
          <ChevronLeft className="text-zinc-400" size={20} />
        </button>

        <h2 className="text-xl font-display font-bold">
          {monthNames[month]} {year}
        </h2>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-zinc-900 rounded-lg transition-colors"
        >
          <ChevronRight className="text-zinc-400" size={20} />
        </button>
      </div>

      {/* Encabezados de días de la semana */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-bold text-zinc-500 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Celdas del calendario */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const { completed, total } = getDayCompletionStatus(day);
          // Identifica si es el día actual
          const isToday =
            day === new Date().getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear();

          return (
            <div
              key={day}
              className={`aspect-square rounded-lg border-2 p-2 flex flex-col items-center justify-center transition-all hover:scale-105 ${
                isToday ? "border-ritual-accent" : "border-zinc-800"
              } ${getCompletionColor(completed, total)}`}
              title={`${day}: ${completed}/${total} rituales completados`}
            >
              <span
                className={`text-sm font-bold ${
                  isToday ? "text-ritual-accent" : "text-zinc-300"
                }`}
              >
                {day}
              </span>
              {/* Muestra el valor de completados solo si hay al menos uno */}
              {completed > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Check size={10} className="text-white" />
                  <span className="text-[10px] text-white">{completed}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda visual para interpretar los colores */}
      <div className="mt-6 flex items-center justify-center gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-zinc-900 border border-zinc-800"></div>
          <span>Sin completar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-ritual-accent/40"></div>
          <span>Parcial</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-ritual-accent"></div>
          <span>Completo</span>
        </div>
      </div>
    </div>
  );
};

export default RitualCalendar;
