import React from "react";
import { Zap, Skull, Shield, Crown } from "lucide-react";
import { ShopItem, SocialPost } from "../types";

export const MOCK_SHOP_ITEMS: ShopItem[] = [
  {
    id: "1",
    name: "Digital Katana",
    description: "A badge of honor for the digitally disciplined.",
    cost: 500,
    icon: <Zap size={40} />,
    rarity: "rare",
  },
  {
    id: "2",
    name: "Neon Skull",
    description: "Grants access to the inner circle of the coven.",
    cost: 1500,
    icon: <Skull size={40} />,
    rarity: "legendary",
  },
  {
    id: "3",
    name: "Iron Will",
    description: "Proof of a 30-day streak.",
    cost: 300,
    icon: <Shield size={40} />,
    rarity: "common",
  },
  {
    id: "4",
    name: "Crown of Silence",
    description: "For those who master the art of deep work.",
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
      "Just completed the 5AM protocol for 30 days straight. My focus is laser sharp.",
    timestamp: "2h ago",
    likes: 42,
    isSystem: false,
  },
  {
    id: "2",
    author: "System",
    content: "User @GhostWalker has ascended to Rank: Adept.",
    timestamp: "4h ago",
    likes: 128,
    isSystem: true,
  },
  {
    id: "3",
    author: "CyberMonk",
    content:
      "Sacrificed 4 hours of gaming for coding. The essence flow is real.",
    timestamp: "6h ago",
    likes: 15,
    isSystem: false,
  },
];
