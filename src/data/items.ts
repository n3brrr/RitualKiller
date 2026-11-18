import { createElement, type ReactNode } from 'react'
import { FlaskConical, Package, Scroll, Skull } from 'lucide-react'

/**
 * Visual identity of each shop item. Prices, rarity and effects come from the
 * shop_items table and names/descriptions from i18n (shopItemKey), so this is
 * the only item data kept in the client.
 */
const ICONS: Record<string, ReactNode> = {
  potion_discipline: createElement(FlaskConical, {
    size: 40,
    className: 'text-blue-500',
  }),
  potion_oblivion: createElement(FlaskConical, {
    size: 40,
    className: 'text-purple-500',
  }),
  shadow_amulet: createElement(Skull, { size: 40, className: 'text-zinc-400' }),
  binding_contract: createElement(Scroll, {
    size: 40,
    className: 'text-red-500',
  }),
}

const FALLBACK_ICON = createElement(Package, {
  size: 40,
  className: 'text-zinc-400',
})

export function shopItemIcon(id: string): ReactNode {
  return ICONS[id] ?? FALLBACK_ICON
}
