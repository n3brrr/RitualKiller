import { useEffect, useId, useState, type FormEvent } from "react";
import { Modal } from "./Modal";

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void> | void;
  busy?: boolean;
}

export function ReportDialog({ open, onClose, onSubmit, busy = false }: ReportDialogProps) {
  const formId = useId();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setError("Escribe al menos 3 caracteres.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "No se pudo enviar el reporte.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = busy || submitting;
  const errorId = `${formId}-error`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reportar publicación"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 px-4 text-sm font-bold text-zinc-300 hover:border-zinc-500 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isBusy}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-red-500 px-4 text-sm font-bold text-white hover:bg-red-400 disabled:opacity-50"
          >
            {isBusy ? "Enviando..." : "Enviar reporte"}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <label htmlFor={`${formId}-reason`} className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-400">
          Motivo
        </label>
        <textarea
          id={`${formId}-reason`}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          maxLength={500}
          data-autofocus
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          placeholder="Cuéntanos qué incumple las normas."
          className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-ritual-accent"
        />
        <p className="mt-1 text-xs text-zinc-500">Mínimo 3 caracteres. El equipo revisará el reporte.</p>
        {error && (
          <p id={errorId} role="alert" className="mt-2 text-sm text-red-400">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
