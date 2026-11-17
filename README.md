# Deep Stacks – the daily descent

A daily browser quiz about books: 7 prompts, 25 seconds each, and
**rarer books go deeper** – a brass lift carries you from the Bestseller Hall
down through eleven floors of a vast library to the scrolls of Alexandria.

Current state: **phase 2** (see [PLAN.md](PLAN.md), in German): daily descent with a
real book catalogue from Wikidata, autocomplete, saved progress and streaks.
Rarity is estimated from how many Wikipedia editions cover a book.

## Development

```bash
npm install
npm run dev
```

Also: `npm run build`, `npm run check`.

### Game data

```bash
npm run data:fetch   # query Wikidata (rate-limited, results cached in scripts/.cache)
npm run data:build   # write public/data/catalog.json and prompts.json
```

Prompts live in `scripts/prompt-defs.mjs`. Behind a proxy, Node's fetch needs
`NODE_USE_ENV_PROXY=1` (set by the script) and possibly `NODE_EXTRA_CA_CERTS`.

## Layout

- `src/game/scene.ts` – canvas scene: street with bookshop, procedural library cross-section, lift, camera, particles
- `src/game/levels.ts` – floors, depth scale, facts, decor placement
- `src/game/sprites.ts` – hand-drawn pixel sprites as character grids, tiny pixel font
- `src/game/catalog.ts` – loads catalogue and prompts, autocomplete search, scoring per prompt
- `src/game/daily.ts` – daily prompt selection, saved progress, streaks
- `src/game/scoring.ts` – rarity tiers and points
- `src/components/BookInput.svelte` – answer field with suggestions
- `src/App.svelte` – start screen, HUD, prompts, result card
