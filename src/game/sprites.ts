// Hand-drawn pixel sprites as character grids. '.' = transparent.
import type { DecorName, TrophyName } from './levels';

type Palette = Record<string, string>;
interface SpriteDef { rows: string[]; pal: Palette }

const WOOD: Palette = { a: '#2a1a10', b: '#7a4f2e', c: '#a8723f', d: '#c99a5a' };

const DEFS: Record<DecorName | TrophyName | 'librarian' | 'cat' | 'lamppost', SpriteDef> = {
  // ---- figures ----
  librarian: {
    pal: { h: '#3a2418', s: '#f0c39a', g: '#1e1410', c: '#8a2f3a', C: '#6a2230', p: '#2e2a3a', d: '#1e1410', w: '#efe2c4', b: '#3d6b8a' },
    rows: [
      '.hhhh...',
      'hhhhhh..',
      'hssssh..',
      'hgsgsh..',
      '.ssss...',
      '..ss....',
      '.cccc...',
      'cccccbb.',
      'cCcccbbw',
      'sCcccbb.',
      '.cccc...',
      '.pppp...',
      '.p..p...',
      '.p..p...',
      'dd..dd..',
    ],
  },
  cat: {
    pal: { a: '#1e1a1c', e: '#e8c84a' },
    rows: [
      'a.a.....',
      'aaa.....',
      'eae....a',
      'aaaaaaa.',
      '.aaaaaa.',
      '.a.a.aa.',
    ],
  },
  lamppost: {
    pal: { a: '#2a2a30', l: '#ffd98a', L: '#f2b04a' },
    rows: [
      '.aaa.',
      'alLla',
      'alLla',
      '.aaa.',
      '..a..',
      ...Array(26).fill('..a..'),
      '.aaa.',
    ],
  },
  // ---- decor ----
  lamp: {
    pal: { a: '#2a1a10', s: '#e8c46a', S: '#c99a3a', p: '#5a3a1e' },
    rows: [
      '.sss.',
      'sSsSs',
      'sssss',
      '..p..',
      ...Array(11).fill('..p..'),
      '.ppp.',
      'aaaaa',
    ],
  },
  plant: {
    pal: { g: '#4f8a4a', G: '#3a6a3a', p: '#b8623a', P: '#8a4a2a' },
    rows: [
      '...g.g...',
      '.g.gGg.g.',
      'gGgGgGgGg',
      '.gGgGgGg.',
      'gGg.G.gGg',
      '...gGg...',
      '..ppppp..',
      '..pPPPp..',
      '...ppp...',
      '...PPP...',
    ],
  },
  ladder: {
    pal: WOOD,
    rows: Array.from({ length: 44 }, (_, i) => (i % 5 === 0 ? 'bccccccb' : 'b......b')),
  },
  globe: {
    pal: { o: '#3d6b8a', g: '#5a8a4a', b: '#b8862e', a: '#3a2a1a' },
    rows: [
      '..bbbbb..',
      '.boogoob.',
      'boggoooob',
      'boogggoob',
      'booogoogb',
      '.boooogb.',
      '..bbbbb..',
      '....a....',
      '....a....',
      '...aaa...',
      '..a.a.a..',
      '.a..a..a.',
    ],
  },
  reader: {
    pal: { a: '#2a2c30', b: '#6a737a', c: '#a8b2b8', s: '#bfe0d8', w: '#5a3a1e' },
    rows: [
      '..aaaaaaaa....',
      '..abbbbbba....',
      '..absssssba...',
      '..absssssba...',
      '..abbbbbba....',
      '...aaccaa.....',
      '..aaaaaaaaa...',
      'wwwwwwwwwwwwww',
      '.w..........w.',
      '.w..........w.',
      '.w..........w.',
      '.w..........w.',
    ],
  },
  catalog: {
    pal: { a: '#2a1a10', b: '#8a5a32', c: '#a8723f', k: '#d8a94a' },
    rows: [
      'aaaaaaaaaaaaaa',
      'abbbbbbbbbbbba',
      'acckcckcckccka',
      'abbbbbbbbbbbba',
      'acckcckcckccka',
      'abbbbbbbbbbbba',
      'acckcckcckccka',
      'abbbbbbbbbbbba',
      'acckcckcckccka',
      'aaaaaaaaaaaaaa',
      '.a..........a.',
      '.a..........a.',
    ],
  },
  case: {
    pal: { a: '#2a1a10', b: '#5a3a1e', g: '#cfe4e8', G: '#a8c8d0', p: '#efe2c4', r: '#7a2a2a' },
    rows: [
      'aaaaaaaaaaaaaaaaaa',
      'agggggggggggggggGa',
      'agGggggggggggggGga',
      'aggggrppppprgggg.a',
      'agggrpppppppprggga',
      'aaaaaaaaaaaaaaaaaa',
      'abbbbbbbbbbbbbbbba',
      'ab..............ba',
      'ab..............ba',
      'ab..............ba',
      'abbbbbbbbbbbbbbbba',
      'a.a............a.a',
    ],
  },
  cobweb: {
    pal: { w: '#c8c2b8' },
    rows: [
      'wwwwwwwwww',
      'w.w..w..w.',
      'ww.w.w.w..',
      'w.www.w...',
      'w..wwww...',
      'w.w.ww....',
      'ww..w.....',
      'w.ww......',
      'ww........',
      'w.........',
    ],
  },
  candle: {
    pal: { f: '#ffd25a', F: '#ff8a2a', w: '#efe2c4', W: '#cfc2a4', b: '#b8862e' },
    rows: ['.f.', 'fFf', '.F.', 'wwW', 'wwW', 'wwW', 'wwW', 'bbb'],
  },
  lectern: {
    pal: WOOD,
    rows: [
      'aaaaaaaaaa',
      'acccccccca',
      '.addddda..',
      '..abbba...',
      '...aba....',
      '...aba....',
      '...aba....',
      '...aba....',
      '...aba....',
      '...aba....',
      '..abbba...',
      '.aaaaaaa..',
    ],
  },
  pile: {
    pal: { a: '#1e1410', r: '#6a2a22', g: '#3a4a32', b: '#2a3a4a', y: '#8a6a32', w: '#cfc2a4' },
    rows: [
      '....aaaaaa....',
      '...arrrrrra...',
      '..aaaaaaaaaa..',
      '..agggggggwa..',
      '.aaaaaaaaaaaa.',
      '.abbbbbbbbbwa.',
      '..aaaaaaaaaa..',
      '..ayyyyyyyya..',
      '.aaaaaaaaaaaa.',
      'arrrrrrrrrrrwa',
      'aaaaaaaaaaaaaa',
    ],
  },
  torch: {
    pal: { f: '#ffd25a', F: '#ff8a2a', r: '#c2401a', a: '#3a2a1a', b: '#6a4a2a' },
    rows: ['.f.f', 'fFff', 'FrFf', '.Fr.', 'aaaa', '.ba.', '.ba.', '.ba.', '.ba.', 'aaa.'],
  },
  amphora: {
    pal: { a: '#5a2a14', b: '#b8623a', c: '#d98a52', k: '#2a1a10' },
    rows: [
      '..aaa..',
      '..aba..',
      '.a.b.a.',
      '.abbba.',
      'abcbbba',
      'abkkkba',
      'abcbbba',
      'abbbbba',
      '.abbba.',
      '..aba..',
      '..aaa..',
    ],
  },
  sign: {
    pal: { a: '#2a1a10', r: '#a8322a', w: '#efe2c4' },
    rows: [
      'aaaaaaaaaaaaaaa',
      'arrrrrrrrrrrrra',
      'arwwwwwwwwwwwra',
      'arrrrrrrrrrrrra',
      'arrwwwwwwwwwrra',
      'aaaaaaaaaaaaaaa',
    ],
  },
  // ---- trophies ----
  book: {
    pal: { a: '#1e1410', r: '#b8432e', R: '#8a2f22', w: '#efe2c4', y: '#f2c14e' },
    rows: [
      'aaaaaaaaaa',
      'aRrrrrrrra',
      'aRryyyyyra',
      'aRrrrrrrra',
      'aRrywwyrra',
      'aRrrrrrrra',
      'aRrrrrrrra',
      'aRrrrrrrra',
      'aRryyyyyra',
      'aRrrrrrrra',
      'aRwwwwwwwa',
      'aaaaaaaaaa',
    ],
  },
  magazine: {
    pal: { a: '#1e1410', b: '#3d6b8a', w: '#efe2c4', y: '#f2c14e', r: '#d9663a' },
    rows: [
      'aaaaaaaaaa',
      'awwwwwwwwa',
      'aryyyyyyra',
      'awwwwwwwwa',
      'abbbbbbbba',
      'abbwwwbbba',
      'abwwwwwbba',
      'abbwwwbbba',
      'abbbbbbbba',
      'awyywyywwa',
      'aaaaaaaaaa',
    ],
  },
  box: {
    pal: { a: '#3a2a1a', b: '#c4a06a', c: '#a8844e', w: '#efe2c4' },
    rows: [
      'aaaaaaaaaaaaaa',
      'acccccccccccca',
      'aaaaaaaaaaaaaa',
      'abbbbbbbbbbbba',
      'abbbwwwwwbbbba',
      'abbbwaawwbbbba',
      'abbbwwwwwbbbba',
      'abbbbbbbbbbbba',
      'abbbbbbbbbbbba',
      'aaaaaaaaaaaaaa',
    ],
  },
  tome: {
    pal: { a: '#1e1410', b: '#5a1e1e', c: '#7a2a2a', g: '#d8a94a', p: '#efe2c4' },
    rows: [
      'aaaaaaaaaaaa',
      'abbbbbbbbbba',
      'abggggggggba',
      'abgccccccgba',
      'abgcggggcgba',
      'abgcgccgcgag',
      'abgcgccgcgag',
      'abgcggggcgba',
      'abgccccccgba',
      'abggggggggba',
      'abbbbbbbbbba',
      'appppppppppa',
      'aaaaaaaaaaaa',
    ],
  },
  scroll: {
    pal: { a: '#3a2a1a', p: '#efe2c4', P: '#d8c8a0', w: '#8a5a32', r: '#a8322a' },
    rows: [
      '.aa..........aa.',
      'awwa........awwa',
      'apPaaaaaaaaaaPpa',
      'apPppppppppppPpa',
      'apPpPPPPPPPppPpa',
      'apPrrppppppppPpa',
      'apPppppppppppPpa',
      'apPaaaaaaaaaaPpa',
      'awwa........awwa',
      '.aa..........aa.',
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

/** Upscaled data URL, e.g. for the keepsake on the result card */
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

// 3×5 pixel font for signs in the scene
const GLYPHS: Record<string, string[]> = {
  B: ['11.', '1.1', '11.', '1.1', '11.'],
  O: ['.1.', '1.1', '1.1', '1.1', '.1.'],
  K: ['1.1', '1.1', '11.', '1.1', '1.1'],
  S: ['.11', '1..', '.1.', '..1', '11.'],
  P: ['11.', '1.1', '11.', '1..', '1..'],
  E: ['111', '1..', '11.', '1..', '111'],
  N: ['1.1', '111', '111', '1.1', '1.1'],
};

export function pixelText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  let cx = x;
  for (const ch of text) {
    const g = GLYPHS[ch];
    if (g) g.forEach((row, gy) => [...row].forEach((v, gx) => v === '1' && ctx.fillRect(cx + gx, y + gy, 1, 1)));
    cx += 4;
  }
}
