// Beispiel-Fragen für den Prototyp. Seltenheit ist hier von Hand geschätzt:
// 1 = häufig, 2 = gelegentlich, 3 = selten, 4 = sehr selten.
// Später kommt sie aus Bekanntheitsdaten und echten Spielerantworten.

export type Tier = 0 | 1 | 2 | 3 | 4;
export const TIER_POINTS: Record<Tier, number> = { 0: 0, 1: 10, 2: 25, 3: 55, 4: 100 };
export const TIER_LABEL: Record<Tier, string> = {
  0: 'zählt nicht',
  1: 'häufig',
  2: 'gelegentlich',
  3: 'selten',
  4: 'sehr selten',
};
export const TIER_EMOJI: Record<Tier, string> = { 0: '⬜', 1: '🟫', 2: '🟧', 3: '🟥', 4: '🟪' };

export interface Prompt {
  text: string;
  /** Antwort → Stufe. Mehrere Schreibweisen mit | trennen. */
  answers: Record<string, Tier>;
}

export const PROMPTS: Prompt[] = [
  {
    text: 'Nenne ein Säugetier, das im Meer lebt',
    answers: {
      'delfin|delphin': 1, 'wal|blauwal': 1, 'robbe|seehund': 1, 'orca|schwertwal': 2, 'seelöwe': 2,
      'walross': 2, 'pottwal': 2, 'buckelwal': 2, 'narwal': 3, 'seekuh|manati|dugong|gabelschwanzseekuh': 3,
      'seeotter': 3, 'beluga|belugawal|weißwal': 3, 'schweinswal': 3, 'see-elefant|seeelefant': 3,
      'vaquita|kalifornischer schweinswal': 4, 'eisbär': 4,
    },
  },
  {
    text: 'Nenne ein Tier, das fliegen kann, aber kein Vogel ist',
    answers: {
      'fledermaus': 1, 'biene|honigbiene': 1, 'schmetterling': 1, 'fliege|stubenfliege': 1, 'mücke': 1,
      'wespe': 1, 'libelle': 2, 'marienkäfer': 2, 'hummel': 2, 'maikäfer': 2, 'motte|nachtfalter': 2,
      'flughund': 3, 'heuschrecke|wanderheuschrecke': 3, 'hornisse': 2, 'glühwürmchen': 3,
      'flugfisch|fliegender fisch': 4, 'flugdrache': 4, 'gottesanbeterin': 4,
    },
  },
  {
    text: 'Nenne ein Tier mit mehr als sechs Beinen',
    answers: {
      'spinne': 1, 'tausendfüßer|tausendfüßler': 1, 'krake|oktopus': 1, 'krabbe': 2, 'hummer': 2,
      'skorpion': 2, 'hundertfüßer|hundertfüßler': 2, 'assel|kellerassel': 3, 'garnele|shrimp': 3,
      'zecke': 3, 'milbe': 3, 'flusskrebs|krebs': 3, 'pfeilschwanzkrebs': 4, 'bärtierchen': 4,
      'tintenfisch|kalmar': 2,
    },
  },
  {
    text: 'Nenne ein Tier, das in der Antarktis lebt',
    answers: {
      'pinguin|kaiserpinguin': 1, 'robbe': 2, 'krill': 2, 'orca|schwertwal': 2, 'seeleopard': 3,
      'buckelwal': 3, 'albatros': 3, 'adeliepinguin|adeliepinguin': 3, 'königspinguin': 3,
      'weddellrobbe': 4, 'eisfisch': 4, 'krabbenfresser': 4, 'antarktischer zwergmücke|belgica': 4,
    },
  },
  {
    text: 'Nenne ein Reptil',
    answers: {
      'schlange': 1, 'krokodil': 1, 'schildkröte': 1, 'eidechse': 1, 'chamäleon': 2, 'leguan': 2,
      'gecko': 2, 'alligator': 2, 'kobra': 2, 'python': 2, 'komodowaran|waran': 3, 'blindschleiche': 3,
      'kreuzotter': 3, 'zauneidechse': 3, 'brückenechse|tuatara': 4, 'gavial': 4, 'krustenechse': 4,
    },
  },
  {
    text: 'Nenne ein Wildtier, das in Deutschland heimisch ist',
    answers: {
      'fuchs': 1, 'reh': 1, 'igel': 1, 'wildschwein': 1, 'eichhörnchen': 1, 'hase|feldhase': 1,
      'dachs': 2, 'biber': 2, 'wolf': 2, 'rothirsch|hirsch': 2, 'luchs': 3, 'feldhamster|hamster': 3,
      'wildkatze': 3, 'siebenschläfer': 3, 'feuersalamander': 3, 'fischotter': 3,
      'gartenschläfer': 4, 'ziesel': 4, 'elch': 4, 'goldschakal': 4,
    },
  },
  {
    text: 'Nenne ein Tier, das schon zur Zeit der Dinosaurier lebte',
    answers: {
      'krokodil': 1, 'hai': 1, 'schildkröte': 2, 'kakerlake|schabe': 2, 'libelle': 2, 'biene': 3,
      'ameise': 3, 'quastenflosser': 3, 'nautilus': 3, 'skorpion': 3, 'pfeilschwanzkrebs': 4,
      'brückenechse|tuatara': 4, 'stör': 4, 'schnabeltier': 4, 'hatteria': 4,
    },
  },
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/^(der|die|das|ein|eine)\s+/, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ');

export function judge(prompt: Prompt, input: string): { tier: Tier; canonical: string } {
  const n = norm(input);
  if (!n) return { tier: 0, canonical: input };
  for (const [keys, tier] of Object.entries(prompt.answers)) {
    const variants = keys.split('|');
    if (variants.some((v) => norm(v) === n)) {
      const c = variants[0];
      return { tier, canonical: c.charAt(0).toUpperCase() + c.slice(1) };
    }
  }
  return { tier: 0, canonical: input.trim() };
}

export const MAX_POINTS = PROMPTS.length * TIER_POINTS[4];
