// Daily descent: which prompts are played on which day, and the saved progress.
import type { Prompt } from './catalog';
import { PROMPTS_PER_DAY, type Tier } from './scoring';

const START_DAY = Date.UTC(2026, 10, 17);
const DAY = 86_400_000;

/** Descent number for a date (UTC days since launch, starting at 1) */
export function descentNumber(now = Date.now()): number {
  return Math.max(1, Math.floor((now - START_DAY) / DAY) + 1);
}

/** Milliseconds until the next descent opens */
export function msUntilNext(now = Date.now()): number {
  return START_DAY + descentNumber(now) * DAY - now;
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

function pick(pool: Prompt[], seed: number): Prompt[] {
  const r = rng(seed);
  const arr = [...pool].sort((a, b) => (a.id < b.id ? -1 : 1));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, PROMPTS_PER_DAY);
}

/** The same seven prompts for everyone on a given day */
export const dailyPrompts = (pool: Prompt[], day: number) => pick(pool, day * 7919 + 17);

/** Seven random prompts for a practice round */
export const practicePrompts = (pool: Prompt[]) => pick(pool, Math.floor(Math.random() * 2 ** 31));

// ---------- saved progress ----------
export interface Round {
  bookId: number | null;
  title: string;
  tier: Tier;
  points: number;
}

interface DayRecord {
  rounds: Round[];
  done: boolean;
  depth?: number;
}

interface SaveFile {
  v: 1;
  days: Record<number, DayRecord>;
}

const KEY = 'deep-stacks:v1';

function read(): SaveFile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data?.v === 1 && data.days) return data;
    }
  } catch {
    /* storage unavailable */
  }
  return { v: 1, days: {} };
}

function write(data: SaveFile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable: progress lives only for this visit */
  }
}

export function loadDay(day: number): DayRecord | undefined {
  return read().days[day];
}

export function saveDay(day: number, record: DayRecord) {
  const data = read();
  data.days[day] = record;
  write(data);
}

export interface Stats {
  played: number;
  streak: number;
  bestDepth: number;
}

export function stats(today: number): Stats {
  const days = read().days;
  const done = Object.entries(days).filter(([, d]) => d.done);
  let streak = 0;
  // a streak survives until the end of today even if today isn't played yet
  for (let d = days[today]?.done ? today : today - 1; days[d]?.done; d--) streak++;
  return {
    played: done.length,
    streak,
    bestDepth: Math.max(0, ...done.map(([, d]) => d.depth ?? 0)),
  };
}
