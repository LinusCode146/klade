// Canvas scene: the street with the bookshop and a cross-section of the library below it.
// All coordinates are art pixels; y = 0 is street level, positive y goes down.
import { DECOR, FLOORS, MAX_DEPTH, floorAt, floorBottom, type Floor, type Style } from './levels';
import { pixelText, sprite } from './sprites';

type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const shadeHex = (h: string, f: number) => {
  const c = hex(h).map((v) => (f < 0 ? v * (1 + f) : v + (255 - v) * f));
  return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
};

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const SKY_DAY = ['#4a6fa5', '#7a9cc6', '#b4c3d8', '#e6d0b2', '#f2b48a'].map(hex);
const SKY_NIGHT = ['#070b1f', '#0e1634', '#1a2150', '#2f2d66', '#523c6c'].map(hex);

// ---------- shelf styles ----------
interface ShelfStyle {
  palette: string[];
  w: [number, number];
  h: [number, number];
  gap: number;
  lean: number;
  band: number;
  plank: string;
  upright: string;
  bandColor?: string;
}

const S = (p: Partial<ShelfStyle> & Pick<ShelfStyle, 'palette' | 'plank' | 'upright'>): ShelfStyle => ({
  w: [2, 4], h: [11, 17], gap: 0.05, lean: 0.04, band: 0.25, ...p,
});

const SHELVES: Partial<Record<Style, ShelfStyle>> = {
  bestseller: S({ palette: ['#e04f3f', '#f2b43a', '#3f8fd0', '#4ab07a', '#e87aa8', '#7a5ad0', '#f07a2a', '#2a2a2a', '#f4f0e6'], plank: '#d8c4a0', upright: '#b89a70', band: 0.15 }),
  fiction: S({ palette: ['#a8433a', '#3d6b8a', '#c9993d', '#4f7a4a', '#7a4a6a', '#2f3f5a', '#b86a3a', '#d8c8a0'], plank: '#7a4f2e', upright: '#5a3a22', lean: 0.06 }),
  reference: S({ palette: ['#2f4a3a', '#6a2a2a', '#1f2f4a', '#4a3a2a', '#3a2a4a'], plank: '#5a3a22', upright: '#3e2716', w: [3, 3], h: [15, 16], gap: 0.03, lean: 0, band: 1, bandColor: '#d8a94a' }),
  closed: S({ palette: ['#6a5a4a', '#4a5a6a', '#5a6a4a', '#7a6a5a', '#3a3a3a', '#8a7a5a'], plank: '#8d948a', upright: '#6d746a', w: [2, 3], h: [12, 16], band: 0.15, lean: 0.02 }),
  rare: S({ palette: ['#5a1e1e', '#3a2a1a', '#2a3a2a', '#4a2a3a', '#6a3a1a'], plank: '#3a2216', upright: '#2a160e', w: [3, 5], h: [14, 18], gap: 0.06, lean: 0.02, band: 1, bandColor: '#d8a94a' }),
  vault: S({ palette: ['#7a6e62', '#5e564e', '#6e5a4a', '#50483e', '#665e52'], plank: '#4a3a2e', upright: '#3a2e24', gap: 0.24, lean: 0.16, band: 0.1, bandColor: '#9a8e7a' }),
  scriptorium: S({ palette: ['#5a3a22', '#4a2a1a', '#6a4a2a', '#3a2a1a'], plank: '#4a3020', upright: '#3a2418', w: [5, 7], h: [15, 18], gap: 0.12, lean: 0, band: 1, bandColor: '#8a8a8a' }),
};

const DIM = [0, 0.04, 0.08, 0.12, 0.2, 0.26, 0.3, 0.42, 0.36, 0.5, 0.18];

interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; page?: boolean }
interface Cloud { x: number; y: number; w: number; speed: number }

export interface SceneCallbacks {
  onFrame?: (camY: number, depth: number) => void;
  onFloorEnter?: (floor: Floor) => void;
}

export class Scene {
  private ctx: CanvasRenderingContext2D;
  /** CSS pixels per art pixel */
  px = 4;
  w = 0;
  h = 0;
  readonly skyH = 220;
  private library!: HTMLCanvasElement;
  private sky!: HTMLCanvasElement;
  private night = false;
  private clouds: Cloud[] = [];
  private particles: Particle[] = [];
  private stars: [number, number][] = [];
  private flames: [number, number][] = [];

  camY = -150;
  camTarget = -150;
  depth = 0;
  private from = 0;
  private to = 0;
  private t = 1;
  private floorIndex = -1;
  private shake = 0;
  private last = 0;
  private raf = 0;
  private atStreet = true;
  private reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(private canvas: HTMLCanvasElement, private cb: SceneCallbacks = {}) {
    this.ctx = canvas.getContext('2d')!;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    this.night = mq.matches;
    mq.addEventListener('change', (e) => {
      this.night = e.matches;
      this.buildSky();
    });
    this.resize();
    addEventListener('resize', () => this.resize());
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  get shaftX() {
    return Math.round(this.w * 0.5);
  }

  resize() {
    this.px = innerWidth < 700 ? 3 : 4;
    this.w = Math.ceil(innerWidth / this.px);
    this.h = Math.ceil(innerHeight / this.px);
    this.canvas.width = this.w;
    this.canvas.height = this.h;
    this.ctx.imageSmoothingEnabled = false;
    this.buildSky();
    this.buildLibrary();
    if (this.atStreet) this.camY = this.camTarget = this.streetCam();
    this.clouds = Array.from({ length: Math.max(3, Math.round(this.w / 90)) }, (_, i) => ({
      x: (i / 3) * this.w * 0.9 + hash(i, 7) * 40,
      y: -this.skyH + 24 + hash(i, 3) * 70,
      w: 22 + hash(i, 5) * 30,
      speed: 1.5 + hash(i, 9) * 2.5,
    }));
    this.stars = Array.from({ length: 70 }, (_, i) => [hash(i, 11) * this.w, -this.skyH + hash(i, 13) * (this.skyH - 80)]);
  }

  // =====================================================================
  // Street
  // =====================================================================
  private buildSky() {
    if (!this.w) return;
    const W = this.w;
    const H = this.skyH;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(W, H);
    const stops = this.night ? SKY_NIGHT : SKY_DAY;
    for (let y = 0; y < H; y++) {
      const pos = (y / H) * (stops.length - 1);
      const i = Math.floor(pos);
      const frac = pos - i;
      for (let x = 0; x < W; x++) {
        const col = stops[Math.min(stops.length - 1, frac > BAYER[(y % 4) * 4 + (x % 4)] / 16 ? i + 1 : i)];
        const o = (y * W + x) * 4;
        img.data[o] = col[0];
        img.data[o + 1] = col[1];
        img.data[o + 2] = col[2];
        img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // sun or moon
    const mx = Math.round(W * 0.8);
    const my = 52;
    ctx.fillStyle = this.night ? 'rgba(220,226,255,0.12)' : 'rgba(255,214,150,0.28)';
    disc(ctx, mx, my, 18);
    ctx.fillStyle = this.night ? '#e9ecf5' : '#ffd08a';
    disc(ctx, mx, my, 12);
    if (this.night) {
      ctx.fillStyle = stops[1] ? `rgb(${stops[1].join(',')})` : '#0e1634';
      disc(ctx, mx + 5, my - 3, 10);
    }

    // skyline in two layers
    const r = rng(42);
    for (const [layer, base, color] of [
      [0, 70, this.night ? '#1c2244' : '#9aa3b8'],
      [1, 40, this.night ? '#141a33' : '#7d869c'],
    ] as const) {
      let x = -4;
      while (x < W) {
        const bw = 12 + Math.floor(r() * 22);
        const bh = base * 0.4 + Math.floor(r() * base);
        ctx.fillStyle = color;
        ctx.fillRect(x, H - bh, bw, bh);
        if (r() < 0.3) ctx.fillRect(x + Math.floor(bw / 2) - 1, H - bh - 5, 2, 5); // antenna
        for (let wy = H - bh + 4; wy < H - 6; wy += 6) {
          for (let wx = x + 2; wx < x + bw - 2; wx += 4) {
            const lit = this.night ? r() < 0.35 : r() < 0.15;
            if (!lit) continue;
            ctx.fillStyle = this.night ? (layer ? '#f2c46a' : '#a8925a') : shadeHex(color, -0.12);
            ctx.fillRect(wx, wy, 2, 2);
          }
        }
        x += bw + (layer ? 1 : 2);
      }
    }

    this.drawShop(ctx, H);
    this.sky = c;
  }

  private drawShop(ctx: CanvasRenderingContext2D, G: number) {
    const sx = this.shaftX;
    const half = 60;
    const x0 = sx - half;
    const top = G - 72;
    const night = this.night;

    // bricks
    for (let y = top; y < G; y++) {
      for (let x = x0; x < sx + half; x++) {
        const row = Math.floor((y - top) / 4);
        const mortar = (y - top) % 4 === 3 || (x - x0 + (row % 2) * 4) % 8 === 7;
        ctx.fillStyle = mortar ? '#5e2a20' : hash(x, y) < 0.15 ? '#9a4a36' : '#8a3f2e';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // cornice
    ctx.fillStyle = '#3a2418';
    ctx.fillRect(x0 - 3, top - 4, half * 2 + 6, 4);
    ctx.fillStyle = '#6a4a32';
    ctx.fillRect(x0 - 3, top - 5, half * 2 + 6, 1);
    // upper windows
    for (const wx of [sx - 42, sx - 6, sx + 30]) {
      ctx.fillStyle = '#efe2c4';
      ctx.fillRect(wx - 1, top + 5, 14, 16);
      ctx.fillStyle = night ? '#f2c46a' : '#9cc0d8';
      ctx.fillRect(wx, top + 6, 12, 14);
      ctx.fillStyle = '#efe2c4';
      ctx.fillRect(wx + 5, top + 6, 2, 14);
      ctx.fillRect(wx, top + 12, 12, 1);
    }
    // sign
    const signW = 40;
    ctx.fillStyle = '#d8a94a';
    ctx.fillRect(sx - signW / 2 - 1, G - 44, signW + 2, 11);
    ctx.fillStyle = '#2f5a4a';
    ctx.fillRect(sx - signW / 2, G - 43, signW, 9);
    pixelText(ctx, 'BOOKS', sx - 10, G - 41, '#efe2c4');
    // awnings
    for (const [ax, aw] of [[x0 + 4, 44], [sx + 12, 44]] as const) {
      for (let x = 0; x < aw; x++) {
        ctx.fillStyle = Math.floor(x / 3) % 2 ? '#efe2c4' : '#2f5a4a';
        ctx.fillRect(ax + x, G - 32, 1, x % 3 === 1 ? 6 : 5);
      }
    }
    // display windows
    for (const wx of [x0 + 6, sx + 14]) {
      const ww = 40;
      ctx.fillStyle = '#3a2418';
      ctx.fillRect(wx - 1, G - 25, ww + 2, 22);
      ctx.fillStyle = night ? '#f6d898' : '#f2e6cc';
      ctx.fillRect(wx, G - 24, ww, 20);
      // books in the window
      const r = rng(wx);
      let bx = wx + 2;
      while (bx < wx + ww - 3) {
        const bw = 2 + Math.floor(r() * 2);
        const bh = 6 + Math.floor(r() * 5);
        ctx.fillStyle = SHELVES.bestseller!.palette[Math.floor(r() * 9)];
        ctx.fillRect(bx, G - 6 - bh, bw, bh);
        bx += bw + (r() < 0.2 ? 2 : 0);
      }
      // face-out covers
      for (const [cx, col] of [[wx + 8, '#e04f3f'], [wx + 26, '#3f8fd0']] as const) {
        ctx.fillStyle = col;
        ctx.fillRect(cx, G - 21, 7, 9);
        ctx.fillStyle = '#efe2c4';
        ctx.fillRect(cx + 1, G - 19, 5, 1);
        ctx.fillRect(cx + 2, G - 16, 3, 1);
      }
      ctx.fillStyle = '#5a3a22';
      ctx.fillRect(wx, G - 6, ww, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(wx + ww - 9, G - 23, 1, 5);
      ctx.fillRect(wx + ww - 7, G - 23, 1, 3);
    }
    // door (the lift shaft starts here)
    ctx.fillStyle = '#3a2418';
    ctx.fillRect(sx - 10, G - 31, 20, 31);
    ctx.fillStyle = '#120d0c';
    ctx.fillRect(sx - 8, G - 29, 16, 29);
    ctx.fillStyle = '#b8862e';
    ctx.fillRect(sx - 10, G - 32, 20, 1);
    // stone base
    ctx.fillStyle = '#7a746c';
    ctx.fillRect(x0, G - 3, sx - 10 - x0, 3);
    ctx.fillRect(sx + 10, G - 3, sx + half - sx - 10, 3);

    // street furniture
    const lamp = sprite('lamppost');
    const lx = sx + half + 26;
    if (lx + 5 < this.w) {
      if (night) {
        ctx.fillStyle = 'rgba(255,170,60,0.09)';
        disc(ctx, lx + 2, G - lamp.height + 2, 10);
        ctx.fillStyle = 'rgba(255,200,90,0.22)';
        disc(ctx, lx + 2, G - lamp.height + 2, 5);
      }
      ctx.drawImage(lamp, lx, G - lamp.height);
    }
    const cat = sprite('cat');
    if (x0 - 30 > 0) ctx.drawImage(cat, x0 - 24, G - cat.height);
  }

  // =====================================================================
  // Library cross-section
  // =====================================================================
  private buildLibrary() {
    const W = this.w;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = MAX_DEPTH + 60;
    const ctx = c.getContext('2d')!;
    this.flames = [];
    const sx = this.shaftX;

    FLOORS.forEach((f, i) => {
      const top = f.top;
      const bottom = floorBottom(f);
      const r = rng(1000 + i * 77 + W);
      const roomTop = top + 6;
      const floorY = bottom - 3;

      this.wall(ctx, f, roomTop, floorY);
      if (f.style === 'closed') {
        for (let x = 20; x < W; x += 64) {
          ctx.fillStyle = '#e8f0e0';
          ctx.fillRect(x, roomTop, 14, 1);
          ctx.fillStyle = 'rgba(232,240,224,0.08)';
          ctx.fillRect(x - 6, roomTop + 1, 26, 30);
        }
      }

      const shelfTop = roomTop + 8;
      const shelfBottom = floorY - 26;
      if (f.style === 'alexandria') this.pigeonholes(ctx, shelfTop, shelfBottom, r);
      else if (f.style === 'catacombs') this.niches(ctx, shelfTop, floorY, r);
      else this.bookcases(ctx, f.style, shelfTop, shelfBottom, floorY, r);

      this.floorBoards(ctx, f.style, floorY, bottom);
      this.slab(ctx, f.style, i, top);

      // lift landing on every floor
      ctx.fillStyle = '#5a3e1a';
      ctx.fillRect(sx - 11, floorY - 28, 22, 28);
      ctx.fillStyle = '#b8862e';
      ctx.fillRect(sx - 10, floorY - 27, 20, 1);
      ctx.fillRect(sx - 10, floorY - 27, 1, 27);
      ctx.fillRect(sx + 9, floorY - 27, 1, 27);
      ctx.fillStyle = '#f2c14e';
      ctx.fillRect(sx - 1, floorY - 31, 3, 2);

      // decor
      for (const [name, fi, fx] of DECOR) {
        if (fi !== i) continue;
        const s = sprite(name);
        let x = Math.round(fx * W - s.width / 2);
        if (Math.abs(x + s.width / 2 - sx) < 26) x = x < sx ? sx - 26 - s.width : sx + 26;
        let y = floorY - s.height;
        if (name === 'cobweb') {
          y = roomTop;
          if (fx > 0.5) {
            ctx.save();
            ctx.translate(W, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(s, 0, y);
            ctx.restore();
            continue;
          }
          x = 0;
        }
        if (name === 'torch') y = floorY - 46;
        if (name === 'sign') y = floorY - 40;
        ctx.drawImage(s, x, y);
        if (name === 'lamp') this.flames.push([x + 2, y + 1]);
        if (name === 'candle' || name === 'torch') this.flames.push([x + 1, y + 1]);
      }

      // light falls off with depth
      if (DIM[i]) {
        ctx.fillStyle = `rgba(12,8,10,${DIM[i]})`;
        ctx.fillRect(0, roomTop, W, bottom - roomTop);
      }
    });

    // warm light pools around lamps and flames
    for (const [x, y] of this.flames) {
      for (const [rad, a] of [[26, 0.05], [16, 0.07], [8, 0.09]] as const) {
        ctx.fillStyle = `rgba(255,200,120,${a})`;
        disc(ctx, x, y, rad);
      }
    }

    // the shaft
    ctx.fillStyle = '#120d0c';
    ctx.fillRect(sx - 7, 0, 14, MAX_DEPTH + 60);
    ctx.fillStyle = '#8a6420';
    ctx.fillRect(sx - 7, 0, 1, MAX_DEPTH + 60);
    ctx.fillRect(sx + 6, 0, 1, MAX_DEPTH + 60);
    ctx.fillStyle = 'rgba(184,134,46,0.25)';
    for (let y = 4; y < MAX_DEPTH + 60; y += 8) ctx.fillRect(sx - 6, y, 12, 1);

    this.library = c;
  }

  private wall(ctx: CanvasRenderingContext2D, f: Floor, y0: number, y1: number) {
    const W = this.w;
    const base = hex(f.wall);
    const img = ctx.createImageData(W, y1 - y0);
    const d = img.data;
    for (let y = y0; y < y1; y++) {
      for (let x = 0; x < W; x++) {
        const h = hash(x, y);
        let k = h < 0.12 ? 0.06 : h > 0.95 ? -0.08 : 0;
        const ly = y - y0;
        switch (f.style) {
          case 'bestseller':
            if (x % 8 < 4) k += 0.04;
            break;
          case 'fiction':
            if (x % 9 === 0) k -= 0.18;
            break;
          case 'archive': {
            const row = Math.floor(ly / 8);
            if (ly % 8 === 7 || (x + (row % 2) * 8) % 16 === 15) k -= 0.15;
            break;
          }
          case 'rare':
            if ((x + ly) % 8 === 0 && (x - ly) % 8 === 0) k += 0.2;
            break;
          case 'vault':
            if (hash(Math.floor(x / 30), Math.floor(ly / 40)) > 0.85 && Math.abs(Math.sin(x * 0.4 + ly * 0.2)) < 0.08) k -= 0.3;
            break;
          case 'scriptorium':
          case 'catacombs':
          case 'alexandria': {
            const bh = f.style === 'alexandria' ? 12 : 10;
            const bw = f.style === 'alexandria' ? 26 : 20;
            const row = Math.floor(ly / bh);
            const col = Math.floor((x + (row % 2) * (bw / 2)) / bw);
            if (ly % bh === bh - 1 || (x + (row % 2) * (bw / 2)) % bw === bw - 1) k -= 0.25;
            else k += (hash(col, row) - 0.5) * 0.12;
            break;
          }
        }
        const o = ((y - y0) * W + x) * 4;
        for (let ch = 0; ch < 3; ch++) {
          const v = base[ch];
          d[o + ch] = k < 0 ? v * (1 + k) : v + (255 - v) * k;
        }
        d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, y0);
  }

  private bookcases(ctx: CanvasRenderingContext2D, style: Style, top: number, bottom: number, floorY: number, r: () => number) {
    const W = this.w;
    const sx = this.shaftX;
    const st = SHELVES[style] ?? SHELVES.fiction!;
    const rowH = 22;
    const segs: [number, number][] = [[4, sx - 16], [sx + 16, W - 4]];

    for (const [a, b] of segs) {
      if (b - a < 12) continue;
      // back panel of the bookcase
      ctx.fillStyle = shadeHex(st.upright, -0.35);
      ctx.fillRect(a, top, b - a, floorY - top);
      for (let y = top; y + rowH <= bottom + rowH; y += rowH) {
        const base = y + rowH - 2;
        if (base > floorY - 4) break;
        if (style === 'periodicals') this.periodicalRow(ctx, a, b, base, r);
        else if (style === 'archive') this.boxRow(ctx, a, b, base, r);
        else this.bookRow(ctx, a, b, base, st, style, r);
        ctx.fillStyle = st.plank;
        if (style === 'periodicals' || style === 'archive') ctx.fillStyle = '#9aa0a6';
        ctx.fillRect(a, base, b - a, 2);
        ctx.fillStyle = shadeHex(ctx.fillStyle as string, -0.3);
        ctx.fillRect(a, base + 2, b - a, 1);
      }
      // uprights
      ctx.fillStyle = style === 'periodicals' || style === 'archive' ? '#7d848a' : st.upright;
      for (let x = a; x < b; x += 64) ctx.fillRect(x, top - 2, 3, floorY - top + 2);
      ctx.fillRect(b - 3, top - 2, 3, floorY - top + 2);
      ctx.fillRect(a, top - 3, b - a, 3);
    }
  }

  private bookRow(ctx: CanvasRenderingContext2D, a: number, b: number, base: number, st: ShelfStyle, style: Style, r: () => number) {
    let x = a + 3;
    let runColor = st.palette[0];
    let run = 0;
    while (x < b - 4) {
      if ((x - a) % 64 < 3) { x++; continue; }
      if (r() < st.gap) { x += 2 + Math.floor(r() * 4); continue; }
      const w = st.w[0] + Math.floor(r() * (st.w[1] - st.w[0] + 1));
      const h = st.h[0] + Math.floor(r() * (st.h[1] - st.h[0] + 1));
      if (x + w > b - 3) break;
      let color: string;
      if (style === 'reference') {
        if (run <= 0) { runColor = st.palette[Math.floor(r() * st.palette.length)]; run = 6 + Math.floor(r() * 7); }
        color = runColor;
        run--;
      } else color = st.palette[Math.floor(r() * st.palette.length)];

      // face-out bestseller
      if (style === 'bestseller' && r() < 0.08 && x + 10 < b - 3) {
        ctx.fillStyle = color;
        ctx.fillRect(x, base - 14, 9, 14);
        ctx.fillStyle = '#efe2c4';
        ctx.fillRect(x + 1, base - 12, 7, 2);
        ctx.fillRect(x + 2, base - 6, 5, 1);
        x += 10;
        continue;
      }
      // a book lying flat
      if (r() < st.lean * 0.4 && x + 12 < b - 3) {
        ctx.fillStyle = color;
        ctx.fillRect(x, base - 3, 11, 3);
        ctx.fillStyle = shadeHex(color, -0.3);
        ctx.fillRect(x, base - 3, 11, 1);
        x += 12;
        continue;
      }
      this.spine(ctx, x, base, w, h, color, r() < st.band, st.bandColor);
      if (style === 'scriptorium') {
        // chain from the clasp down to the shelf
        ctx.fillStyle = '#9a9a9a';
        for (let cy = base - Math.floor(h / 2); cy < base; cy += 2) ctx.fillRect(x + Math.floor(w / 2), cy, 1, 1);
      }
      if (style === 'vault' && r() < 0.3) {
        ctx.fillStyle = 'rgba(200,194,184,0.35)'; // dust
        ctx.fillRect(x, base - h, w, 1);
      }
      x += w + (r() < 0.12 ? 1 : 0);
    }
  }

  private spine(ctx: CanvasRenderingContext2D, x: number, base: number, w: number, h: number, color: string, band: boolean, bandColor?: string) {
    ctx.fillStyle = color;
    ctx.fillRect(x, base - h, w, h);
    ctx.fillStyle = shadeHex(color, -0.35);
    ctx.fillRect(x, base - h, 1, h);
    ctx.fillStyle = shadeHex(color, 0.2);
    ctx.fillRect(x + 1, base - h, w - 1, 1);
    if (band) {
      ctx.fillStyle = bandColor ?? shadeHex(color, 0.45);
      ctx.fillRect(x + 1, base - h + 3, w - 1, 1);
      ctx.fillRect(x + 1, base - 4, w - 1, 1);
    } else if (w >= 3) {
      ctx.fillStyle = shadeHex(color, 0.35);
      ctx.fillRect(x + 1, base - Math.round(h * 0.6), w - 1, 1);
    }
  }

  private periodicalRow(ctx: CanvasRenderingContext2D, a: number, b: number, base: number, r: () => number) {
    const pal = ['#c9a0a0', '#a0b8c9', '#b8c9a0', '#d8c8a0', '#a8a0c9'];
    const drawers = r() < 0.35;
    let x = a + 3;
    while (x < b - 10) {
      if ((x - a) % 64 < 3) { x++; continue; }
      if (drawers) {
        ctx.fillStyle = '#7d848a';
        ctx.fillRect(x, base - 16, 9, 16);
        ctx.fillStyle = '#a8b0b6';
        for (let dy = 0; dy < 4; dy++) {
          ctx.fillRect(x + 1, base - 15 + dy * 4, 7, 3);
          ctx.fillStyle = '#4a5056';
          ctx.fillRect(x + 4, base - 14 + dy * 4, 1, 1);
          ctx.fillStyle = '#a8b0b6';
        }
        x += 10;
      } else {
        const w = 7 + Math.floor(r() * 3);
        const col = pal[Math.floor(r() * pal.length)];
        ctx.fillStyle = col;
        ctx.fillRect(x, base - 13, w, 13);
        ctx.fillStyle = shadeHex(col, -0.3);
        ctx.fillRect(x, base - 13, 1, 13);
        ctx.fillStyle = '#efe2c4';
        ctx.fillRect(x + 2, base - 10, w - 4, 3);
        x += w + 1;
      }
    }
  }

  private boxRow(ctx: CanvasRenderingContext2D, a: number, b: number, base: number, r: () => number) {
    let x = a + 3;
    while (x < b - 14) {
      if ((x - a) % 64 < 3) { x++; continue; }
      if (r() < 0.08) { x += 6; continue; }
      const w = 13 + Math.floor(r() * 5);
      if (x + w > b - 3) break;
      const col = r() < 0.2 ? '#a8844e' : '#c4a06a';
      ctx.fillStyle = col;
      ctx.fillRect(x, base - 12, w, 12);
      ctx.fillStyle = shadeHex(col, -0.25);
      ctx.fillRect(x, base - 12, w, 2);
      ctx.fillRect(x, base - 12, 1, 12);
      ctx.fillStyle = '#efe2c4';
      ctx.fillRect(x + 3, base - 8, 6, 3);
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(x + 4, base - 7, 4, 1);
      x += w + 1;
    }
  }

  private pigeonholes(ctx: CanvasRenderingContext2D, top: number, bottom: number, r: () => number) {
    const W = this.w;
    const sx = this.shaftX;
    const cw = 12;
    const ch = 10;
    for (const [a, b] of [[6, sx - 18], [sx + 18, W - 6]] as const) {
      const cols = Math.floor((b - a) / cw);
      const ox = a + Math.floor((b - a - cols * cw) / 2);
      ctx.fillStyle = '#7a5a32';
      ctx.fillRect(ox - 2, top - 2, cols * cw + 3, Math.floor((bottom - top) / ch) * ch + 3);
      for (let y = top; y + ch <= bottom; y += ch) {
        for (let i = 0; i < cols; i++) {
          const x = ox + i * cw;
          ctx.fillStyle = '#2e1c0e';
          ctx.fillRect(x, y, cw - 1, ch - 1);
          const n = Math.floor(r() * 4);
          for (let k = 0; k < n; k++) {
            const px = x + 1 + (k % 3) * 3 + (k >= 3 ? 1 : 0);
            const py = y + ch - 5 - (k >= 3 ? 3 : 0);
            ctx.fillStyle = r() < 0.2 ? '#cbb68a' : '#efe2c4';
            ctx.fillRect(px, py + 1, 3, 1);
            ctx.fillRect(px + 1, py, 1, 3);
            ctx.fillStyle = '#8a5a32';
            ctx.fillRect(px + 1, py + 1, 1, 1);
          }
        }
      }
    }
  }

  private niches(ctx: CanvasRenderingContext2D, top: number, floorY: number, r: () => number) {
    const W = this.w;
    const sx = this.shaftX;
    const pile = sprite('pile');
    for (const [a, b] of [[8, sx - 22], [sx + 22, W - 8]] as const) {
      for (let x = a; x + 30 <= b; x += 44) {
        for (const [ny, nh] of [[top + 10, 60], [top + 110, 70]] as const) {
          if (ny + nh > floorY - 30) continue;
          // arched niche
          ctx.fillStyle = '#1a1614';
          ctx.fillRect(x, ny + 8, 30, nh - 8);
          for (let i = 0; i < 8; i++) {
            const half = Math.round(Math.sqrt(64 - (8 - i) * (8 - i)) * 15 / 8);
            ctx.fillRect(x + 15 - half, ny + i, half * 2, 1);
          }
          ctx.fillStyle = '#5a504a';
          ctx.fillRect(x - 1, ny + nh, 32, 2);
          if (r() < 0.85) ctx.drawImage(pile, x + 8, ny + nh - pile.height);
          if (r() < 0.4) ctx.drawImage(pile, x + 8, ny + nh - pile.height * 2 + 1);
        }
      }
    }
  }

  private floorBoards(ctx: CanvasRenderingContext2D, style: Style, y: number, bottom: number) {
    const W = this.w;
    const col: Record<Style, string> = {
      bestseller: '#8a2f3a', fiction: '#6a4426', reference: '#5a3a22', periodicals: '#7d8478',
      closed: '#5e605a', archive: '#5e605a', rare: '#3a2216', vault: '#4a3e32',
      scriptorium: '#4a443e', catacombs: '#3a3430', alexandria: '#b8925a',
    };
    ctx.fillStyle = col[style];
    ctx.fillRect(0, y, W, bottom - y);
    ctx.fillStyle = shadeHex(col[style], 0.15);
    ctx.fillRect(0, y, W, 1);
    ctx.fillStyle = shadeHex(col[style], -0.25);
    for (let x = 0; x < W; x += 12) ctx.fillRect(x, y + 1, 1, bottom - y - 1);
  }

  private slab(ctx: CanvasRenderingContext2D, style: Style, i: number, top: number) {
    const W = this.w;
    if (i === 0) {
      // pavement
      ctx.fillStyle = '#9a948c';
      ctx.fillRect(0, top, W, 6);
      ctx.fillStyle = '#b8b2a8';
      ctx.fillRect(0, top, W, 2);
      ctx.fillStyle = '#6a645c';
      for (let x = 0; x < W; x += 14) ctx.fillRect(x, top, 1, 6);
      ctx.fillRect(0, top + 5, W, 1);
      return;
    }
    const stone = style === 'scriptorium' || style === 'catacombs' || style === 'alexandria';
    const wood = style === 'rare' || style === 'vault';
    const base = stone ? '#4a443e' : wood ? '#3a2216' : '#5a5650';
    for (let y = top; y < top + 6; y++) {
      for (let x = 0; x < W; x++) {
        const h = hash(x, y);
        ctx.fillStyle = h < 0.15 ? shadeHex(base, 0.12) : h > 0.92 ? shadeHex(base, -0.25) : base;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = shadeHex(base, -0.4);
    ctx.fillRect(0, top + 5, W, 1);
    if (wood) {
      ctx.fillStyle = '#2a160e';
      for (let x = 10; x < W; x += 40) ctx.fillRect(x, top + 6, 4, 4);
    }
  }

  // =====================================================================
  // Control
  // =====================================================================
  focusStreet() {
    this.atStreet = true;
    this.camTarget = this.streetCam();
  }

  focusDig() {
    this.atStreet = false;
    this.camTarget = this.digCam(this.depth);
  }

  private streetCam() {
    return -Math.min(this.skyH, Math.round(this.h * 0.72));
  }

  private digCam(d: number) {
    return Math.max(d - this.h * 0.45, -this.h * 0.5);
  }

  /** Move the lift to a depth (art px) */
  descendTo(depth: number) {
    const target = Math.max(0, Math.min(MAX_DEPTH, depth));
    this.from = this.depth;
    this.to = target;
    this.t = this.reduceMotion ? 1 : 0;
    if (this.reduceMotion) this.depth = target;
  }

  reset() {
    this.depth = this.from = this.to = 0;
    this.t = 1;
    this.floorIndex = -1;
    this.particles = [];
  }

  /** A book drops onto the lift (wrong answer) */
  thud() {
    this.shake = 0.35;
    for (let i = 0; i < 6; i++) this.spawn(this.shaftX, this.depth - 18, '#7a4f2e', 0.6);
  }

  private spawn(x: number, y: number, color: string, strength = 1, page = false) {
    if (this.reduceMotion) return;
    this.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * (page ? 30 : 60) * strength,
      vy: page ? -(10 + Math.random() * 20) : -(20 + Math.random() * 50) * strength,
      life: page ? 1.4 : 0.6 + Math.random() * 0.5,
      color,
      page,
    });
  }

  // =====================================================================
  // Rendering
  // =====================================================================
  private frame(t: number) {
    const dt = Math.min(0.05, (t - (this.last || t)) / 1000);
    this.last = t;
    this.update(dt);
    this.draw(t / 1000);
    this.cb.onFrame?.(this.camY, this.depth);
    this.raf = requestAnimationFrame((tt) => this.frame(tt));
  }

  private update(dt: number) {
    if (this.t < 1) {
      const dist = Math.abs(this.to - this.from);
      const dur = 0.8 + Math.min(1.6, dist / 400);
      this.t = Math.min(1, this.t + dt / dur);
      const e = 1 - Math.pow(1 - this.t, 3);
      this.depth = this.from + (this.to - this.from) * e;
      if (Math.random() < 0.5) this.spawn(this.shaftX + (Math.random() - 0.5) * 30, this.depth - 10, '#c8bca4', 0.3);
      if (Math.random() < 0.08) this.spawn(this.shaftX + (Math.random() - 0.5) * 20, this.depth - 20, '#efe2c4', 1, true);
      this.camTarget = this.digCam(this.depth);
    }
    if (!this.atStreet) {
      const idx = FLOORS.indexOf(floorAt(this.depth + 1));
      if (idx > this.floorIndex) {
        this.floorIndex = idx;
        this.cb.onFloorEnter?.(FLOORS[idx]);
      }
    }
    const k = this.reduceMotion ? 1 : Math.min(1, dt * 3.2);
    this.camY += (this.camTarget - this.camY) * k;
    this.shake = Math.max(0, this.shake - dt);
    for (const p of this.particles) {
      p.vy += (p.page ? 25 : 140) * dt;
      p.x += (p.vx + (p.page ? Math.sin(p.life * 8) * 20 : 0)) * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const c of this.clouds) {
      c.x += c.speed * dt;
      if (c.x > this.w + 10) c.x = -c.w - 10;
    }
  }

  private draw(time: number) {
    const { ctx, w, h } = this;
    const shakeX = this.shake > 0 ? Math.round((Math.random() - 0.5) * 3) : 0;
    const cam = Math.round(this.camY);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(shakeX, -cam);

    if (cam < 0) {
      ctx.drawImage(this.sky, 0, -this.skyH);
      if (this.night) {
        this.stars.forEach(([sx, sy], i) => {
          if ((Math.sin(time * 2 + i) + 1) / 2 > 0.25) {
            ctx.fillStyle = i % 5 === 0 ? '#ffffff' : '#9aa6d8';
            ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1);
          }
        });
      }
      for (const c of this.clouds) this.cloud(c);
    }

    const top = Math.max(0, cam);
    const bottom = Math.min(this.library.height, cam + h);
    if (bottom > top) ctx.drawImage(this.library, 0, top, w, bottom - top, 0, top, w, bottom - top);

    // flickering flames
    for (const [x, y] of this.flames) {
      if (y < cam - 4 || y > cam + h + 4) continue;
      if (hash(x, Math.floor(time * 8)) > 0.5) {
        ctx.fillStyle = '#ffd25a';
        ctx.fillRect(x, y - 1, 1, 1);
      }
    }

    this.lift();
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.page ? 2 : 1, p.page ? 1 + (Math.sin(p.life * 10) > 0 ? 1 : 0) : 1);
    }
    ctx.restore();
  }

  private cloud(c: Cloud) {
    const { ctx } = this;
    const x = Math.round(c.x);
    const y = Math.round(c.y);
    const w = Math.round(c.w);
    ctx.fillStyle = this.night ? 'rgba(120,130,180,0.35)' : '#fbf3e6';
    ctx.fillRect(x, y, w, 5);
    ctx.fillRect(x + 4, y - 4, w - 10, 4);
    ctx.fillRect(x + Math.round(w * 0.3), y - 8, Math.round(w * 0.35), 4);
    ctx.fillStyle = this.night ? 'rgba(90,100,150,0.35)' : '#e8d6c4';
    ctx.fillRect(x + 2, y + 5, w - 4, 2);
  }

  private lift() {
    const { ctx } = this;
    const sx = this.shaftX;
    const by = Math.round(this.depth);
    const cageH = 20;
    const top = by - cageH;
    // cable
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(sx, -31, 1, top + 31);
    // cage
    ctx.fillStyle = 'rgba(40,26,14,0.85)';
    ctx.fillRect(sx - 6, top, 12, cageH);
    const lib = sprite('librarian');
    ctx.drawImage(lib, sx - 4, by - lib.height - 1);
    ctx.fillStyle = '#d8a94a';
    ctx.fillRect(sx - 6, top, 12, 2);
    ctx.fillRect(sx - 6, by - 1, 12, 1);
    ctx.fillRect(sx - 6, top, 1, cageH);
    ctx.fillRect(sx + 5, top, 1, cageH);
    ctx.fillStyle = 'rgba(184,134,46,0.7)';
    for (let x = sx - 3; x < sx + 5; x += 3) ctx.fillRect(x, top + 2, 1, cageH - 3);
    ctx.fillStyle = '#5a3e1a';
    ctx.fillRect(sx - 1, top - 2, 3, 2);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
  }
}

function disc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  for (let y = -r; y <= r; y++) {
    const half = Math.round(Math.sqrt(r * r - y * y));
    ctx.fillRect(cx - half, cy + y, half * 2 + 1, 1);
  }
}
