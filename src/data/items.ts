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
    name: "Elixir of Discipline",
    description:
      "Grants +50% Essence gained for 24 hours. The taste is metallic and cold.",
    cost: 500,
    rarity: "rare",
    icon: React.createElement(FlaskConical, {
      size: 40,
      className: "text-blue-500",
    }),
    effectType: "essence_boost",
    effectValue: 1.5,
    duration: 24 * 60 * 60 * 1000, // 24 horas
  },
  {
    id: "potion_oblivion",
    name: "Potion of Oblivion",
    description:
      "Restores a lost streak if consumed before the next dawn. Erases failure.",
    cost: 1000,
    rarity: "legendary",
    icon: React.createElement(FlaskConical, {
      size: 40,
      className: "text-purple-500",
    }),
    effectType: "restore_streak",
    duration: 0, // Uso instantáneo
  },
  {
    id: "shadow_amulet",
    name: "Shadow Amulet",
    description:
      "A cosmetic item that darkens your profile. Others will see your commitment to the void.",
    cost: 2500,
    rarity: "rare",
    icon: React.createElement(Skull, { size: 40, className: "text-zinc-400" }),
    effectType: "cosmetic",
    duration: -1, // Permanente
  },
  {
    id: "binding_contract",
    name: "Binding Contract",
    description:
      "Unlocks master-level rituals. Once signed, there is no turning back.",
    cost: 5000,
    rarity: "legendary",
    icon: React.createElement(Scroll, { size: 40, className: "text-red-500" }),
    effectType: "unlock_master",
    duration: -1, // Permanente
  },
];
