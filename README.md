# Deep Stacks – the daily descent

A daily browser quiz about books: 7 prompts, 25 seconds each, and
**rarer books go deeper** – a brass lift carries you from the Bestseller Hall
down through eleven floors of a vast library to the scrolls of Alexandria.

Current state: **graphics prototype** (see [PLAN.md](PLAN.md), in German).
Prompts and rarity tiers are hand-estimated sample data.

## Development

```bash
npm install
npm run dev
```

Also: `npm run build`, `npm run check`.

## Layout

- `src/game/scene.ts` – canvas scene: street with bookshop, procedural library cross-section, lift, camera, particles
- `src/game/levels.ts` – floors, depth scale, facts, decor placement
- `src/game/sprites.ts` – hand-drawn pixel sprites as character grids, tiny pixel font
- `src/game/prompts.ts` – sample prompts with rarity tiers, answer matching
- `src/App.svelte` – start screen, HUD, prompts, result card
