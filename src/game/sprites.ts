// Handgezeichnete Pixel-Sprites als Zeichen-Raster. '.' = transparent.
import type { SpriteName } from './strata';

type Palette = Record<string, string>;

const FOSSIL: Palette = { a: '#3b2a1e', b: '#c9a679', c: '#ead2a6', d: '#8a6a48' };

interface SpriteDef { rows: string[]; pal: Palette }

const DEFS: Record<SpriteName | 'digger' | 'bucket' | 'tent' | 'flag', SpriteDef> = {
  worm: { pal: { a: '#d98b8b', b: '#b86a6f' }, rows: ['.aab..', 'a..baa'] },
  tusk: {
    pal: FOSSIL,
    rows: [
      'aaa...........',
      'acba..........',
      '.abbaa........',
      '..abbbaaa...aa',
      '...aabbbbaaaba',
      '.....aaabbbba.',
      '........aaaa..',
    ],
  },
  bone: {
    pal: FOSSIL,
    rows: [
      '.aa......aa.',
      'acba....abba',
      '.abbbbbbbba.',
      '.abbbbbbbda.',
      'abba....abda',
      '.aa......aa.',
    ],
  },
  skull: {
    pal: FOSSIL,
    rows: [
      '..aaaaaaaa......',
      '.acccbbbbbaaa...',
      'abaabbbbbbbbbaa.',
      'abaabbbbbbbbbbba',
      'abbbbbbbbbbbbbda',
      '.abbbbbaaaaaaaa.',
      '.abbdba.cacacac.',
      '..aaaa.aaaaaaaa.',
    ],
  },
  ammonite: {
    pal: FOSSIL,
    rows: [
      '...aaaaa...',
      '.aacbbbbaa.',
      '.abbaaabba.',
      'abbabbbabba',
      'abbabaababa',
      'abbababbaba',
      'abdabaaabba',
      '.abdabbbba.',
      '.aadbaaaaa.',
      '...aaaa....',
    ],
  },
  fern: {
    pal: { a: '#4a3a2a', b: '#7d6a4a' },
    rows: [
      '...a...',
      '..aba..',
      '.a.a.a.',
      '..aba..',
      'a..a..a',
      '.abbba.',
      '...a...',
      'ab.a.ba',
      '..aba..',
      '...a...',
      '...a...',
    ],
  },
  dragonfly: {
    pal: { a: '#2e2a26', b: '#77736d' },
    rows: [
      '.bbb.a.bbb.',
      'bbbbbabbbbb',
      '.bbb.a.bbb.',
      '.....a.....',
      '.....a.....',
      '.....a.....',
      '.....a.....',
    ],
  },
  fish: {
    pal: FOSSIL,
    rows: [
      '....aaaa....',
      '..aaccbbaa.a',
      '.acabbbbbbaa',
      'abbbbbdbbbba',
      '.abbbbbbbbaa',
      '..aabbbbaa.a',
      '....aaaa....',
    ],
  },
  trilobite: {
    pal: FOSSIL,
    rows: [
      '..aaaaa..',
      '.abcccba.',
      'abcbbbcba',
      'abbaaabba',
      '.abbbbba.',
      'aabdbdbaa',
      '.abbbbba.',
      'aabdbdbaa',
      '.abbbbba.',
      '..abbba..',
      '...aaa...',
    ],
  },
  stromatolite: {
    pal: { a: '#2a2422', b: '#8b7d6b', c: '#b3a58f' },
    rows: [
      '....aaaa....',
      '..aabbbbaa..',
      '.abccccccba.',
      'abbbbbbbbbba',
      'acccccccccca',
      'abbbbbbbbbba',
      'acccccccccca',
      'aaaaaaaaaaaa',
    ],
  },
  crinoid: {
    pal: FOSSIL,
    rows: [
      'a.a.a.a',
      '.ababa.',
      'a.bcb.a',
      '.abbba.',
      '..aba..',
      '...a...',
      '..aba..',
      '...a...',
      '..aba..',
      '...a...',
      '..aba..',
    ],
  },
  // Paläontologin mit Spaten, Blick nach rechts
  digger: {
    pal: { k: '#c9a15a', h: '#8a6a32', s: '#f0c39a', e: '#2b1d14', g: '#5d7a3a', G: '#465e2b', p: '#4a3a2a', d: '#2b1d14', w: '#8a5a32', m: '#a9b0b4' },
    rows: [
      '..kkkkk.....',
      '.kkkkkkk....',
      'hhhhhhhhh...',
      '..sssss.....',
      '..ssesse....',
      '..sssss.....',
      '...sss....w.',
      '.ggggggg..w.',
      'gggggggggsw.',
      'gsgggggG..w.',
      'gsgggggG..w.',
      '.ggggggg..w.',
      '..pp.pp...w.',
      '..pp.pp..mmm',
      '..pp.pp..mmm',
      '.ddd.ddd..m.',
    ],
  },
  bucket: {
    pal: { a: '#2a2c30', b: '#7c848c', c: '#aab2b8' },
    rows: [
      'aaaaaaaa',
      'abccccba',
      'abbbbbba',
      'abcbbbba',
      '.abbbba.',
      '.abcbba.',
      '..abba..',
      '...aa...',
    ],
  },
  tent: {
    pal: { a: '#5a2a18', b: '#d9663a', c: '#b44e2a', d: '#3a1e12' },
    rows: [
      '.........a.........',
      '........aba........',
      '.......abbca.......',
      '......abbbcca......',
      '.....abbbbccca.....',
      '....abbbbbdccca....',
      '...abbbbbdddccca...',
      '..abbbbbbdddcccca..',
      '.abbbbbbddddccccca.',
      'aaaaaaaaaaaaaaaaaaa',
    ],
  },
  flag: {
    pal: { a: '#3b2a1e', y: '#f2c14e', o: '#d9903a' },
    rows: [
      'ayyyyy',
      'ayyoyy',
      'ayoooy',
      'ayyyyy',
      'a.....',
      'a.....',
      'a.....',
      'a.....',
      'a.....',
      'a.....',
      'a.....',
    ],
  },
};

export type AnySprite = keyof typeof DEFS;

const cache = new Map<string, HTMLCanvasElement>();

export function sprite(name: AnySprite): HTMLCanvasElement {
  const hit = cache.get(name);
  if (hit) return hit;
  const { rows, pal } = DEFS[name];
  const w = Math.max(...rows.map((r) => r.length));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = rows.length;
  const ctx = c.getContext('2d')!;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = pal[row[x]];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    }
  });
  cache.set(name, c);
  return c;
}

/** Sprite als hochskalierte Data-URL, z. B. für das Fundstück im Ergebnis */
export function spriteDataUrl(name: AnySprite, scale = 6): string {
  const s = sprite(name);
  const c = document.createElement('canvas');
  c.width = s.width * scale;
  c.height = s.height * scale;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(s, 0, 0, c.width, c.height);
  return c.toDataURL();
}
