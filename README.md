# 🎼 Notenkrabbel

Een browser-gebaseerde noten- en akkoordeditor gebouwd met Vue 3, TypeScript en Vite.

## Wat doet de app?

- **Noten plaatsen** — klik op de notenbalk om noten te plaatsen in de gewenste toonhoogte, duur en voorteken (♮ ♯ ♭)
- **Akkoorden bouwen** — selecteer een bestaand slot en voeg extra noten toe om akkoorden te vormen
- **Akkoordassistent** — analyseert de geselecteerde noten, toont alle diatonische akkoorden van de gekozen toonsoort (C, G, F, D, Am, Em, Dm) en stelt ontbrekende noten voor
- **Afspelen** — speelt de melodie/akkoorden af via de Web Audio API met instelbaar tempo (40–180 ♩/min)
- **Drag & drop** — herorden noten door chips te slepen
- **Exporteren** — downloadt de compositie als een `.js`-bestand

## Stack

| Onderdeel | Keuze |
|---|---|
| Framework | Vue 3 (Composition API + `<script setup>`) |
| Taal | TypeScript |
| Build tool | Vite |
| State management | Pinia |
| Tests | Vitest |

## Projectstructuur

```
src/
├── types/
│   └── music.ts              # Pitch, Slot, KeyData, ChordDef, Duration, …
├── theory/
│   ├── keys.ts               # KEY_DATA — 7 toonsoorten met diatonische akkoorden
│   ├── chords.ts             # matchChord, isInKey, noteRole, findBestMatch, …
│   ├── layout.ts             # staffY, snapPitch, computeLayout, slotWidth, …
│   └── index.ts              # re-export
├── audio/
│   └── player.ts             # Web Audio API — noteToFreq, previewPitch, startPlayback
├── stores/
│   └── score.ts              # Pinia store — slots, selectedSlotId, tempo, acties
├── composables/
│   └── useStaffInteraction.ts # hover, click, drag, tooltip, hintbalk
└── components/
    ├── AppHeader.vue          # Logo, Alles wissen, Exporteer
    ├── Toolbar.vue            # Duur / voorteken / maat / bewerken
    ├── StaffSvg.vue           # Declaratieve SVG-notenbalk
    ├── NoteChip.vue           # Enkel noot-/akkoordbadge
    ├── NoteChips.vue          # Lijst met drag-and-drop
    ├── PlayRow.vue            # Afspelen / stop / tempo
    └── ChordAssistant.vue     # Akkoordassistent paneel

tests/
└── theory/
    ├── chords.test.ts         # 29 unit tests (parseNote, matchChord, isInKey, …)
    └── layout.test.ts         # 18 unit tests (staffY, snapPitch, computeLayout, …)
```

## Architectuurprincipes

- **`theory/` en `audio/` zijn framework-agnostisch** — pure TypeScript-functies zonder Vue- of DOM-afhankelijkheden, eenvoudig te testen
- **Pinia store** beheert alle applicatiestaat; componenten communiceren via de store in plaats van prop-drilling
- **`StaffSvg.vue` is volledig declaratief** — de SVG wordt reactief opgebouwd vanuit de store, geen handmatige DOM-manipulatie
- **Callbacks-patroon in audio** — `startPlayback` accepteert `onSlotStart`/`onSlotEnd`/`onEnded` zodat de audio-laag de UI niet kent

## Aan de slag

```bash
npm install
npm run dev          # ontwikkelserver op http://localhost:5173
npm run build        # productie-build naar dist/
npm test             # unit tests (Vitest)
npm run test:watch   # tests in watch-modus
npm run test:coverage
```

## Origineel

De app is gemigreerd vanuit een enkel HTML-bestand (`noten-editor.html`) dat zich nog in de root van dit project bevindt als referentie.

