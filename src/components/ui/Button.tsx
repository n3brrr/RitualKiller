/**
 * Button.tsx
 * 
 * Componente reutilizable de botón animado utilizando framer-motion.
 * Permite variar su estilo mediante la prop 'variant' y acepta clases adicionales.
 */

import React from "react";
import { motion } from "framer-motion";

interface ButtonProps {
  children: React.ReactNode; 
  onClick?: () => void;      
  variant?: "primary" | "ghost"; 
  className?: string;       
}

// Componente principal Button
export const Button = ({
  children,
  onClick,
  variant = "primary",
  className = "",
}: ButtonProps) => {

  const variants = {
    primary:
      "bg-transparent border border-ritual-accent text-ritual-accent hover:text-black",
    ghost:
      "bg-transparent border border-zinc-800 text-zinc-500 hover:border-white hover:text-white",
  };

  const baseStyles = "px-4 py-2 rounded-lg";

  return (
    <motion.button
      whileHover={{ scale: 1.05 }} 
      whileTap={{ scale: 0.95 }}   
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {/* Efecto visual animado de fondo (puede aprovecharse con 'group' en el padre) */}
      <span className="absolute inset-0 w-0 bg-ritual-accent transition-all duration-500 group-hover:w-full -z-10"></span>
      {/* Contenido del botón */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

export default Button;
