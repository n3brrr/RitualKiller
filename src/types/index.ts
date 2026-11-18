export type Difficulty = "novice" | "adept" | "master";
export type Rarity = "common" | "rare" | "legendary";
export type Frequency = "daily" | "weekly";
export type Locale = "es" | "en";

export interface User {
  id: string;
  username: string;
  essence: number;
  /** Essence earned over time (never reduced by shop purchases); drives the rank. */
  lifetimeEssence: number;
  rank: string;
  inventory: string[];
  avatar_url?: string | null;
  locale: Locale;
  created_at: string;
  isAdmin: boolean;
  active_buffs: ActiveBuff[];
  /** While in the future the user cannot post, comment, report or follow. */
  suspendedUntil: string | null;
}

/** What other users can see (public_profiles view). */
export interface PublicProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
  essence: number;
  rank: string;
  createdAt: string;
  shadowAmulet: boolean;
  bestStreak: number;
  activeRituals: number;
  achievements: number;
  followers: number;
  following: number;
}

export interface ActiveBuff {
  id: string;
  itemId: string;
  expiresAt: number;
  multiplier: number;
}

export interface Ritual {
  id: string;
  user_id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  frequency: Frequency;
  /** Live streak computed by the server (0 once a full period was missed). */
  streak: number;
  bestStreak: number;
  essenceReward: number;
  created_at: string;
}

export interface RitualLog {
  id: string;
  ritualId: string;
  user_id: string;
  date: string;
  essence_gained: number;
  /** Day filled by the Potion of Oblivion: keeps the streak, not a completion. */
  protected: boolean;
}

export type ShopEffect =
  "essence_boost" | "restore_streak" | "cosmetic" | "unlock_master";

/** Catalogue row from the shop_items table (names are translated by the client). */
export interface ShopItem {
  id: string;
  cost: number;
  rarity: Rarity;
  effectType: ShopEffect | null;
  effectValue: number | null;
  /** Consumable items are used from the inventory; passive ones work while owned. */
  consumable: boolean;
}

export interface SocialPost {
  id: string;
  authorId: string;
  author: string;
  authorAvatar?: string | null;
  content: string;
  likes: number;
  createdAt: string;
  isSystem: boolean;
  likedByMe: boolean;
  comments: Comment[];
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: string;
}

/** Name and description are translated with achievementKey(id, field). */
export interface Achievement {
  id: string;
  icon: string;
  rarity: Rarity;
  unlockedAt?: string;
  progress: number;
  target: number;
  category: "streak" | "essence" | "rituals" | "social" | "special";
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

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface UserSettings {
  userId: string;
  notificationsEnabled: boolean;
  reminderTime: string;
  timezone: string;
}

export interface ProductivityMetrics {
  dailyEfficiency: number;
  weeklyEfficiency: number;
  averageCompletionRate: number;
  bestDay: string;
  ritualsCompleted: number;
  streakDays: number;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  postId?: string | null;
  targetUserId?: string | null;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: string;
  /** Content and people involved, so moderators can act without guessing. */
  postContent: string | null;
  reportedUserId: string | null;
  reportedUserName: string | null;
  reportedSuspendedUntil: string | null;
}

export interface AdminMetrics {
  users: number;
  rituals: number;
  completions: number;
  activeUsers7d: number;
  pendingReports: number;
}

export interface AdminUser {
  id: string;
  username: string;
  essence: number;
  isAdmin: boolean;
  createdAt: string;
  suspendedUntil: string | null;
}
