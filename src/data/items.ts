/*
 * items.ts
 * 
 * Define los objetos disponibles en la tienda de la aplicación y sus propiedades.
 * Cada objeto tiene efecto, costo, rareza y un icono visual representativo.
 */

import { ShopItem } from "@/types";
import { FlaskConical, Scroll, Skull } from "lucide-react";
import React from "react";

// Lista de ítems de la tienda con sus efectos y características
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "potion_discipline",
    name: "Elixir de Disciplina",
    description: "Otorga +50% de Esencia ganada durante 24 horas. El sabor es metálico y frío.",
    cost: 500,
    rarity: "rare",
    icon: React.createElement(FlaskConical, { size: 40, className: "text-blue-500" }),
    effectType: "essence_boost",
    effectValue: 1.5,
    duration: 24 * 60 * 60 * 1000, // 24 horas
  },
  {
    id: "potion_oblivion",
    name: "Poción de Olvido",
    description: "Restaura una racha perdida si se consume antes del amanecer siguiente. Borra el fracaso.",
    cost: 1000,
    rarity: "legendary",
    icon: React.createElement(FlaskConical, { size: 40, className: "text-purple-500" }),
    effectType: "restore_streak",
    duration: 0, // Uso instantáneo
  },
  {
    id: "shadow_amulet",
    name: "Amuleto de Sombra",
    description: "Un objeto cosmético que oscurece tu perfil. Los demás verán tu compromiso con el vacío.",
    cost: 2500,
    rarity: "rare",
    icon: React.createElement(Skull, { size: 40, className: "text-zinc-400" }),
    effectType: "cosmetic",
    duration: -1, // Permanente
  },
  {
    id: "binding_contract",
    name: "Contrato Vinculante",
    description: "Desbloquea rituales de nivel maestro. Una vez firmado, no hay vuelta atrás.",
    cost: 5000,
    rarity: "legendary",
    icon: React.createElement(Scroll, { size: 40, className: "text-red-500" }),
    effectType: "unlock_master",
    duration: -1, // Permanente
  },
];
