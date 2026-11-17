// Book catalogue, prompt pool and search.
import { editDistance, norm, normTitle } from './text';
import type { Tier } from './scoring';
import { tierFromPopularity } from './scoring';

export interface Book {
  id: number;
  title: string;
  author: string;
  year: number;
  /** popularity: number of Wikipedia language editions */
  s: number;
  /** normalised title without article */
  n: string;
  words: string[];
  authorWords: string[];
}

export interface Prompt {
  id: string;
  text: string;
  answers: Set<number>;
  tiers: Record<number, Tier>;
}

export interface GameData {
  books: Book[];
  byId: Map<number, Book>;
  prompts: Prompt[];
}

let loading: Promise<GameData> | undefined;

export function loadData(): Promise<GameData> {
  loading ??= (async () => {
    const base = import.meta.env.BASE_URL;
    const [cat, pr] = await Promise.all([
      fetch(`${base}data/catalog.json`).then((r) => r.json()),
      fetch(`${base}data/prompts.json`).then((r) => r.json()),
    ]);
    const books: Book[] = cat.books.map(([id, title, author, year, s]: [number, string, string, number, number]) => {
      const n = normTitle(title);
      return { id, title, author, year, s, n, words: n.split(' '), authorWords: norm(author).split(' ').filter(Boolean) };
    });
    const byId = new Map(books.map((b) => [b.id, b]));
    const prompts: Prompt[] = pr.prompts.map((p: { id: string; text: string; answers: number[]; tiers: Record<string, Tier> }) => ({
      id: p.id,
      text: p.text,
      answers: new Set(p.answers),
      tiers: Object.fromEntries(Object.entries(p.tiers).map(([k, v]) => [Number(k), v])),
    }));
    return { books, byId, prompts };
  })();
  return loading;
}

/** How a book scores for a prompt: 0 if it doesn't fit */
export function tierFor(prompt: Prompt, book: Book): Tier {
  if (book.id in prompt.tiers) return prompt.tiers[book.id];
  if (!prompt.answers.has(book.id)) return 0;
  return tierFromPopularity(book.s);
}

const startsWithWords = (words: string[], q: string[]) =>
  q.every((t, i) => (i === q.length - 1 ? words[i]?.startsWith(t) : words[i] === t));
const allPrefix = (words: string[], q: string[]) => q.every((t) => words.some((w) => w.startsWith(t)));
const allFuzzy = (words: string[], q: string[]) =>
  q.every((t) => words.some((w) => w.startsWith(t) || (t.length >= 4 && (editDistance(t, w.slice(0, t.length), 1) <= 1 || editDistance(t, w, 1) <= 1))));

/** Autocomplete: best matches first, popular books win ties */
export function search(books: Book[], query: string, limit = 8): Book[] {
  const q = normTitle(query).split(' ').filter(Boolean);
  if (!q.length || q.join('').length < 2) return [];
  const qs = q.join(' ');
  const scored: [number, Book][] = [];
  for (const b of books) {
    let score = 0;
    if (b.n === qs) score = 5;
    else if (startsWithWords(b.words, q)) score = 4;
    else if (allPrefix(b.words, q)) score = 3;
    else if (allPrefix([...b.words, ...b.authorWords], q)) score = 2;
    if (score) scored.push([score, b]);
  }
  if (scored.length < limit && q.join('').length >= 4) {
    const seen = new Set(scored.map(([, b]) => b.id));
    for (const b of books) {
      if (seen.has(b.id)) continue;
      if (allFuzzy(b.words, q)) scored.push([1, b]);
      if (scored.length > limit * 4) break;
    }
  }
  // books are pre-sorted by popularity, so a stable sort by score keeps that order within a score
  return scored.sort((a, b) => b[0] - a[0]).slice(0, limit).map(([, b]) => b);
}
