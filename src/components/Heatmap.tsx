import React, { useMemo } from 'react';
import { RitualLog } from '../types';

interface HeatmapProps {
  logs: RitualLog[];
}

export const Heatmap: React.FC<HeatmapProps> = ({ logs }) => {
  // Calculate the last 365 days (or approx 52 weeks)
  const daysToRender = 364; // 52 weeks * 7 days
  
  const heatmapData = useMemo(() => {
    const today = new Date();
    const data = [];
    
    // Create a map of date -> intensity count
    const logMap: Record<string, number> = {};
    logs.forEach(log => {
      if (logMap[log.date]) {
        logMap[log.date]++;
      } else {
        logMap[log.date] = 1;
      }
    });

    for (let i = daysToRender; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      data.push({
        date: dateStr,
        count: logMap[dateStr] || 0
      });
    }
    return data;
  }, [logs]);

  // Determine intensity color
  const getColor = (count: number) => {
    if (count === 0) return 'bg-ritual-gray/30';
    if (count === 1) return 'bg-ritual-accent/40';
    if (count === 2) return 'bg-ritual-accent/60';
    if (count === 3) return 'bg-ritual-accent/80';
    return 'bg-ritual-accent shadow-[0_0_10px_rgba(34,197,94,0.7)]';
  };

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex gap-1 min-w-max">
        {/* We arrange in columns of 7 days (weeks) */}
        {Array.from({ length: Math.ceil(heatmapData.length / 7) }).map((_, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {heatmapData.slice(weekIndex * 7, (weekIndex * 7) + 7).map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} Rituals`}
                className={`w-3 h-3 rounded-sm transition-all duration-300 hover:scale-125 ${getColor(day.count)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end text-xs text-zinc-500 gap-1">
        <span>Dormant</span>
        <div className="w-3 h-3 bg-ritual-gray/30 rounded-sm"></div>
        <div className="w-3 h-3 bg-ritual-accent/40 rounded-sm"></div>
        <div className="w-3 h-3 bg-ritual-accent rounded-sm"></div>
        <span>Awakened</span>
      </div>
    </div>
  );
};
