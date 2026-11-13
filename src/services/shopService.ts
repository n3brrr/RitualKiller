import { supabase } from "@/lib/supabase";
import type { ActiveBuff } from "@/types";

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

export interface PurchaseResult {
  success: boolean;
  reason?: string;
  essence?: number;
}

export const shopService = {
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

  async consume(itemId: string): Promise<{ success: boolean; reason?: string }> {
    const { data, error } = await supabase.rpc("consume_item", { p_item_id: itemId });
    if (error) throw error;
    return data as { success: boolean; reason?: string };
  },
};
