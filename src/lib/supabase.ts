import { createClient } from "@supabase/supabase-js";

// Obtiene las credenciales de Supabase desde las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si faltan las credenciales, muestra una advertencia en consola
if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
  );
}

// Inicializa el cliente de Supabase con persistencia de sesión
export const supabase = createClient(
  supabaseUrl || "supabase.com",
  supabaseKey || "VITE_SUPABASE_ANON_KEY",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
); 