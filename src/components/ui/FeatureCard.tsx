/*
 * FeatureCard.tsx
 *
 * Este archivo define el componente FeatureCard.
 * Muestra una tarjeta animada con un título y descripción de una funcionalidad,
 * utilizando framer-motion para las animaciones y estilos responsivos.
 */

import { motion } from "framer-motion";

/*
 * Componente de tarjeta para destacar una característica.
 * @param title - Título de la funcionalidad
 * @param desc - Descripción de la funcionalidad
 * @param index - Índice de la tarjeta (puede usarse para efectos animados o key)
 */
export const FeatureCard = ({
  title,
  desc,
  index,
}: {
  title: string;
  desc: string;
  index: number;
}) => (
  <motion.div
    className="feature-card p-8 border border-zinc-900 bg-zinc-950/50 hover:border-ritual-accent/50 transition-all duration-500 group"
  >
    <h3 className="font-display text-2xl font-bold mb-4 text-zinc-200 group-hover:text-ritual-accent transition-colors">
      {title}
    </h3>
    <p className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
      {desc}
    </p>
  </motion.div>
);
