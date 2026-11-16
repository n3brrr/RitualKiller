import type { TranslationKey } from "@/i18n";

const DIFFICULTIES = ["novice", "adept", "master"] as const;
const FREQUENCIES = ["daily", "weekly"] as const;

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
  messageKey?: TranslationKey;
} {
  if (password.length < 6) {
    return {
      valid: false,
      message: "La contraseña debe tener al menos 6 caracteres",
      messageKey: "validation.passwordMin",
    };
  }
  return { valid: true };
}

export function validateUsername(username: string): {
  valid: boolean;
  message?: string;
  messageKey?: TranslationKey;
} {
  if (username.trim().length < 2 || username.trim().length > 30) {
    return {
      valid: false,
      message: "El usuario debe tener entre 2 y 30 caracteres",
      messageKey: "validation.usernameLength",
    };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    return {
      valid: false,
      message: "Solo letras, números y guiones bajos",
      messageKey: "validation.usernameChars",
    };
  }
  return { valid: true };
}

export function validateRitual(ritual: {
  title: string;
  description: string;
  difficulty: string;
}): { valid: boolean; message?: string; messageKey?: TranslationKey } {
  if (!ritual.title || ritual.title.trim().length === 0) {
    return {
      valid: false,
      message: "El título del ritual es requerido",
      messageKey: "validation.ritualTitleRequired",
    };
  }
  if (ritual.title.length > 100) {
    return {
      valid: false,
      message: "El título no puede exceder 100 caracteres",
      messageKey: "validation.ritualTitleMax",
    };
  }
  if (ritual.description.length > 500) {
    return {
      valid: false,
      message: "La descripción no puede exceder 500 caracteres",
      messageKey: "validation.ritualDescriptionMax",
    };
  }
  if (!DIFFICULTIES.includes(ritual.difficulty as (typeof DIFFICULTIES)[number])) {
    return {
      valid: false,
      message: "Dificultad inválida",
      messageKey: "validation.difficulty",
    };
  }
  return { valid: true };
}

export function validateGoal(goal: string): {
  valid: boolean;
  message?: string;
  messageKey?: TranslationKey;
} {
  if (!goal || goal.trim().length === 0) {
    return {
      valid: false,
      message: "El objetivo es requerido",
      messageKey: "validation.goalRequired",
    };
  }
  if (goal.length > 200) {
    return {
      valid: false,
      message: "El objetivo no puede exceder 200 caracteres",
      messageKey: "validation.goalMax",
    };
  }
  return { valid: true };
}

export function validateContent(
  content: string,
  max = 500,
): {
  valid: boolean;
  message?: string;
  messageKey?: TranslationKey;
} {
  const clean = content.trim();
  if (!clean) {
    return {
      valid: false,
      message: "El contenido no puede estar vacío",
      messageKey: "validation.contentEmpty",
    };
  }
  if (clean.length > max) {
    return {
      valid: false,
      message: `El contenido no puede exceder ${max} caracteres`,
      messageKey: "validation.contentMax",
    };
  }
  return { valid: true };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Validates the backup shape before touching the database. */
export function validateImportData(data: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!isRecord(data)) {
    return { valid: false, errors: ["El archivo no contiene un objeto JSON"] };
  }
  if (!Array.isArray(data.rituals)) errors.push("Los rituales deben ser un array");
  if (!Array.isArray(data.logs)) errors.push("Los logs deben ser un array");

  if (Array.isArray(data.rituals)) {
    data.rituals.forEach((ritual, index) => {
      if (!isRecord(ritual) || typeof ritual.title !== "string") {
        errors.push(`Ritual ${index + 1}: título inválido`);
      } else if (
        !DIFFICULTIES.includes(ritual.difficulty as (typeof DIFFICULTIES)[number])
      ) {
        errors.push(`Ritual ${index + 1}: dificultad inválida`);
      } else if (
        !FREQUENCIES.includes(ritual.frequency as (typeof FREQUENCIES)[number])
      ) {
        errors.push(`Ritual ${index + 1}: frecuencia inválida`);
      }
    });
  }

  if (Array.isArray(data.logs)) {
    data.logs.forEach((log, index) => {
      if (
        !isRecord(log) ||
        typeof log.ritualId !== "string" ||
        typeof log.date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(log.date)
      ) {
        errors.push(`Log ${index + 1}: formato inválido`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}
