export type Difficulty = "Novato" | "Intermedio" | "Maestro";
export type Rarity = "common" | "rare" | "legendary";

export interface UserProfile {
    id: string;
    username: string;
    essence: number;
    rank: string;
    inventory: string[];
    avatar_url?: string;
    created_at: string;
}

export interface Ritual {
    id: string;
    user_id: string;
    title: string;
    description: string;
    difficulty: Difficulty;
    streak: number;
    essence_reward: number;
    is_completed_today: boolean;
    created_at: string;
}

export interface RitualLog {
    id: string;
    ritual_id: string;
    user_id: string;
    date: string; 
    essence_gained: number;
}

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    icon: string; 
    rarity: Rarity;
}