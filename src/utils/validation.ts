export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 5) {
    return { valid: false, message: "La contraseña debe tener al menos 5 caracteres" };
  }
  return { valid: true };
};

export const validateRitual = (ritual: {
  title: string;
  description: string;
  difficulty: string;
}): { valid: boolean; message?: string } => {
  if (!ritual.title || ritual.title.trim().length === 0) {
    return { valid: false, message: "El título del ritual es requerido" };
  }
  if (ritual.title.length > 100) {
    return { valid: false, message: "El título no puede exceder 100 caracteres" };
  }
  if (!["novice", "adept", "master"].includes(ritual.difficulty)) {
    return { valid: false, message: "Dificultad inválida" };
  }
  return { valid: true };
};

export const validateGoal = (goal: string): { valid: boolean; message?: string } => {
  if (!goal || goal.trim().length === 0) {
    return { valid: false, message: "El objetivo es requerido" };
  }
  if (goal.length > 200) {
    return { valid: false, message: "El objetivo no puede exceder 200 caracteres" };
  }
  return { valid: true };
};
