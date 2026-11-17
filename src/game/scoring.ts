// Rarity tiers and points.
// Until real player answers exist, rarity is estimated from how many Wikipedia
// language editions have an article about the book.

export type Tier = 0 | 1 | 2 | 3 | 4;

export const TIER_POINTS: Record<Tier, number> = { 0: 0, 1: 10, 2: 25, 3: 55, 4: 100 };
export const TIER_LABEL: Record<Tier, string> = { 0: "doesn't fit", 1: 'common', 2: 'uncommon', 3: 'rare', 4: 'very rare' };
export const TIER_EMOJI: Record<Tier, string> = { 0: '⬜', 1: '🟨', 2: '🟧', 3: '🟥', 4: '🟪' };

/** Wikipedia editions → tier. Tuned on the catalogue's distribution. */
export const POPULARITY_TIERS: [number, Tier][] = [
  [30, 1],
  [12, 2],
  [5, 3],
  [0, 4],
];

export function tierFromPopularity(editions: number): Tier {
  for (const [min, tier] of POPULARITY_TIERS) if (editions >= min) return tier;
  return 4;
}

export const PROMPTS_PER_DAY = 7;
export const MAX_POINTS = PROMPTS_PER_DAY * TIER_POINTS[4];
