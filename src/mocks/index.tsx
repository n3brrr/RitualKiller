import React from "react";
import { Zap, Skull, Shield, Crown } from "lucide-react";
import { ShopItem, SocialPost } from "../types";

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
