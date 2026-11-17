# Deep Stacks – the daily descent

> 7 prompts · 25 seconds each · rarer books go deeper

Ein tägliches Browser-Spiel über Bücher, in der Familie von Krillion und Farflung.
Zu jeder Frage („a book with a number in its title“) gibt es viele richtige
Antworten, und **je seltener das genannte Buch, desto tiefer steigst du hinab** –
von der Bestseller-Halle bis zu den Schriftrollen von Alexandria.
Spielsprache: **Englisch**.

---

## 1. Spielablauf

1. **Start:** Pixel-Straße, eine kleine Buchhandlung, im Eingang ein alter Bücheraufzug.
   Button **▼ ENTER THE STACKS ▼**, „Descent #N“, Archiv.
2. **7 Fragen** mit je 25 Sekunden, zum Beispiel:
   - „A book with a number in its title“
   - „A book whose author used a pen name“
   - „A novel set on an island“
   - „A book that has been banned somewhere“
   - „A book narrated by someone who isn't human“
3. Eingabe mit Autovervollständigung über einen großen Buchkatalog (Titel + Autor).
   Nur Bücher, die die Einschränkung erfüllen, zählen.
4. **Wertung:** Bekanntes Buch (*1984*) = flach, seltenes Buch (*Flush* von Virginia Woolf) = tief.
   Der Aufzug sinkt nach jeder Antwort durch die Stockwerke.
5. **Ergebnis:** erreichte Tiefe in Metern und Stockwerk, Fundstück (z. B. eine Schriftrolle),
   „what others answered“, Teilen.

## 2. Wertung & Seltenheit

- Tiefe = Summe der Seltenheitspunkte, linear auf die Tiefe der Bibliothek (~480 m) abgebildet.
- **Seltenheit, Phase A (ohne Backend):** Schätzwert aus Bekanntheit:
  Anzahl Ausgaben/Bewertungen (Open Library), Wikipedia-Seitenaufrufe, Sprachversionen.
- **Seltenheit, Phase B (mit Backend):** echte Antwortverteilung aller Spieler pro Tag.
- Stufen: common · uncommon · rare · very rare (10 / 25 / 55 / 100 Punkte).
- Falsche Antwort oder Zeit abgelaufen: 0 Punkte, ein Buch fällt auf den Aufzug.

## 3. Grafik

### 3a. Stil
- Pixel-Art mit fester Pixelgröße (4 px, mobil 3 px), Canvas mit `image-rendering: pixelated`.
- Schriften: *Pixelify Sans* (Überschriften, Zahlen), *Silkscreen* (Labels), System-Grotesk (Fließtext).
- **Logo „DEEP STACKS“** mit Buchrücken-Streifen als Füllung.
- Farbwelt: Messing, Ochsenblut, Pergament, dunkles Holz. Nach unten wird es dunkler und wärmer.

### 3b. Die Bibliothek als Querschnitt
Oben die Straße mit Buchhandlung, darunter ein senkrechter Schnitt durch elf Stockwerke.
Durch die Mitte läuft der Aufzugsschacht.

| Stockwerk | Look |
|---|---|
| B1 Bestseller Hall | helle Wand, knallbunte Buchrücken, Lampen |
| B2 Fiction A–Z | warme Holzregale, bunte Rücken, Leiter |
| B3 Reference | gleichfarbige Lexikon-Reihen mit Goldband, Globus |
| B4 Periodicals & Microfilm | Metallregale, Zeitschriftenkästen |
| B5 Closed Stacks | Fahrregale, gedämpfte Rücken, Neonlicht |
| B6 The Archive | Archivkartons, Zettelkatalog |
| B7 Rare Books Room | Ochsenblut-Wand, Lederrücken mit Gold, Vitrine |
| B8 The Forgotten Vault | Staub, Spinnweben, Lücken, Kerze |
| B9 Medieval Scriptorium | Steinquader, dicke Folianten an Ketten |
| B10 Catacombs of Lost Books | Steinbögen, zerfallende Stapel |
| B11 Library of Alexandria | Sandstein, Rollenfächer mit Schriftrollen, Fackeln |

- **Fakten an den Tiefenmarken**, z. B. „Moby-Dick sold about 3,000 copies in Melville's lifetime“
  oder „The Diamond Sutra, 868 AD — the oldest dated printed book“.
- **Skala rechts:** Stockwerke und Meter, mit mitlaufender Markierung.
- **HUD:** DEPTH (m), Stockwerk, PROMPT x/7, SCORE, Timer-Balken.

### 3c. Animationen
- Aufzug sinkt mit Nachfedern, Staub und lose Seiten wirbeln.
- Neues Stockwerk: Banner mit Namen („▼ B7 · RARE BOOKS ROOM“).
- Falsche Antwort: Buch fällt, Szene wackelt.
- `prefers-reduced-motion`: nur Überblendungen.

### 3d. Ergebnis & Teilen
- Ergebnis als **Leihkarte** mit Stempel.
- Text zum Teilen: `DEEP STACKS #12 📚 312 m · Rare Books Room` + eine Zeile Felder.
- Bild zum Teilen: Canvas-Rendering des Querschnitts mit Tiefenmarke (später).

### 3e. Asset-Produktion
- Regale und Buchrücken **prozedural** (Farbpalette + Muster pro Stockwerk),
  Deko (Lampen, Globus, Vitrine, Kerze, Schriftrollen …) als handgezeichnete Sprites.

## 4. Inhalte & Daten

- **Buchkatalog** (~5.000–10.000 Werke): Titel, Alternativtitel, Autor, Jahr,
  Bekanntheit. Quellen: Wikidata, Open Library.
- **Fragen** werden kuratiert. Gültige Antwortmengen werden per Wikidata-Abfrage
  (z. B. „Autor hat Pseudonym“, „Titel enthält Zahl“) vorgeschlagen und von Hand geprüft.
- Seite „Rulings“ für strittige Fälle (Zählt eine Kurzgeschichte? Ein Theaterstück?).

## 5. Technik

- Vite + TypeScript + Svelte 5, statisch gebaut.
- Szene in Canvas 2D, Oberfläche als HTML darüber.
- Spielstand in `localStorage`; Phase B: kleines Backend für echte Seltenheit.

## 6. Phasen

1. **Grafik-Prototyp** ✅ (umgebaut auf die Bibliothek)
2. **Spielkern:** Autovervollständigung, robuste Titelprüfung, Tagesrätsel, Spielstand & Serie
3. **Daten-Pipeline:** Buchkatalog, Fragen-Werkzeug, 30 Tagesrätsel vorab
4. **Finale Pixel-Art:** Sprites, Logo, Animationen
5. **Teilen & Feinschliff:** Bild teilen, Archiv, Statistik, Barrierefreiheit
6. **Backend für echte Seltenheit**, Betatest

## 7. Risiken

- **Strittige Antworten** (Ist *The Tempest* ein „novel“? Nein): präzise Formulierung, Rulings-Seite.
- **Titelvarianten und Übersetzungen:** Alias-Liste pro Werk, Autovervollständigung statt Freitext.
- **Seltenheit ohne Spielerdaten ungenau:** als Beta kennzeichnen, früh auf echte Daten umstellen.
- **Nähe zu den Vorbildern:** gleiche Genre-Formel, aber eigene Metapher, Palette, Figuren und Texte.
