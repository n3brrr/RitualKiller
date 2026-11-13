import type { Difficulty, Frequency, Ritual, RitualLog } from "../types";
import { validateImportData as validateShape } from "./validation";

export interface ExportRitual {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  frequency: Frequency;
  essenceReward: number;
}

export interface ExportLog {
  ritualId: string;
  date: string;
  essence_gained: number;
}

export interface ExportData {
  version: string;
  exportDate: string;
  rituals: ExportRitual[];
  logs: ExportLog[];
}

/** Prevent CSV formula injection and quote every cell. */
export function csvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportData(rituals: Ritual[], logs: RitualLog[]): string {
  const data: ExportData = {
    version: "2.0.0",
    exportDate: new Date().toISOString(),
    rituals: rituals.map((ritual) => ({
      id: ritual.id,
      title: ritual.title,
      description: ritual.description,
      difficulty: ritual.difficulty,
      frequency: ritual.frequency,
      essenceReward: ritual.essenceReward,
    })),
    logs: logs.map((log) => ({
      ritualId: log.ritualId,
      date: log.date,
      essence_gained: log.essence_gained,
    })),
  };
  return JSON.stringify(data, null, 2);
}

export function exportToCSV(rituals: Ritual[], logs: RitualLog[]): string {
  const headers = ["Fecha", "Ritual", "Dificultad", "Esencia ganada"];
  const rows = logs.map((log) => {
    const ritual = rituals.find((item) => item.id === log.ritualId);
    return [
      log.date,
      ritual?.title ?? "Desconocido",
      ritual?.difficulty ?? "N/A",
      log.essence_gained,
    ];
  });
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Parses a backup. Returns null when the shape is unusable; caller decides how
 * to surface the validation errors.
 */
export function importData(jsonString: string): ExportData | null {
  try {
    const parsed = JSON.parse(jsonString) as unknown;
    const validation = validateShape(parsed);
    if (!validation.valid) {
      console.error("Invalid backup:", validation.errors);
      return null;
    }
    return parsed as ExportData;
  } catch (error) {
    console.error("Error importing data:", error);
    return null;
  }
}
