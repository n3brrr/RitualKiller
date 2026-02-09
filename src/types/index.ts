export type Difficulty = "novice" | "adept" | "master";
export type Rarity = "common" | "rare" | "legendary";
export type Frequency = "daily" | "weekly";

export interface User {
    id: string;
    username: string;
    essence: number;
    rank: string;
    inventory: string[];
    avatar_url?: string;
    created_at: string;
    isAdmin?: boolean;
}

export interface Ritual {
    id: string;
    user_id: string;
    title: string;
    description: string;
    difficulty: Difficulty;
    frequency: Frequency;
    streak: number;
    essenceReward: number;
    is_completed_today?: boolean;
    created_at: string;
}

export interface RitualLog {
    id: string;
    ritualId: string;
    user_id: string;
    date: string;
    timestamp?: number;
    essence_gained?: number;
}

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    icon: React.ReactNode;
    rarity: Rarity;
}

export interface SocialPost {
    id: string;
    author: string;
    content: string;
    likes: number;
    timestamp: string;
    isSystem?: boolean;
    comments?: Comment[];
    authorId?: string;
}

export interface Comment {
    id: string;
    postId: string;
    author: string;
    authorId: string;
    content: string;
    timestamp: string;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: Rarity;
    unlockedAt?: string;
    progress: number;
    target: number;
    category: 'streak' | 'essence' | 'rituals' | 'social' | 'special';
}

export interface Goal {
    id: string;
    user_id: string;
    title: string;
    description: string;
    target_date: string;
    progress: number;
    target_value: number;
    ritual_ids: string[];
    created_at: string;
}

export interface UserFollow {
    id: string;
    follower_id: string;
    following_id: string;
    created_at: string;
}

export interface ProductivityMetrics {
    dailyEfficiency: number;
    weeklyEfficiency: number;
    averageCompletionRate: number;
    bestDay: string;
    totalTimeSpent: number;
    ritualsCompleted: number;
    streakDays: number;
}