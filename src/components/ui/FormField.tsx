import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/i18n";

const INPUT_CLASS =
  "min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-4 text-white outline-none focus:border-ritual-accent focus-visible:ring-2 focus-visible:ring-ritual-accent/60";

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  hint?: ReactNode;
  error?: string | null;
}

/** Labelled input with optional hint and error, wired with aria-describedby. */
export function TextField({ label, hint, error, className, ...input }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-xs font-bold uppercase tracking-wider text-zinc-400"
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={`${INPUT_CLASS} ${className ?? ""}`}
        {...input}
      />
      {hint && (
        <p id={hintId} className="text-xs text-zinc-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

/** Password input with a show/hide toggle. */
export function PasswordField({
  label,
  hint,
  error,
  ...input
}: Omit<FieldProps, "type">) {
  const id = useId();
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-xs font-bold uppercase tracking-wider text-zinc-400"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          className={`${INPUT_CLASS} pr-12`}
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? t("auth.hidePassword") : t("auth.showPassword")}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 inline-flex min-w-11 items-center justify-center text-zinc-400 hover:text-white"
        >
          {visible ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      </div>
      {hint && (
        <p id={hintId} className="text-xs text-zinc-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
