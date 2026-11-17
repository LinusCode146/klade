// The library's floors, depth scale and facts along the descent.
// Depth is measured in art pixels below street level (y = 0).

export type Style =
  | 'bestseller' | 'fiction' | 'reference' | 'periodicals' | 'closed'
  | 'archive' | 'rare' | 'vault' | 'scriptorium' | 'catacombs' | 'alexandria';

export interface Floor {
  code: string;
  name: string;
  style: Style;
  /** top edge in art px */
  top: number;
  /** wall colour */
  wall: string;
  /** accent for the ruler and banner */
  accent: string;
}

const F = (code: string, name: string, style: Style, top: number, wall: string, accent: string): Floor => ({
  code, name, style, top, wall, accent,
});

export const FLOORS: Floor[] = [
  F('B1', 'Bestseller Hall', 'bestseller', 0, '#efe2c4', '#e8b64a'),
  F('B2', 'Fiction A–Z', 'fiction', 230, '#c9a57a', '#d9774a'),
  F('B3', 'Reference', 'reference', 520, '#9a8a6e', '#4a7a5a'),
  F('B4', 'Periodicals & Microfilm', 'periodicals', 780, '#8d9296', '#6a8aa8'),
  F('B5', 'Closed Stacks', 'closed', 1010, '#6d7268', '#9aa58a'),
  F('B6', 'The Archive', 'archive', 1260, '#6a5d4d', '#c4a06a'),
  F('B7', 'Rare Books Room', 'rare', 1500, '#5e2126', '#d8a94a'),
  F('B8', 'The Forgotten Vault', 'vault', 1770, '#3f3832', '#a39a8a'),
  F('B9', 'Medieval Scriptorium', 'scriptorium', 2030, '#5a544c', '#c9a15a'),
  F('B10', 'Catacombs of Lost Books', 'catacombs', 2310, '#3a3430', '#8a7a6a'),
  F('B11', 'Library of Alexandria', 'alexandria', 2600, '#a7824f', '#f0b04a'),
];

export const MAX_DEPTH = 2900;
/** Metres per art pixel, for display */
export const METRES_PER_PX = 1 / 6;

export function floorAt(depth: number): Floor {
  let f = FLOORS[0];
  for (const fl of FLOORS) if (depth >= fl.top) f = fl;
  return f;
}

export function floorBottom(f: Floor): number {
  const i = FLOORS.indexOf(f);
  return i + 1 < FLOORS.length ? FLOORS[i + 1].top : MAX_DEPTH + 60;
}

export const formatDepth = (depth: number) => `${Math.round(depth * METRES_PER_PX).toLocaleString('en-US')} m`;

export interface Fact {
  depth: number;
  text: string;
  major?: boolean;
}

export const FACTS: Fact[] = [
  { depth: 60, text: 'The Bible: an estimated five billion copies printed' },
  { depth: 150, text: 'Harry Potter has sold over 600 million copies' },
  { depth: 230, text: 'Fiction, shelved A to Z', major: true },
  { depth: 330, text: 'Moby-Dick sold about 3,000 copies in Melville\'s lifetime' },
  { depth: 440, text: 'The Great Gatsby sold fewer than 25,000 copies in its first year' },
  { depth: 520, text: 'Dewey Decimal System, 1876', major: true },
  { depth: 650, text: 'The Library of Congress holds over 170 million items' },
  { depth: 780, text: 'Microfilm: built to last 500 years', major: true },
  { depth: 1010, text: 'Closed stacks: staff only beyond this point', major: true },
  { depth: 1130, text: 'Compact shelving glides on rails to save space' },
  { depth: 1260, text: 'Hemingway lost a suitcase of manuscripts in 1922', major: true },
  { depth: 1380, text: 'Old-book smell is the scent of paper slowly breaking down' },
  { depth: 1500, text: 'Rare Books — white gloves, please', major: true },
  { depth: 1620, text: 'About 49 Gutenberg Bibles survive' },
  { depth: 1700, text: 'Leonardo\'s Codex Leicester sold for $30.8 million' },
  { depth: 1770, text: 'Out of print, out of mind', major: true },
  { depth: 1900, text: 'Shakespeare\'s Cardenio: a play lost entirely' },
  { depth: 2030, text: 'Here books were copied by hand', major: true },
  { depth: 2140, text: 'Chained libraries kept books from walking off' },
  { depth: 2230, text: 'The Book of Kells, around 800 AD' },
  { depth: 2310, text: 'The catacombs: where lost books go', major: true },
  { depth: 2420, text: 'The Diamond Sutra, 868 AD — the oldest dated printed book' },
  { depth: 2520, text: 'The Voynich Manuscript: still undeciphered' },
  { depth: 2600, text: 'The Library of Alexandria', major: true },
  { depth: 2740, text: 'The Epic of Gilgamesh — over 4,000 years old' },
  { depth: 2900, text: 'A perfect descent ends here', major: true },
];

export type DecorName =
  | 'lamp' | 'plant' | 'ladder' | 'globe' | 'reader' | 'catalog' | 'case'
  | 'cobweb' | 'candle' | 'lectern' | 'pile' | 'torch' | 'amphora' | 'sign';

/** Decor placed on the floor of a level: [sprite, floor index, horizontal position 0..1] */
export const DECOR: [DecorName, number, number][] = [
  ['plant', 0, 0.08], ['lamp', 0, 0.3], ['lamp', 0, 0.7], ['plant', 0, 0.93],
  ['ladder', 1, 0.22], ['lamp', 1, 0.78],
  ['globe', 2, 0.2], ['lectern', 2, 0.8],
  ['reader', 3, 0.25], ['lamp', 3, 0.75],
  ['sign', 4, 0.2], ['ladder', 4, 0.82],
  ['catalog', 5, 0.18], ['catalog', 5, 0.86],
  ['case', 6, 0.2], ['case', 6, 0.8],
  ['cobweb', 7, 0.04], ['pile', 7, 0.26], ['candle', 7, 0.74], ['cobweb', 7, 0.96],
  ['lectern', 8, 0.22], ['candle', 8, 0.78],
  ['pile', 9, 0.2], ['pile', 9, 0.85], ['candle', 9, 0.65],
  ['torch', 10, 0.12], ['amphora', 10, 0.3], ['amphora', 10, 0.72], ['torch', 10, 0.9],
];

export type TrophyName = 'book' | 'magazine' | 'box' | 'tome' | 'scroll';

/** The keepsake shown on the result card */
export const FLOOR_TROPHY: Record<Style, TrophyName> = {
  bestseller: 'book', fiction: 'book', reference: 'book', periodicals: 'magazine', closed: 'book',
  archive: 'box', rare: 'tome', vault: 'tome', scriptorium: 'tome', catacombs: 'tome', alexandria: 'scroll',
};
