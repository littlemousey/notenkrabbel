# 🎼 Notenkrabbel

A browser-based note and chord editor built with Vue 3, TypeScript, and Vite.

## What does the app do?

- **Place notes** — click on the staff to place notes at the desired pitch, duration, and accidental (♮ ♯ ♭)
- **Build chords** — select an existing slot and add extra notes to form chords
- **Chord assistant** — analyses the selected notes, shows all diatonic chords for the chosen key (C, G, F, D, Am, Em, Dm), and suggests missing notes
- **Playback** — plays back the melody/chords via the Web Audio API with adjustable tempo (40–180 ♩/min)
- **Drag & drop** — reorder notes by dragging chips
- **Export** — downloads the composition as a `.js` file

## Stack

| Component | Choice |
|---|---|
| Framework | Vue 3 (Composition API + `<script setup>`) |
| Language | TypeScript |
| Build tool | Vite |
| State management | Pinia |
| Tests | Vitest |

## Project structure

```
src/
├── types/
│   └── music.ts              # Pitch, Slot, KeyData, ChordDef, Duration, …
├── theory/
│   ├── keys.ts               # KEY_DATA — 7 keys with diatonic chords
│   ├── chords.ts             # matchChord, isInKey, noteRole, findBestMatch, …
│   ├── layout.ts             # staffY, snapPitch, computeLayout, slotWidth, …
│   └── index.ts              # re-export
├── audio/
│   └── player.ts             # Web Audio API — noteToFreq, previewPitch, startPlayback
├── stores/
│   └── score.ts              # Pinia store — slots, selectedSlotId, tempo, actions
├── composables/
│   └── useStaffInteraction.ts # hover, click, drag, tooltip, hint bar
└── components/
    ├── AppHeader.vue          # Logo, Clear all, Export
    ├── Toolbar.vue            # Duration / accidental / time signature / edit
    ├── StaffSvg.vue           # Declarative SVG staff
    ├── NoteChip.vue           # Single note/chord badge
    ├── NoteChips.vue          # List with drag-and-drop
    ├── PlayRow.vue            # Play / stop / tempo
    └── ChordAssistant.vue     # Chord assistant panel

tests/
└── theory/
    ├── chords.test.ts         # 29 unit tests (parseNote, matchChord, isInKey, …)
    └── layout.test.ts         # 18 unit tests (staffY, snapPitch, computeLayout, …)
```

## Architecture principles

- **`theory/` and `audio/` are framework-agnostic** — pure TypeScript functions with no Vue or DOM dependencies, easy to test
- **Pinia store** manages all application state; components communicate via the store instead of prop-drilling
- **`StaffSvg.vue` is fully declarative** — the SVG is reactively built from the store, no manual DOM manipulation
- **Callbacks pattern in audio** — `startPlayback` accepts `onSlotStart`/`onSlotEnd`/`onEnded` so the audio layer has no knowledge of the UI

## Getting started

```bash
npm install
npm run dev          # dev server at http://localhost:5173
npm run build        # production build to dist/
npm test             # unit tests (Vitest)
npm run test:watch   # tests in watch mode
npm run test:coverage
```

## Original

The app was migrated from a single HTML file (`noten-editor.html`) which still lives in the root of this project as a reference.

