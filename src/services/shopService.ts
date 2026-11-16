import { supabase } from "@/lib/supabase";
import type { ActiveBuff, Rarity, ShopEffect, ShopItem } from "@/types";

interface InventoryRow {
  item_id: string;
  quantity: number;
}

interface BuffRow {
  id: string;
  item_id: string;
  multiplier: number;
  expires_at: string;
}

interface ShopItemRow {
  id: string;
  cost: number;
  rarity: Rarity;
  effect_type: ShopEffect | null;
  effect_value: number | string | null;
  consumable: boolean;
}

export interface PurchaseResult {
  success: boolean;
  reason?: string;
  essence?: number;
}

export interface ConsumeResult {
  success: boolean;
  reason?: string;
  restored?: number;
}

export const shopService = {
  /** The catalogue (prices, rarity, effects) is owned by the database. */
  async listItems(): Promise<ShopItem[]> {
    const { data, error } = await supabase
      .from("shop_items")
      .select("id, cost, rarity, effect_type, effect_value, consumable")
      .order("cost", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as ShopItemRow[]).map((row) => ({
      id: row.id,
      cost: row.cost,
      rarity: row.rarity,
      effectType: row.effect_type,
      effectValue: row.effect_value === null ? null : Number(row.effect_value),
      consumable: row.consumable,
    }));
  },

  async getInventory(
    userId: string,
  ): Promise<{ quantities: Record<string, number>; buffs: ActiveBuff[] }> {
    const [inventoryResult, buffsResult] = await Promise.all([
      supabase.from("inventory").select("item_id, quantity").eq("user_id", userId),
      supabase
        .from("active_buffs")
        .select("id, item_id, multiplier, expires_at")
        .eq("user_id", userId)
        .gt("expires_at", new Date().toISOString()),
    ]);

    if (inventoryResult.error) throw inventoryResult.error;
    if (buffsResult.error) throw buffsResult.error;

    const quantities: Record<string, number> = {};
    for (const row of (inventoryResult.data ?? []) as InventoryRow[]) {
      quantities[row.item_id] = row.quantity;
    }

    return {
      quantities,
      buffs: ((buffsResult.data ?? []) as BuffRow[]).map((buff) => ({
        id: buff.id,
        itemId: buff.item_id,
        expiresAt: new Date(buff.expires_at).getTime(),
        multiplier: Number(buff.multiplier),
      })),
    };
  },

  async purchase(itemId: string): Promise<PurchaseResult> {
    const { data, error } = await supabase.rpc("purchase_item", { p_item_id: itemId });
    if (error) throw error;
    return data as PurchaseResult;
  },

  async consume(itemId: string): Promise<ConsumeResult> {
    const { data, error } = await supabase.rpc("consume_item", { p_item_id: itemId });
    if (error) throw error;
    return data as ConsumeResult;
  },
};
