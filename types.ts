export interface User {
  id: string;
  username: string;
  essence: number; // Currency
  inventory: string[];
}

export interface Ritual {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly';
  difficulty: 'novice' | 'adept' | 'master';
  essenceReward: number;
  streak: number;
}

export interface RitualLog {
  id: string;
  ritualId: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  rarity: 'common' | 'rare' | 'legendary';
}

export interface SocialPost {
  id: string;
  author: string;
  content: string;
  likes: number;
  timestamp: string;
  isSystem?: boolean; // Auto-generated achievement
}
