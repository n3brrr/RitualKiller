/*
 * Divider.tsx
 * 
 * Componente Divider reutilizable para separar secciones con una línea decorativa y un mensaje central.
 */

import React from "react";

/*
 * Renderiza una línea divisoria con el texto "MEMENTO MORI" en el centro.
 */
export const Divider = () => (
  <div className="w-full flex items-center justify-center my-20">
    {/* Línea izquierda */}
    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
    {/* Mensaje central */}
    <div className="mx-4 text-zinc-800 italic font-ritual text-xs">
      MEMENTO MORI
    </div>
    {/* Línea derecha */}
    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
  </div>
);
