# Klade – die tägliche Grabung

Ein tägliches Browser-Quiz über Tiere: 7 Fragen, 25 Sekunden pro Frage,
und **seltenere Antworten graben tiefer** durch die Erdgeschichte –
vom Mutterboden bis zur glühenden jungen Erde vor 4,57 Mrd. Jahren.

Aktueller Stand: **Grafik-Prototyp** (Phase 1 aus [PLAN.md](PLAN.md)).
Die Fragen und Seltenheitsstufen sind von Hand geschätzte Beispieldaten.

## Entwicklung

```bash
npm install
npm run dev
```

Weitere Befehle: `npm run build`, `npm run check`.

## Aufbau

- `src/game/scene.ts` – Canvas-Szene: Himmel, Grabungsplatz, prozeduraler Gesteins-Querschnitt, Kamera, Partikel
- `src/game/strata.ts` – Erdzeitalter, Zeit→Tiefe-Abbildung, Fakten, Fossil-Positionen
- `src/game/sprites.ts` – handgezeichnete Pixel-Sprites als Zeichen-Raster
- `src/game/prompts.ts` – Beispiel-Fragen mit Seltenheitsstufen, Antwortprüfung
- `src/App.svelte` – Startbildschirm, HUD, Fragen, Ergebnis
