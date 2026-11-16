export interface Rank {
  title: string;
  current: number;
  next: number;
}

const RANKS: Array<{ min: number; title: string; next: number }> = [
  { min: 0, title: "Initiate", next: 100 },
  { min: 100, title: "Neophyte", next: 500 },
  { min: 500, title: "Adept", next: 1000 },
  { min: 1000, title: "Warlock", next: 2500 },
  { min: 2500, title: "Lich", next: 5000 },
  { min: 5000, title: "Demi-God", next: 10000 },
];

export function getRank(essence: number): Rank {
  const rank = [...RANKS].reverse().find((entry) => essence >= entry.min) ?? RANKS[0]!;
  return { title: rank.title, current: rank.min, next: rank.next };
}
