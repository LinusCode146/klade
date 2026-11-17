// Erdzeitalter, Tiefen-Abbildung und Fakten entlang der Grabung.

export type Pattern = 'soil' | 'speckle' | 'bands' | 'coal' | 'bif' | 'chalk' | 'magma';

export interface Era {
  name: string;
  /** Beginn (älter), in Mio. Jahren */
  start: number;
  /** Ende (jünger), in Mio. Jahren */
  end: number;
  base: string;
  alt: string;
  pattern: Pattern;
  bandH?: number;
}

// Von jung nach alt. Farben bewusst als Gesteinstöne gewählt, nicht die ICS-Signalfarben.
export const ERAS: Era[] = [
  { name: 'Quartär', end: 0, start: 2.58, base: '#5b3d27', alt: '#704b31', pattern: 'soil' },
  { name: 'Neogen', end: 2.58, start: 23.03, base: '#a07848', alt: '#b88d58', pattern: 'speckle' },
  { name: 'Paläogen', end: 23.03, start: 66, base: '#b5793e', alt: '#c78c4d', pattern: 'bands', bandH: 6 },
  { name: 'Kreide', end: 66, start: 145, base: '#d9d2bd', alt: '#c7bfa6', pattern: 'chalk' },
  { name: 'Jura', end: 145, start: 201.4, base: '#8c98a0', alt: '#79858e', pattern: 'bands', bandH: 4 },
  { name: 'Trias', end: 201.4, start: 251.9, base: '#a3473a', alt: '#b85a45', pattern: 'bands', bandH: 5 },
  { name: 'Perm', end: 251.9, start: 298.9, base: '#7d6a62', alt: '#8e5a4a', pattern: 'speckle' },
  { name: 'Karbon', end: 298.9, start: 358.9, base: '#47423d', alt: '#1d1b1a', pattern: 'coal' },
  { name: 'Devon', end: 358.9, start: 419.2, base: '#8a4b38', alt: '#9d5b43', pattern: 'speckle' },
  { name: 'Silur', end: 419.2, start: 443.8, base: '#6f7d62', alt: '#5f6c53', pattern: 'bands', bandH: 3 },
  { name: 'Ordovizium', end: 443.8, start: 485.4, base: '#4f6457', alt: '#5e7465', pattern: 'speckle' },
  { name: 'Kambrium', end: 485.4, start: 538.8, base: '#6b6a48', alt: '#7c7b56', pattern: 'bands', bandH: 4 },
  { name: 'Proterozoikum', end: 538.8, start: 2500, base: '#5b4f52', alt: '#9a3a2c', pattern: 'bif' },
  { name: 'Archaikum', end: 2500, start: 4031, base: '#3a4a42', alt: '#2c3832', pattern: 'speckle' },
  { name: 'Hadaikum', end: 4031, start: 4567, base: '#3a1612', alt: '#c2401a', pattern: 'magma' },
];

export const EARTH_AGE = 4567;

// Nicht-lineare Zeitachse: die jungen Zeitalter werden gedehnt, damit es oben viel zu sehen gibt.
const K = 1300;
const S = 20;
export const ageToDepth = (age: number) => K * Math.log10(1 + age / S);
export const depthToAge = (depth: number) => S * (Math.pow(10, depth / K) - 1);
export const MAX_DEPTH = Math.round(ageToDepth(EARTH_AGE));

export function eraAtAge(age: number): Era {
  for (const e of ERAS) if (age <= e.start) return e;
  return ERAS[ERAS.length - 1];
}

export interface Fact {
  age: number;
  text: string;
  /** Hervorgehobene Grenze (Großbuchstaben, eigene Linie) */
  major?: boolean;
}

export const FACTS: Fact[] = [
  { age: 0.3, text: 'Homo sapiens erscheint — 300.000 J.' },
  { age: 2.58, text: 'Beginn der Eiszeiten', major: true },
  { age: 6.5, text: 'Mensch und Schimpanse gehen getrennte Wege' },
  { age: 23, text: 'Grasland erobert die Kontinente' },
  { age: 48, text: 'Urwale laufen noch auf vier Beinen' },
  { age: 66, text: 'Hier starben die Dinosaurier aus', major: true },
  { age: 85, text: 'T. rex? Noch 17 Mio. Jahre bis zu seinem Auftritt' },
  { age: 130, text: 'Die ersten Blüten öffnen sich' },
  { age: 150, text: 'Archaeopteryx flattert durch Bayern' },
  { age: 201.4, text: 'Massensterben am Ende der Trias', major: true },
  { age: 231, text: 'Die ersten Dinosaurier' },
  { age: 251.9, text: 'Das große Sterben: 9 von 10 Arten verschwinden', major: true },
  { age: 300, text: 'Libellen mit 70 cm Spannweite' },
  { age: 358.9, text: 'Riesige Sumpfwälder werden zu Kohle', major: true },
  { age: 375, text: 'Tiktaalik kriecht ans Ufer' },
  { age: 443.8, text: 'Das erste große Massensterben', major: true },
  { age: 470, text: 'Erste Pflanzen wagen sich an Land' },
  { age: 520, text: 'Trilobiten überall' },
  { age: 538.8, text: 'Kambrische Explosion', major: true },
  { age: 680, text: 'Schneeball Erde: alles unter Eis' },
  { age: 1800, text: 'Erste Zellen mit Zellkern' },
  { age: 2400, text: 'Bakterien füllen die Luft mit Sauerstoff' },
  { age: 3500, text: 'Stromatolithen: die ältesten Fossilien' },
  { age: 4031, text: 'Die junge Erde glüht', major: true },
  { age: 4400, text: 'Die ältesten Kristalle der Erde' },
  { age: 4567, text: 'Die Erde entsteht — eine perfekte Grabung endet hier', major: true },
];

export type SpriteName =
  | 'worm' | 'tusk' | 'bone' | 'skull' | 'ammonite' | 'fern' | 'dragonfly'
  | 'fish' | 'trilobite' | 'stromatolite' | 'crinoid';

/** Fossilien im Querschnitt: [Sprite, Alter in Mio. J., horizontale Lage 0..1] */
export const FOSSILS: [SpriteName, number, number][] = [
  ['worm', 0.02, 0.2], ['worm', 0.05, 0.78], ['worm', 0.12, 0.36],
  ['tusk', 0.9, 0.7], ['bone', 1.6, 0.18],
  ['bone', 9, 0.82], ['tusk', 14, 0.26],
  ['bone', 35, 0.72], ['bone', 52, 0.15],
  ['skull', 70, 0.22], ['ammonite', 95, 0.76], ['bone', 120, 0.34], ['ammonite', 135, 0.12],
  ['ammonite', 165, 0.68], ['fern', 185, 0.2],
  ['bone', 225, 0.78], ['fern', 240, 0.3],
  ['fern', 275, 0.72],
  ['dragonfly', 310, 0.24], ['fern', 335, 0.8],
  ['fish', 385, 0.7], ['fish', 405, 0.2],
  ['crinoid', 430, 0.75],
  ['crinoid', 460, 0.22], ['trilobite', 475, 0.8],
  ['trilobite', 505, 0.28], ['trilobite', 525, 0.7], ['trilobite', 515, 0.84],
  ['stromatolite', 900, 0.75], ['stromatolite', 1600, 0.22], ['stromatolite', 3000, 0.7], ['stromatolite', 3450, 0.3],
];

/** Das Fundstück für das Ergebnis: typisches Fossil des erreichten Zeitalters */
export const ERA_TROPHY: Record<string, SpriteName> = {
  'Quartär': 'tusk', 'Neogen': 'tusk', 'Paläogen': 'bone', 'Kreide': 'skull', 'Jura': 'ammonite',
  'Trias': 'bone', 'Perm': 'fern', 'Karbon': 'dragonfly', 'Devon': 'fish', 'Silur': 'crinoid',
  'Ordovizium': 'crinoid', 'Kambrium': 'trilobite', 'Proterozoikum': 'stromatolite',
  'Archaikum': 'stromatolite', 'Hadaikum': 'stromatolite',
};

export function formatAge(age: number): string {
  if (age < 0.001) return 'heute';
  if (age < 1) return `${Math.round(age * 1000).toLocaleString('de-DE')}.000 J.`;
  if (age >= 1000) return `${(age / 1000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mrd. J.`;
  return `${age.toLocaleString('de-DE', { maximumFractionDigits: age < 10 ? 1 : 0 })} Mio. J.`;
}
