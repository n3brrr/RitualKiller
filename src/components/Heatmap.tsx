/**
 * Heatmap.tsx
 *
 * Este archivo define el componente React Heatmap.
 * Muestra un heatmap semanal de la actividad de "rituales" durante el último año,
 * visualizando la intensidad diaria en formato de cuadrícula.
 */

import React, { useMemo } from "react";
import { RitualLog } from "../types";

interface HeatmapProps {
  logs: RitualLog[];
}

export const Heatmap: React.FC<HeatmapProps> = ({ logs }) => {
  // Cantidad de días a renderizar: 52 semanas * 7 días = 364 días (aprox. 1 año)
  const daysToRender = 364;

  // Calcula los datos a mostrar en el heatmap usando un memo para optimización
  const heatmapData = useMemo(() => {
    const today = new Date();
    const data = [];

    // Mapeo: fecha (YYYY-MM-DD) -> cantidad de rituales en ese día
    const logMap: Record<string, number> = {};
    logs.forEach((log) => {
      if (log.date) {
        const dateStr = log.date.split("T")[0] || "";
        if (dateStr) {
          logMap[dateStr] = (logMap[dateStr] || 0) + 1;
        }
      }
    });

    // Genera arreglo de días desde hace 364 hasta hoy, con su respectivo conteo
    for (let i = daysToRender; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      data.push({
        date: dateStr,
        count: logMap[dateStr] || 0,
      });
    }
    return data;
  }, [logs]);

  // Determina la clase de color de intensidad visual según cantidad de rituales en ese día
  const getColor = (count: number) => {
    if (count === 0) return "bg-ritual-gray/30";
    if (count === 1) return "bg-ritual-accent/40";
    if (count === 2) return "bg-ritual-accent/60";
    if (count === 3) return "bg-ritual-accent/80";
    return "bg-ritual-accent shadow-[0_0_10px_rgba(34,197,94,0.7)]";
  };

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div
        ref={(el) => {
          // Auto-scroll horizontal al final, para mostrar la semana más reciente
          if (el) {
            el.scrollLeft = el.scrollWidth;
          }
        }}
        className="flex gap-1 min-w-max"
      >
        {/* Dispone las columnas por semana (7 días por columna) */}
        {Array.from({ length: Math.ceil(heatmapData.length / 7) }).map(
          (_, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {heatmapData
                .slice(weekIndex * 7, weekIndex * 7 + 7)
                .map((day) => (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count} Rituales`}
                    className={`w-3 h-3 rounded-sm transition-all duration-300 hover:scale-125 ${getColor(day.count)}`}
                  />
                ))}
            </div>
          ),
        )}
      </div>
      {/* Leyenda de intensidad */}
      <div className="mt-2 flex items-center justify-end text-xs text-zinc-500 gap-1">
        <span>Inactivo</span>
        <div className="w-3 h-3 bg-ritual-gray/30 rounded-sm"></div>
        <div className="w-3 h-3 bg-ritual-accent/40 rounded-sm"></div>
        <div className="w-3 h-3 bg-ritual-accent rounded-sm"></div>
        <span>Despierto</span>
      </div>
    </div>
  );
};
