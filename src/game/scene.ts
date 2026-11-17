// Canvas-Szene: Himmel, Grabungsplatz und der Querschnitt durch die Erdgeschichte.
// Alle Koordinaten sind Kunstpixel; y = 0 ist die Erdoberfläche, positive y gehen in die Tiefe.
import { ERAS, FOSSILS, MAX_DEPTH, ageToDepth, depthToAge, eraAtAge, type Era } from './strata';
import { sprite } from './sprites';

type RGB = [number, number, number];

const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const shade = (c: RGB, f: number): RGB =>
  f < 0 ? (c.map((v) => v * (1 + f)) as RGB) : (c.map((v) => v + (255 - v) * f) as RGB);
const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => v + (b[i] - v) * t) as RGB;
const css = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const SKY_DAY = ['#3d7fbf', '#5fa8d3', '#9cc9dd', '#d6e2c9', '#f4d2a2'].map(hex);
const SKY_NIGHT = ['#070b1f', '#0e1634', '#1a2150', '#2f2d66', '#523c6c'].map(hex);

interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string }
interface Cloud { x: number; y: number; w: number; speed: number }

export interface SceneCallbacks {
  onFrame?: (camY: number, drillY: number) => void;
  onEraEnter?: (era: Era) => void;
}

export class Scene {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  /** CSS-Pixel pro Kunstpixel */
  px = 4;
  w = 0;
  h = 0;
  readonly skyH = 210;
  private terrain!: HTMLCanvasElement;
  private sky!: HTMLCanvasElement;
  private night = false;
  private clouds: Cloud[] = [];
  private particles: Particle[] = [];
  private stars: [number, number][] = [];

  camY = -150;
  camTarget = -150;
  drillY = 4;
  private drillFrom = 4;
  private drillTo = 4;
  private drillT = 1;
  private eraIndex = 0;
  private shake = 0;
  private last = 0;
  private raf = 0;
  private atSky = true;
  private reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(canvas: HTMLCanvasElement, private cb: SceneCallbacks = {}) {
    this.canvas = canvas;
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
    this.buildTerrain();
    if (this.atSky) this.camY = this.camTarget = this.skyCam();
    this.clouds = Array.from({ length: Math.max(3, Math.round(this.w / 90)) }, (_, i) => ({
      x: (i / 3) * this.w * 0.9 + hash(i, 7) * 40,
      y: -this.skyH + 30 + hash(i, 3) * 90,
      w: 22 + hash(i, 5) * 30,
      speed: 1.5 + hash(i, 9) * 2.5,
    }));
    this.stars = Array.from({ length: 70 }, (_, i) => [hash(i, 11) * this.w, -this.skyH + hash(i, 13) * (this.skyH - 50)]);
  }

  // ---------- Himmel ----------
  private buildSky() {
    if (!this.w) return;
    const c = document.createElement('canvas');
    c.width = this.w;
    c.height = this.skyH;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(this.w, this.skyH);
    const stops = this.night ? SKY_NIGHT : SKY_DAY;
    for (let y = 0; y < this.skyH; y++) {
      const pos = (y / this.skyH) * (stops.length - 1);
      const i = Math.floor(pos);
      const frac = pos - i;
      for (let x = 0; x < this.w; x++) {
        const t = BAYER[(y % 4) * 4 + (x % 4)] / 16;
        const col = stops[Math.min(stops.length - 1, frac > t ? i + 1 : i)];
        const o = (y * this.w + x) * 4;
        img.data[o] = col[0];
        img.data[o + 1] = col[1];
        img.data[o + 2] = col[2];
        img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // Sonne bzw. Mond, tief am linken Himmel
    const sx = Math.round(this.w * 0.18);
    const sy = this.skyH - 70;
    const r = 13;
    ctx.fillStyle = this.night ? 'rgba(220,226,255,0.12)' : 'rgba(255,214,140,0.25)';
    this.disc(ctx, sx, sy, r + 6);
    ctx.fillStyle = this.night ? '#e9ecf5' : '#ffc46b';
    this.disc(ctx, sx, sy, r);
    ctx.fillStyle = this.night ? '#c9cede' : '#ffdb94';
    this.disc(ctx, sx - 3, sy - 3, r - 6);

    // Hügel in zwei Ebenen
    const far = this.night ? hex('#242a4a') : hex('#9ab27a');
    const near = this.night ? hex('#1a2238') : hex('#77a058');
    for (let x = 0; x < this.w; x++) {
      const hf = 26 + Math.sin(x * 0.021) * 9 + Math.sin(x * 0.057 + 1) * 4;
      const hn = 13 + Math.sin(x * 0.034 + 2) * 6 + Math.sin(x * 0.11) * 2;
      ctx.fillStyle = css(far);
      ctx.fillRect(x, this.skyH - Math.round(hf), 1, Math.round(hf));
      ctx.fillStyle = css(near);
      ctx.fillRect(x, this.skyH - Math.round(hn), 1, Math.round(hn));
    }
    this.sky = c;
  }

  private disc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
    for (let y = -r; y <= r; y++) {
      const half = Math.round(Math.sqrt(r * r - y * y));
      ctx.fillRect(cx - half, cy + y, half * 2 + 1, 1);
    }
  }

  // ---------- Untergrund ----------
  private buildTerrain() {
    const W = this.w;
    const H = MAX_DEPTH + 60;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(W, H);
    const d = img.data;

    const eras = ERAS.map((e) => ({
      e,
      top: Math.round(ageToDepth(e.end)),
      base: hex(e.base),
      alt: hex(e.alt),
      dark: shade(hex(e.base), -0.38),
      edge: shade(hex(e.base), -0.28),
    }));
    const grass = [hex('#7cb85a'), hex('#5f9a44'), hex('#4c7d37')];

    for (let x = 0; x < W; x++) {
      const tops = eras.map((r, i) =>
        i === 0 ? 0 : r.top + Math.round(Math.sin(x * 0.09 + i * 1.7) * 1.5 + Math.sin(x * 0.23 + i) * 1),
      );
      let k = 0;
      for (let y = 0; y < H; y++) {
        while (k + 1 < eras.length && y >= tops[k + 1]) k++;
        const r = eras[k];
        const h = hash(x, y);
        let col: RGB = r.base;
        const wob = Math.round(Math.sin(x * 0.05 + k) * 2);
        switch (r.e.pattern) {
          case 'soil':
            if (h < 0.16) col = r.alt;
            else if (h > 0.94) col = r.dark;
            break;
          case 'speckle':
            if (h < 0.18) col = r.alt;
            else if (h > 0.95) col = r.dark;
            break;
          case 'chalk':
            if (h < 0.14) col = r.alt;
            else if (h > 0.988) col = hex('#3d3a3a');
            break;
          case 'bands': {
            const bh = r.e.bandH ?? 4;
            if (Math.floor((y + wob) / bh) % 2 === 0) col = r.alt;
            if (h > 0.965) col = r.dark;
            break;
          }
          case 'coal': {
            const m = (y + wob + 400) % 16;
            if (m < 5) col = h < 0.1 ? shade(r.alt, 0.25) : r.alt;
            else if (h < 0.15) col = shade(r.base, 0.08);
            break;
          }
          case 'bif': {
            const band = Math.floor((y + wob) / 3);
            if (hash(band, 77) < 0.42) col = mix(r.alt, r.base, h * 0.35);
            else if (h < 0.1) col = shade(r.base, 0.1);
            break;
          }
          case 'magma': {
            const v = Math.sin(x * 0.15 + y * 0.11) + Math.sin(x * 0.07 - y * 0.21) + h * 0.4;
            if (v > 1.75) col = hex('#ffb23a');
            else if (v > 1.25) col = r.alt;
            else if (h > 0.9) col = r.dark;
            break;
          }
        }
        if (k > 0 && y === tops[k]) col = r.edge;
        if (y < 3) col = grass[y];
        else if (y < 5 && h < 0.5) col = grass[2];
        const o = (y * W + x) * 4;
        d[o] = col[0];
        d[o + 1] = col[1];
        d[o + 2] = col[2];
        d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // Fossilien einbacken, Abstand zum Schacht halten
    for (const [name, age, fx] of FOSSILS) {
      const s = sprite(name);
      let x = Math.round(fx * W - s.width / 2);
      const sx = this.shaftX;
      if (Math.abs(x + s.width / 2 - sx) < 24) x = x < sx ? sx - 24 - s.width : sx + 24;
      ctx.drawImage(s, x, Math.round(ageToDepth(age) - s.height / 2));
    }
    this.terrain = c;
  }

  // ---------- Steuerung ----------
  /** Kamera auf den Startbildschirm (Himmel) oder auf die Grabung */
  focusSky() {
    this.atSky = true;
    this.camTarget = this.skyCam();
  }

  /** Startbildschirm: Oberfläche bei ca. 60 % der Höhe, darunter Erde für die Buttons */
  private skyCam() {
    return -Math.min(this.skyH, Math.round(this.h * 0.6));
  }

  focusDig() {
    this.atSky = false;
    this.camTarget = this.digCam(this.drillY);
  }

  private digCam(dy: number) {
    return Math.max(dy - this.h * 0.42, -this.h * 0.45);
  }

  /** Bohrer auf eine Tiefe (in Kunstpixeln) bewegen */
  digTo(depth: number) {
    const target = Math.max(4, Math.min(MAX_DEPTH, depth));
    this.drillFrom = this.drillY;
    this.drillTo = target;
    this.drillT = this.reduceMotion ? 1 : 0;
    if (this.reduceMotion) this.drillY = target;
  }

  reset() {
    this.drillY = this.drillFrom = this.drillTo = 4;
    this.drillT = 1;
    this.eraIndex = 0;
    this.particles = [];
  }

  /** Ein Steinbrocken fällt auf den Bohrer (falsche Antwort) */
  thud() {
    this.shake = 0.35;
    for (let i = 0; i < 6; i++) this.spawn(this.shaftX, this.drillY - 4, '#6b6560', 0.6);
  }

  private spawn(x: number, y: number, color: string, strength = 1) {
    if (this.reduceMotion) return;
    this.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 60 * strength,
      vy: -(20 + Math.random() * 50) * strength,
      life: 0.6 + Math.random() * 0.5,
      color,
    });
  }

  // ---------- Zeichnen ----------
  private frame(t: number) {
    const dt = Math.min(0.05, (t - (this.last || t)) / 1000);
    this.last = t;
    this.update(dt);
    this.draw(t / 1000);
    this.cb.onFrame?.(this.camY, this.drillY);
    this.raf = requestAnimationFrame((tt) => this.frame(tt));
  }

  private update(dt: number) {
    if (this.drillT < 1) {
      const dist = Math.abs(this.drillTo - this.drillFrom);
      const dur = 0.8 + Math.min(1.6, dist / 400);
      this.drillT = Math.min(1, this.drillT + dt / dur);
      const e = 1 - Math.pow(1 - this.drillT, 3);
      this.drillY = this.drillFrom + (this.drillTo - this.drillFrom) * e;
      const era = eraAtAge(depthToAge(this.drillY));
      if (Math.random() < 0.8) this.spawn(this.shaftX + (Math.random() - 0.5) * 6, this.drillY, era.alt);
      this.camTarget = this.digCam(this.drillY);
    }
    const idx = ERAS.indexOf(eraAtAge(depthToAge(this.drillY)));
    if (idx > this.eraIndex) {
      this.eraIndex = idx;
      this.cb.onEraEnter?.(ERAS[idx]);
    }
    const k = this.reduceMotion ? 1 : Math.min(1, dt * 3.2);
    this.camY += (this.camTarget - this.camY) * k;
    this.shake = Math.max(0, this.shake - dt);
    for (const p of this.particles) {
      p.vy += 140 * dt;
      p.x += p.vx * dt;
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

    // Himmel
    if (cam < 0) {
      ctx.drawImage(this.sky, 0, -this.skyH);
      if (this.night) {
        for (const [i, [sx, sy]] of this.stars.entries()) {
          if ((Math.sin(time * 2 + i) + 1) / 2 > 0.25) {
            ctx.fillStyle = i % 5 === 0 ? '#ffffff' : '#9aa6d8';
            ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1);
          }
        }
      }
      for (const c of this.clouds) this.cloud(c);
      ctx.fillStyle = this.night ? '#2a3550' : '#c8e0a8';
      ctx.fillRect(0, -this.skyH - 400, w, 400); // falls oberhalb gescrollt
    }

    // Untergrund (nur den sichtbaren Ausschnitt kopieren)
    const top = Math.max(0, cam);
    const bottom = Math.min(this.terrain.height, cam + h);
    if (bottom > top) ctx.drawImage(this.terrain, 0, top, w, bottom - top, 0, top, w, bottom - top);

    // Magma flackert
    const magmaTop = ageToDepth(4031);
    if (cam + h > magmaTop) {
      for (let i = 0; i < 40; i++) {
        const x = Math.floor(hash(i, Math.floor(time * 6)) * w);
        const y = Math.floor(magmaTop + hash(i, 99) * (MAX_DEPTH - magmaTop + 60));
        ctx.fillStyle = i % 3 ? '#ff8a2a' : '#ffd25a';
        ctx.fillRect(x, y, 1, 1);
      }
    }

    this.digSite();
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }
    ctx.restore();
  }

  private cloud(c: Cloud) {
    const { ctx } = this;
    const x = Math.round(c.x);
    const y = Math.round(c.y);
    const w = Math.round(c.w);
    ctx.fillStyle = this.night ? 'rgba(120,130,180,0.35)' : '#ffffff';
    ctx.fillRect(x, y, w, 5);
    ctx.fillRect(x + 4, y - 4, w - 10, 4);
    ctx.fillRect(x + Math.round(w * 0.3), y - 8, Math.round(w * 0.35), 4);
    ctx.fillStyle = this.night ? 'rgba(90,100,150,0.35)' : '#dce8f0';
    ctx.fillRect(x + 2, y + 5, w - 4, 2);
  }

  private digSite() {
    const { ctx } = this;
    const sx = this.shaftX;
    const dy = Math.round(this.drillY);

    // Schacht
    ctx.fillStyle = 'rgba(12,8,6,0.62)';
    ctx.fillRect(sx - 5, 1, 11, dy - 1);
    ctx.fillStyle = 'rgba(12,8,6,0.35)';
    ctx.fillRect(sx - 6, 1, 1, dy - 1);
    ctx.fillRect(sx + 6, 1, 1, dy - 1);
    // Leiter-Sprossen
    ctx.fillStyle = 'rgba(160,120,70,0.5)';
    for (let y = 6; y < dy - 6; y += 6) ctx.fillRect(sx - 4, y, 3, 1);

    // Dreibein mit Seilrolle
    const wood = '#7a5232';
    for (let i = 0; i <= 22; i++) {
      ctx.fillStyle = wood;
      ctx.fillRect(Math.round(sx - 14 + (14 * i) / 22), -i, 1, 1);
      ctx.fillRect(Math.round(sx + 14 - (14 * i) / 22), -i, 1, 1);
    }
    ctx.fillStyle = '#3b2a1e';
    ctx.fillRect(sx - 1, -24, 3, 3);
    ctx.fillStyle = '#d8c9a8';
    ctx.fillRect(sx, -22, 1, dy - 4 + 22);

    // Kübel / Bohrkopf
    const b = sprite('bucket');
    ctx.drawImage(b, sx - 4, dy - 6);

    // Zelt, Flagge, Paläontologin
    const tent = sprite('tent');
    ctx.drawImage(tent, sx - 62, -tent.height);
    const flag = sprite('flag');
    ctx.drawImage(flag, sx - 70, -flag.height);
    const dg = sprite('digger');
    ctx.drawImage(dg, sx - 30, -dg.height);
    // Erdhaufen neben dem Schacht
    ctx.fillStyle = '#6e4b30';
    ctx.fillRect(sx + 9, -2, 12, 2);
    ctx.fillRect(sx + 11, -4, 8, 2);
    ctx.fillRect(sx + 13, -5, 4, 1);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
  }
}
