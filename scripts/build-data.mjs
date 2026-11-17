// Builds the game data from the cached Wikidata queries:
//   public/data/catalog.json – every book the autocomplete knows
//   public/data/prompts.json – the prompt pool with the ids of all valid answers
//
//   node scripts/build-data.mjs
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { norm, normTitle } from '../src/game/text.ts';
import { PROMPT_DEFS } from './prompt-defs.mjs';

const CACHE = new URL('./.cache/', import.meta.url);
const OUT = new URL('../public/data/', import.meta.url);

const qid = (uri) => Number(uri.slice(uri.lastIndexOf('/Q') + 2));
const cleanTitle = (t) => t.replace(/\s*\([^)]*\)$/, '').trim();

// ---------- catalogue ----------
const books = new Map(); // id -> { id, title, author, year, s }
for (const file of (await readdir(CACHE)).filter((f) => f.startsWith('catalog-'))) {
  for (const r of JSON.parse(await readFile(new URL(file, CACHE), 'utf8'))) {
    const id = qid(r.w);
    const title = cleanTitle(r.title);
    if (!title || /^(list|lists|index|outline) of /i.test(title)) continue;
    const prev = books.get(id);
    const year = r.year ? Number(r.year) : undefined;
    books.set(id, {
      id,
      title,
      author: prev?.author || r.author || '',
      year: [prev?.year, year].filter((y) => y !== undefined && !Number.isNaN(y)).sort((a, b) => a - b)[0],
      s: Math.max(prev?.s ?? 0, Number(r.s)),
    });
  }
}
console.log(`catalogue: ${books.size} works from Wikidata`);

const byTitle = new Map();
const index = (b) => {
  const k = normTitle(b.title);
  if (!byTitle.has(k)) byTitle.set(k, []);
  byTitle.get(k).push(b);
};
books.forEach(index);

let customId = -1;
const unresolved = [];
function resolve(spec, { create = false } = {}) {
  const [title, author] = spec.split('|');
  let hits = byTitle.get(normTitle(title)) ?? [];
  if (author) {
    const a = norm(author).split(' ').pop();
    hits = hits.filter((b) => norm(b.author).includes(a));
  }
  if (hits.length) return hits.sort((x, y) => y.s - x.s)[0];
  if (!create) return undefined;
  // Not on Wikidata with an English article: add it by hand so it can still be answered
  const b = { id: customId--, title, author: author ?? '', year: undefined, s: 3 };
  books.set(b.id, b);
  index(b);
  unresolved.push(spec);
  return b;
}

// ---------- prompts ----------
const ruleSets = {};
for (const file of (await readdir(CACHE)).filter((f) => f.startsWith('rule-'))) {
  ruleSets[file.slice(5, -5)] = new Set(JSON.parse(await readFile(new URL(file, CACHE), 'utf8')).map((r) => qid(r.w)));
}

const prompts = [];
for (const def of PROMPT_DEFS) {
  const ids = new Set();
  const all = [...books.values()];
  const { rule } = def;
  if (rule.type === 'titleRegex') {
    const re = new RegExp(rule.pattern, 'i');
    for (const b of all) if (re.test(b.title)) ids.add(b.id);
  } else if (rule.type === 'oneWord') {
    for (const b of all) if (/^[^\s]+$/.test(b.title.replace(/^(the|a|an)\s+/i, '')) && b.title.length > 1) ids.add(b.id);
  } else if (rule.type === 'year') {
    for (const b of all) {
      if (b.year === undefined) continue;
      if ((rule.before === undefined || b.year < rule.before) && (rule.from === undefined || b.year >= rule.from)) ids.add(b.id);
    }
  } else if (rule.type === 'sparql') {
    const set = ruleSets[rule.query];
    if (!set) console.warn(`  ! ${def.id}: no cached query "${rule.query}"`);
    else for (const id of set) if (books.has(id)) ids.add(id);
  }
  for (const spec of def.include ?? []) ids.add(resolve(spec, { create: true }).id);
  for (const spec of def.exclude ?? []) {
    const b = resolve(spec);
    if (b) ids.delete(b.id);
  }
  const tiers = {};
  for (const [spec, tier] of Object.entries(def.tiers ?? {})) {
    const b = resolve(spec, { create: true });
    tiers[b.id] = tier;
    if (tier > 0) ids.add(b.id);
  }
  prompts.push({ id: def.id, text: def.text, answers: [...ids].sort((a, b) => a - b), tiers });
  console.log(`${def.id.padEnd(12)} ${String(ids.size).padStart(6)} answers`);
}

if (unresolved.length) console.log(`\nadded by hand (not found on Wikidata): ${unresolved.join('; ')}`);

// ---------- write ----------
await mkdir(OUT, { recursive: true });
const rows = [...books.values()]
  .sort((a, b) => b.s - a.s)
  .map((b) => [b.id, b.title, b.author, b.year ?? 0, b.s]);
await writeFile(new URL('catalog.json', OUT), JSON.stringify({ v: 1, books: rows }));
await writeFile(new URL('prompts.json', OUT), JSON.stringify({ v: 1, prompts }));

const sl = rows.map((r) => r[4]).sort((a, b) => a - b);
const q = (p) => sl[Math.floor(p * (sl.length - 1))];
console.log(`\nwrote ${rows.length} books; sitelinks p50=${q(0.5)} p75=${q(0.75)} p90=${q(0.9)} p97=${q(0.97)} p99=${q(0.99)}`);
