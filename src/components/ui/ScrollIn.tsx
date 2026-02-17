/*
 * Scrollin.tsx
 *
 * Este archivo define el componente ScrollIn.
 * Utiliza framer-motion para animar la aparición vertical y opaca de sus hijos al renderizarse,
 * proporcionando un efecto visual suave al hacer scroll o cargar elementos en pantalla.
 */

import React from "react";
import { motion } from "framer-motion";

/*
 * Componente que envuelve a sus hijos y aplica una animación de entrada desde abajo.
 * @param children - Elementos React a animar al mostrar.
 */
const ScrollIn = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} // Inicia invisible y desplazado hacia abajo
      animate={{ opacity: 1, y: 0 }}  // Aparece visible en su lugar original
      transition={{ duration: 0.5, ease: "easeOut" }} // Duración y curva de animación
    >
      {children}
    </motion.div>
  );
};

export default ScrollIn;
