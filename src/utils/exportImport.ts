import { User, Ritual, RitualLog } from '../types';

export interface ExportData {
  version: string;
  exportDate: string;
  user: User;
  rituals: Ritual[];
  logs: RitualLog[];
}

export const exportData = (user: User, rituals: Ritual[], logs: RitualLog[]): string => {
  const data: ExportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    user,
    rituals,
    logs,
  };

  return JSON.stringify(data, null, 2);
};

export const exportToCSV = (rituals: Ritual[], logs: RitualLog[]): string => {
  // CSV Header
  const headers = ['Fecha', 'Ritual', 'Dificultad', 'Esencia Ganada'];
  
  // CSV Rows
  const rows = logs.map(log => {
    const ritual = rituals.find(r => r.id === log.ritualId);
    return [
      log.date,
      ritual?.title || 'Desconocido',
      ritual?.difficulty || 'N/A',
      log.essence_gained?.toString() || '0',
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
};

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importData = (jsonString: string): ExportData | null => {
  try {
    const data = JSON.parse(jsonString) as ExportData;
    
    // Validate structure
    if (!data.user || !data.rituals || !data.logs) {
      throw new Error('Formato de datos inválido');
    }

    return data;
  } catch (error) {
    console.error('Error importing data:', error);
    return null;
  }
};

export const validateImportData = (data: ExportData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.user || !data.user.id) {
    errors.push('Datos de usuario inválidos');
  }

  if (!Array.isArray(data.rituals)) {
    errors.push('Los rituales deben ser un array');
  }

  if (!Array.isArray(data.logs)) {
    errors.push('Los logs deben ser un array');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
