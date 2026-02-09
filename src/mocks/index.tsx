
import React from "react";
import { Zap, Skull, Shield, Crown } from "lucide-react";
import { ShopItem, SocialPost } from "../types";

export const MOCK_SHOP_ITEMS: ShopItem[] = [
  {
    id: "1",
    name: "Katana Digital",
    description: "Una insignia de honor para los disciplinados digitalmente.",
    cost: 500,
    icon: <Zap size={40} />,
    rarity: "rare",
  },
  {
    id: "2",
    name: "Calavera Neón",
    description: "Otorga acceso al círculo interno del aquelarre.",
    cost: 1500,
    icon: <Skull size={40} />,
    rarity: "legendary",
  },
  {
    id: "3",
    name: "Voluntad de Hierro",
    description: "Prueba de una racha de 30 días.",
    cost: 300,
    icon: <Shield size={40} />,
    rarity: "common",
  },
  {
    id: "4",
    name: "Corona del Silencio",
    description: "Para aquellos que dominan el arte del trabajo profundo.",
    cost: 5000,
    icon: <Crown size={40} />,
    rarity: "legendary",
  },
];

export const MOCK_POSTS: SocialPost[] = [
  {
    id: "1",
    author: "NeonSamurai",
    content:
      "Acabo de completar el protocolo de las 5AM por 30 días seguidos. Mi concentración es láser.",
    timestamp: "hace 2h",
    likes: 42,
    isSystem: false,
  },
  {
    id: "2",
    author: "Sistema",
    content: "El usuario @GhostWalker ha ascendido al Rango: Adepto.",
    timestamp: "hace 4h",
    likes: 128,
    isSystem: true,
  },
  {
    id: "3",
    author: "CyberMonk",
    content:
      "Sacrifiqué 4 horas de gaming por programación. El flujo de esencia es real.",
    timestamp: "hace 6h",
    likes: 15,
    isSystem: false,
  },
];
