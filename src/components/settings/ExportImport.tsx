/**
 * ExportImport.tsx
 *
 * Componente encargado de la exportación e importación de datos del usuario en la app.
 * Permite al usuario descargar su backup en JSON o CSV, e importar datos desde un archivo JSON para restaurar su información.
 */

import React, { useState } from 'react';
import { Download, Upload, FileJson, FileSpreadsheet, AlertCircle, Check } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { exportData, exportToCSV, downloadFile, importData, validateImportData } from '../../utils/exportImport';

const ExportImport: React.FC = () => {
  const { user, rituals, logs, setRituals, setLogs, setUser } = useAppContext();
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Exporta los datos completos del usuario en formato JSON
  const handleExportJSON = () => {
    if (!user) return;
    const data = exportData(user, rituals, logs);
    downloadFile(data, `ritualkiller-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  // Exporta los rituales y logs en CSV
  const handleExportCSV = () => {
    const csv = exportToCSV(rituals, logs);
    downloadFile(csv, `ritualkiller-data-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  // Importa los datos desde un archivo JSON seleccionado por el usuario
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const importedData = importData(content);

      if (!importedData) {
        setImportError('Error al leer el archivo. Asegúrate de que sea un JSON válido.');
        setImportSuccess(false);
        return;
      }

      const validation = validateImportData(importedData);
      if (!validation.valid) {
        setImportError(`Datos inválidos: ${validation.errors.join(', ')}`);
        setImportSuccess(false);
        return;
      }

      // Confirma antes de importar, ya que se reemplazarán todos los datos actuales
      if (window.confirm(
        `¿Estás seguro de que quieres importar estos datos?\n` +
        `Esto reemplazará tus datos actuales.\n\n` +
        `Rituales: ${importedData.rituals.length}\n` +
        `Logs: ${importedData.logs.length}`
      )) {
        setUser(importedData.user);
        setRituals(importedData.rituals);
        setLogs(importedData.logs);
        setImportSuccess(true);
        setImportError(null);

        // Mensaje de éxito se oculta después de 3 segundos
        setTimeout(() => {
          setImportSuccess(false);
        }, 3000);
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Resetea el input para permitir nueva carga si es necesario
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Exportar / Importar Datos</h2>

      {/* Sección de exportación */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Download className="text-ritual-accent" size={20} />
          Exportar Datos
        </h3>
        <p className="text-zinc-400 text-sm mb-4">
          Descarga una copia de seguridad de todos tus datos en formato JSON o CSV.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2 bg-ritual-accent text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors"
          >
            <FileJson size={18} />
            Exportar JSON
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white font-bold rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700"
          >
            <FileSpreadsheet size={18} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Sección de importación */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Upload className="text-ritual-accent" size={20} />
          Importar Datos
        </h3>
        <p className="text-zinc-400 text-sm mb-4">
          Restaura tus datos desde un archivo JSON de respaldo. Esto reemplazará tus datos actuales.
        </p>

        {/* Mensaje de error en la importación */}
        {importError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-500">{importError}</p>
          </div>
        )}

        {/* Mensaje de éxito en la importación */}
        {importSuccess && (
          <div className="mb-4 p-3 bg-ritual-accent/10 border border-ritual-accent/30 rounded-lg flex items-start gap-2">
            <Check className="text-ritual-accent flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-ritual-accent">Datos importados exitosamente</p>
          </div>
        )}

        <label className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white font-bold rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700 cursor-pointer">
          <Upload size={18} />
          Seleccionar Archivo JSON
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      {/* Información y consejo al usuario */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500">
          💡 <strong>Consejo:</strong> Exporta tus datos regularmente para mantener una copia de seguridad. 
          Los archivos JSON contienen todos tus datos, mientras que CSV solo incluye los logs de completados.
        </p>
      </div>
    </div>
  );
};

export default ExportImport;
