# Klade – die tägliche Grabung

> 7 Fragen · 25 Sekunden pro Frage · seltenere Antworten graben tiefer

Ein tägliches Browser-Spiel in der Familie von Krillion und Farflung. Gleiche Formel:
mehrere richtige Antworten pro Frage, und **Seltenheit bringt dich weiter** – hier
tiefer hinab durch die Erdgeschichte. Eigene Identität: Pixel-Grabung statt Tauchgang.

---

## 1. Spielablauf

1. **Startbildschirm:** Pixel-Wiese unter Himmel, eine Paläontologin mit Spaten und
   eine Flagge. Darunter beginnt der Boden. Button **▼ GRABUNG STARTEN ▼**,
   außerdem „Grabung #N“, Archiv, Endlos-Modus.
2. **7 Fragen**, jeweils mit 25 Sekunden, zum Beispiel:
   - „Nenne ein Säugetier, das im Meer lebt“
   - „Nenne ein Tier, das fliegen kann, aber kein Vogel ist“
   - „Nenne ein Tier mit mehr als sechs Beinen“
   - „Nenne einen Fisch, der im Süßwasser lebt“
3. Eingabe mit Autovervollständigung (Deutsch + Latein). Nur Arten oder Gruppen
   aus der gültigen Menge der Frage zählen.
4. **Wertung:** Gängige Antwort (Delfin) = flach, seltene Antwort (Narwal,
   Seekuh, Vaquita) = tief. Die Grabung sinkt nach jeder Antwort sichtbar ab.
5. **Ergebnis:** Gesamttiefe in Mio. Jahren, erreichte Schicht, Fakt des Tages,
   „Was andere geantwortet haben“ (Top- und Seltenheits-Liste), Teilen.

## 2. Wertung & Seltenheit

- **Tiefe = Summe der Seltenheitspunkte**, abgebildet auf eine Zeitskala bis ~4 Mrd. Jahre.
  Eine perfekte Grabung endet im Hadaikum (Gegenstück zu Krillions Hadal-Zone).
- Die Skala ist **nicht linear**: Die jüngeren Zeitalter sind gedehnt, damit es oben
  schon viel zu entdecken gibt (log-ähnliche Abbildung, von Hand abgestimmt).
- **Seltenheit, Phase A (ohne Backend):** Schätzwert aus Bekanntheit
  (Wikipedia-Seitenaufrufe DE/EN, Anzahl Sprachversionen). Bekannt = häufig genannt.
- **Seltenheit, Phase B (mit Backend):** echte Antwortverteilung der Spieler pro Tag
  (wie bei den Vorbildern). Schätzwert dient als Startwert, bis genug Antworten da sind.
- Falsche oder zu spät gegebene Antwort = 0 Meter, ein Steinbrocken fällt herunter.

## 3. Grafik (Herzstück)

### 3a. Stil
- **Pixel-Art**, feste Pixelgröße (z. B. 4 px pro Kunstpixel), `image-rendering: pixelated`.
- **Pixelschrift** für Überschriften und Zahlen (Kandidaten: *Pixelify Sans*, *Silkscreen*),
  eine gut lesbare Grotesk für Fließtext. Bewusst nicht VT323, um eigenständig zu bleiben.
- **Logo „KLADE“** in Pixel-Lettern, die aus Gesteinsschichten aufgebaut sind
  (gestreifte Füllung in Sand, Ocker, Rost). Eigene Wiedererkennung statt Farbversatz.
- Dezente Erdkrümel-Körnung als Textur, kein Röhren-Effekt.
- **Maskottchen:** ein Pixel-Trilobit (taucht in Ladezuständen, 404, Fehltipps auf).

### 3b. Szene: der Querschnitt
Vertikal scrollende Szene, die Kamera folgt der Grabung:

| Bereich | Look |
|---|---|
| Oberfläche | Himmel, Pixel-Wolken, Sonne, Wiese, Paläontologin, Zelt, Flagge |
| Holozän bis Neogen | Mutterboden, Wurzeln, Regenwürmer, Mammut-Stoßzahn |
| Paläogen | ockerfarbene Schichten, frühe Säuger-Knochen |
| **K-Pg-Grenze (66 Mio.)** | dünne dunkle Iridium-Linie, Einschlag-Pixel |
| Kreide, Jura, Trias | T-Rex-Schädel, Ammoniten, Farn-Abdrücke |
| **Perm-Grenze (252 Mio.)** | „das große Sterben“, karge graue Schicht |
| Karbon | Kohleflöze, Riesenlibelle |
| Devon, Silur, Ordovizium | Tiktaalik, Seelilien, Panzerfische |
| **Kambrium (539 Mio.)** | Trilobiten-Kolonie, Anomalocaris |
| Proterozoikum, Archaikum | Stromatolithen, gebänderte Eisenerze (rot/grau) |
| Hadaikum | glühendes Magma, „hier endet eine perfekte Grabung“ |

- Jede Zeitalter-Schicht hat eine eigene Farbe, angelehnt an die internationale
  geologische Farbskala, entsättigt auf eine begrenzte Palette (~24 Farben).
- An den Grenzen stehen **Fakt-Etiketten** links und rechts, z. B.
  `── hier starben die Dinosaurier aus — 66 Mio. J.` (Gegenstück zu Krillions Tiefen-Fakten).
- **Skala am rechten Rand:** Mio. Jahre, mit aktueller Markierung, mitlaufend.
- **HUD oben:** TIEFE (z. B. „252 Mio. J.“), PUNKTE, Frage x/7, Countdown-Balken.

### 3c. Animationen
- Antwort abgeschickt: Bohrer/Spaten-Animation, Erdbrocken spritzen, Kamera
  gleitet zur neuen Tiefe, Zahlen zählen hoch.
- **Neues Zeitalter erreicht:** kurzes Einblenden des Namens („KREIDE“) und des Fakts.
- Sehr seltene Antwort: Fossil leuchtet auf und wird „ausgegraben“.
- Falsche Antwort: Steinbrocken plumpst, Trilobit schüttelt den Kopf.
- `prefers-reduced-motion`: nur Überblendungen, keine Kamerafahrten.

### 3d. Ergebnis & Teilen
- Ergebnisseite als **Fundstück-Etikett** (Museums-Look in Pixeln): Grabung #N,
  Tiefe, erreichte Schicht, gefundenes Fossil.
- Text zum Teilen:
  ```
  KLADE #12 ⛏️ 312 Mio. J. · Karbon
  🟫🟫🟧🟥⬛🟫🟥
  ```
  (ein Feld pro Frage, Farbe = Seltenheitsstufe)
- Bild zum Teilen: Canvas-Rendering des Querschnitts mit der Tiefenmarke.

### 3e. Farben & Design
- Palette als Design-Tokens (CSS-Variablen), Erdtöne + Himmelsblau + Glutrot unten.
- Dunkles Design: Nachthimmel mit Pixel-Sternen und Mond an der Oberfläche,
  der Untergrund bleibt gleich.
- Seltenheitsstufen zusätzlich mit Symbol, nicht nur Farbe (Farbschwäche).

### 3f. Asset-Produktion
- Sprites als einzelne PNG-Dateien oder ein Sprite-Atlas, gezeichnet in Aseprite/Pixelorama.
- Der Hintergrund-Querschnitt wird **prozedural** aus Schichtdaten gekachelt
  (Farbe + Musterkachel pro Zeitalter), die Fossilien und Deko sind handgezeichnete Sprites.
- Mindestumfang für den Start: ~12 Schichtmuster, ~25 Fossil-/Deko-Sprites,
  Paläontologin (Idle, Graben), Trilobit (3 Stimmungen), UI-Rahmen, Logo.

## 4. Inhalte & Daten

- **Arten-Datenbank** (~2.000 bekannte Tiere und Pflanzen): deutsche Namen und Aliase,
  wissenschaftlicher Name, Gruppen, Merkmale. Quellen: Wikidata, GBIF.
- **Fragen** werden kuratiert. Jede Frage hat eine gültige Antwortmenge, die per
  Wikidata-Abfrage vorgeschlagen und von Hand geprüft wird.
- **Erdzeitalter-Daten:** Name, Beginn/Ende, Farbe, Fakten (von Hand, mit Quelle).
- Build-Skript erzeugt kompakte JSON-Dateien: `species.json`, `prompts/<datum>.json`,
  `strata.json`.
- **Einsprüche:** Seite „Wertungsentscheidungen“, wo strittige Antworten erklärt werden.

## 5. Technik

- **Vite + TypeScript + Svelte**, statisch gebaut.
- Szene in **Canvas 2D** (Pixel-Art skaliert sauber, viele Sprites performant),
  UI-Elemente als HTML darüber.
- Spielstand und Statistik in `localStorage` (Serie, Bestwert, Verlauf).
- **Phase B:** kleines Backend für echte Seltenheit (z. B. Cloudflare Workers + D1
  oder Supabase): Antworten zählen, Verteilung pro Tag ausliefern.
- Hosting statisch (Vercel oder GitHub Pages), mobil zuerst.

## 6. Phasen

1. **Grafik-Prototyp:** Querschnitt mit allen Schichten, Kamerafahrt, HUD, Skala,
   Fakt-Etiketten, Startbildschirm. Platzhalter-Sprites, feste Testantworten.
2. **Spielkern:** 7 Fragen, Timer, Eingabe mit Autovervollständigung, Wertung mit
   geschätzter Seltenheit, Ergebnisseite.
3. **Daten-Pipeline:** Arten-Datenbank, Fragen-Werkzeug, Erdzeitalter-Daten,
   30 Tagesrätsel vorab.
4. **Echte Pixel-Art:** finale Sprites, Logo, Maskottchen, Animationen.
5. **Teilen & Feinschliff:** Text/Bild teilen, Dunkles Design, Barrierefreiheit,
   Erklärung beim ersten Start, Statistik, Archiv.
6. **Backend für echte Seltenheit**, danach Betatest und Abstimmung der Tiefenskala.

## 7. Risiken

- **Seltenheit ohne Spielerdaten ungenau:** Schätzwert offen als „Beta“ kennzeichnen,
  schnell auf echte Daten umstellen.
- **Gültige Antworten strittig** (Ist ein Pinguin „flugunfähig“, ist ein Wal ein „Fisch“?):
  klare Formulierung, Seite mit Wertungsentscheidungen.
- **Pixel-Art-Aufwand:** Hintergrund prozedural, nur Deko handgezeichnet.
- **Nähe zu den Vorbildern:** gleiche Formel ist Genre, aber eigene Palette, Schrift,
  Logo, Figuren und Metapher. Keine übernommenen Grafiken oder Texte.
