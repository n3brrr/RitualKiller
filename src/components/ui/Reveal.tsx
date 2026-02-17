/*
 * Reveal.tsx
 *
 * Este archivo define el componente Reveal.
 * Permite mostrar animaciones de aparición (fade-in y movimiento) a su contenido hijo usando framer-motion.
 */

import React from "react";
import { motion } from "framer-motion";

/*
 * Reveal
 * Envuelve a sus hijos en una animación de aparición suave (fade-in + desplazamiento y desenfoque).
 */
export const Reveal = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};
