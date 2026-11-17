// Fetches the raw book data from Wikidata and caches each query in scripts/.cache.
// Wikidata's query service is rate-limited, so queries run one at a time with a pause.
// Re-running skips queries that are already cached; pass --refresh to fetch again.
//
//   node scripts/fetch-wikidata.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const CACHE = new URL('./.cache/', import.meta.url);
const ENDPOINT = 'https://query.wikidata.org/sparql';
const UA = 'deep-stacks-dev/0.1 (daily book quiz prototype)';
const PAUSE_MS = 62_000;
const refresh = process.argv.includes('--refresh');

const ENWIKI = '?art schema:about ?w; schema:isPartOf <https://en.wikipedia.org/>.';

// Works with an English Wikipedia article: [kind, type, min sitelinks, max sitelinks].
// The big "literary work" class is split by sitelinks so each query stays under the time limit.
// Further split by the length of the item id, for slices that still time out
function shards(name, type, min, max) {
  return [[37, 37], [38, 38], [39, 39], [0, 36], [40, 99]].map(([lo, hi]) => [`${name}-q${lo}`, type, min, max, lo, hi]);
}

const CATALOG_JOBS = [
  ['literaryWork-1', 'Q7725634', 1, 1],
  ...shards('literaryWork-2', 'Q7725634', 2, 2),
  ['literaryWork-3', 'Q7725634', 3, 4],
  ...shards('literaryWork-5', 'Q7725634', 5, 9),
  ['literaryWork-10', 'Q7725634', 10, 100000],
  ['novel', 'Q8261', 1, 100000],
  ['writtenWork', 'Q47461344', 1, 100000],
  ['book', 'Q571', 1, 100000],
  ['storyCollection', 'Q1279564', 1, 100000],
  ['graphicNovel', 'Q725377', 1, 100000],
  ['epicPoem', 'Q37484', 1, 100000],
];

const catalogQuery = (type, min, max, lo, hi) => `
SELECT ?w ?title ?s (MIN(?y) AS ?year) (SAMPLE(?al) AS ?author) WHERE {
  ?w wdt:P31 wd:${type}; wikibase:sitelinks ?s.
  FILTER(?s >= ${min} && ?s <= ${max})${lo === undefined ? '' : `
  FILTER(STRLEN(STR(?w)) >= ${lo} && STRLEN(STR(?w)) <= ${hi})`}
  ?art schema:about ?w; schema:isPartOf <https://en.wikipedia.org/>; schema:name ?title.
  OPTIONAL { ?w wdt:P577 ?d. BIND(YEAR(?d) AS ?y) }
  OPTIONAL { ?w wdt:P50 ?au. ?au rdfs:label ?al. FILTER(LANG(?al) = "en") }
} GROUP BY ?w ?title ?s`;

// Answer sets for rule-based prompts
const RULE_QUERIES = {
  // published under the name the author is known by, and that name is a pseudonym
  penname: `SELECT DISTINCT ?w WHERE {
    ?w wdt:P50 ?au. ?au wdt:P742 ?p; rdfs:label ?l.
    FILTER(LANG(?l) = "en" && LCASE(STR(?l)) = LCASE(STR(?p))) ${ENWIKI} }`,
  // Great Britain and Ireland are left out, otherwise every British or Irish novel would count
  island: `SELECT DISTINCT ?w WHERE { ?w wdt:P840 ?loc. ?loc wdt:P31/wdt:P279* wd:Q23442. FILTER(?loc NOT IN (wd:Q23666, wd:Q22890)) ${ENWIKI} }`,
  nobel: `SELECT DISTINCT ?w WHERE { ?w wdt:P50 ?au. ?au wdt:P166 wd:Q37922. ${ENWIKI} }`,
  film: `SELECT DISTINCT ?w WHERE { ?f wdt:P31 wd:Q11424; wdt:P144 ?w. ${ENWIKI} }`,
  russian: `SELECT DISTINCT ?w WHERE { ?w wdt:P407 wd:Q7737. ${ENWIKI} }`,
  french: `SELECT DISTINCT ?w WHERE { ?w wdt:P407 wd:Q150. ${ENWIKI} }`,
  japanese: `SELECT DISTINCT ?w WHERE { ?w wdt:P407 wd:Q5287. ${ENWIKI} }`,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(query) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ query }),
    });
    if (res.ok) {
      // the service occasionally emits raw control characters inside strings
      const json = JSON.parse((await res.text()).replace(/[\u0000-\u001f]/g, ' '));
      return json.results.bindings.map((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])));
    }
    const wait = res.status === 429 ? Number(res.headers.get('retry-after') || 65) * 1000 : PAUSE_MS;
    console.warn(`  HTTP ${res.status}, retry ${attempt} in ${Math.round(wait / 1000)} s`);
    await sleep(wait);
  }
  throw new Error('giving up');
}

await mkdir(CACHE, { recursive: true });
const jobs = [
  ...CATALOG_JOBS.map(([name, type, min, max, lo, hi]) => [`catalog-${name}`, catalogQuery(type, min, max, lo, hi)]),
  ...Object.entries(RULE_QUERIES).map(([name, q]) => [`rule-${name}`, q]),
];

let first = true;
for (const [name, query] of jobs) {
  const file = new URL(`${name}.json`, CACHE);
  if (!refresh && existsSync(file)) {
    console.log(`${name}: cached (${JSON.parse(await readFile(file, 'utf8')).length} rows)`);
    continue;
  }
  if (!first) await sleep(PAUSE_MS);
  first = false;
  const t = Date.now();
  console.log(`${name}: querying …`);
  try {
    const rows = await run(query);
    await writeFile(file, JSON.stringify(rows));
    console.log(`${name}: ${rows.length} rows in ${((Date.now() - t) / 1000).toFixed(1)} s`);
  } catch (e) {
    console.error(`${name}: failed – ${e.message}`);
  }
}
