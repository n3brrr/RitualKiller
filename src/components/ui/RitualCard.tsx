import React from "react";

interface CardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
}

export const RitualCard = ({
  title,
  description,
  icon,
  className = "",
}: CardProps) => {
  return (
    <div
      className={`p-8 bg-zinc-950 border border-zinc-900 hover:border-ritual-accent/40 transition-all duration-500 group relative ${className}`}
    >
      {/* Esquina decorativa gótica */}
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-ritual-accent/0 group-hover:border-ritual-accent/100 transition-all duration-500" />

      {icon && (
        <div className="text-ritual-accent mb-4 transform group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
      )}

      <h3 className="font-ritual text-xl uppercase mb-2 tracking-widest">
        {title}
      </h3>
      <p className="text-zinc-500 font-light leading-relaxed">{description}</p>
    </div>
  );
};
