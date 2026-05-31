<script setup lang="ts">
import { computed } from 'vue'
import { useScoreStore } from '@/stores/score'
import { KEY_DATA, matchChord, isInKey, noteRole, parseNote, guessOctave } from '@/theory'
import { previewPitch } from '@/audio/player'
import type { KeyId } from '@/types/music'

const store = useScoreStore()

const sl         = computed(() => store.selectedSlot)
const kd         = computed(() => KEY_DATA[store.currentKey])
const bestMatch  = computed(() => store.bestChordMatch)

// ─── Analysis text data ───────────────────────────────────────────────────────

const outOfKey = computed(() =>
  sl.value
    ? sl.value.pitches.filter(p => !isInKey(p.name, p.acc, store.currentKey))
    : [],
)

// ─── Chord grid ───────────────────────────────────────────────────────────────

const chordCards = computed(() =>
  kd.value.chords.map(ch => {
    const { score, missing } = matchChord(sl.value?.pitches ?? [], ch.notes)
    const isBest    = bestMatch.value !== null && ch.name === bestMatch.value.chord.name && bestMatch.value.score > 0
    const isPartial = score > 0 && !isBest
    return { ch, score, missing, isBest, isPartial }
  }),
)

// ─── Suggestions (notes to add to complete best chord) ───────────────────────

const suggestions = computed(() => {
  if (!sl.value || !bestMatch.value) return []
  const { missing } = matchChord(sl.value.pitches, bestMatch.value.chord.notes)
  return missing.map(noteStr => ({
    noteStr,
    display: noteStr.replace('#', '♯').replace('b', '♭'),
    role:    noteRole(noteStr, bestMatch.value!.chord.notes),
  }))
})

const isComplete = computed(() =>
  bestMatch.value !== null &&
  sl.value !== null &&
  bestMatch.value.score === bestMatch.value.chord.notes.length,
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function accSym(acc: string): string {
  return acc === '#' ? '♯' : acc === 'b' ? '♭' : ''
}

function noteDisplay(n: string): string {
  return n.replace('#', '♯').replace('b', '♭')
}

function onKeyChange(e: Event): void {
  store.setKey((e.target as HTMLSelectElement).value as KeyId)
}

function previewOnHover(notes: string[]): void {
  store.previewChord(notes)
}

function previewSuggestion(noteStr: string): void {
  if (!sl.value) return
  const { name, acc } = parseNote(noteStr)
  const oct = guessOctave(sl.value.pitches)
  previewPitch(name, acc, oct)
}
</script>

<template>
  <div v-if="sl" class="chord-assistant">

    <div class="ca-header">
      <div class="ca-title">🎹 Akkoordassistent</div>
      <div class="ca-key-row">
        Toonsoort:
        <select class="ca-key-select" :value="store.currentKey" @change="onKeyChange">
          <option v-for="(data, key) in KEY_DATA" :key="key" :value="key">
            {{ data.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Analysis -->
    <div class="ca-analysis">
      <template v-if="sl.pitches.length === 0">
        Selecteer een slot en klik op een akkoord hieronder om het in te voegen, of voeg losse noten toe.
      </template>
      <template v-else>
        Geselecteerde noten:
        <strong v-for="p in sl.pitches" :key="`${p.name}${p.acc}`">
          {{ p.name }}{{ accSym(p.acc) }}
        </strong>
        <template v-if="bestMatch">
          → beste match:
          <span class="match-name">{{ bestMatch.chord.name }}</span>
          <template v-if="bestMatch.score === bestMatch.chord.notes.length">
            ✓ <em>volledig akkoord</em>
          </template>
          <template v-else>
            ({{ Math.round(bestMatch.score / bestMatch.chord.notes.length * 100) }}% compleet)
          </template>
        </template>
        <template v-if="outOfKey.length">
          <br/>
          ⚠ Buiten toonsoort:
          <span
            v-for="p in outOfKey"
            :key="`${p.name}${p.acc}`"
            class="out-of-key"
          >{{ p.name }}{{ accSym(p.acc) }}</span>
          — dit klinkt scherp/dissonant (kan bewust zijn!)
        </template>
      </template>
    </div>

    <!-- Chord grid -->
    <div class="ca-label">Akkoorden in deze toonsoort — klik om meteen in te voegen</div>
    <div class="chord-grid">
      <div
        v-for="{ ch, isBest, isPartial } in chordCards"
        :key="ch.name"
        class="chord-card"
        :class="{ 'best-match': isBest, 'partially-matches': isPartial }"
        :title="ch.role"
        @click="store.insertChord(ch.notes)"
        @mouseenter="previewOnHover(ch.notes)"
      >
        <div class="cc-roman">{{ ch.roman }}</div>
        <div class="cc-name">{{ ch.name }}</div>
        <div class="cc-notes">{{ ch.notes.map(noteDisplay).join(' – ') }}</div>
        <div class="cc-mood">{{ ch.mood }}</div>
        <div class="cc-badge">beste match</div>
      </div>
    </div>

    <!-- Suggestions -->
    <div v-if="sl.pitches.length > 0" class="ca-suggest">
      <div class="ca-suggest-label">Voeg toe aan het geselecteerde slot</div>
      <div class="suggest-pills">
        <template v-if="isComplete">
          <span class="no-suggest">✓ Volledig {{ bestMatch!.chord.name }}-akkoord!</span>
        </template>
        <template v-else>
          <div
            v-for="s in suggestions"
            :key="s.noteStr"
            class="suggest-pill"
            :title="`Voeg ${s.display} toe — ${s.role} van ${bestMatch?.chord.name}`"
            @click="store.addNoteStringToSelected(s.noteStr)"
            @mouseenter="previewSuggestion(s.noteStr)"
          >
            <span class="sp-note">+ {{ s.display }}</span>
            <span class="sp-role">{{ s.role }}</span>
          </div>
        </template>
      </div>
    </div>

  </div>
</template>

<style scoped>
.chord-assistant {
  background: white;
  border: 1px solid var(--soft);
  border-radius: 14px;
  padding: 1.1rem 1.2rem;
  box-shadow: 0 4px 20px var(--shadow);
  margin-bottom: 1.3rem;
  position: relative;
  overflow: hidden;
}
.chord-assistant::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  background: linear-gradient(to right, var(--green), #8bc48a);
}

.ca-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.9rem;
}
.ca-title { font-family: 'Playfair Display', serif; font-style: italic; font-size: 1.05rem; color: var(--ink); }
.ca-key-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.78rem; color: var(--gold); }
.ca-key-select {
  font-family: 'Lora', serif;
  font-size: 0.78rem;
  border: 1px solid var(--soft);
  border-radius: 6px;
  padding: 0.2rem 0.4rem;
  background: var(--aged);
  color: var(--ink);
  cursor: pointer;
}

.ca-analysis {
  font-size: 0.82rem;
  color: #666;
  margin-bottom: 0.9rem;
  padding: 0.5rem 0.7rem;
  background: var(--aged);
  border-radius: 8px;
  line-height: 1.6;
}
.match-name    { font-weight: 600; color: var(--green); font-family: 'Playfair Display', serif; font-size: 0.95rem; }
.out-of-key    { color: var(--accent); font-weight: 600; }

.ca-label {
  font-size: 0.67rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--gold);
  margin-bottom: 0.55rem;
}

.chord-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.9rem; }

.chord-card {
  border: 1.5px solid var(--soft);
  border-radius: 10px;
  padding: 0.5rem 0.7rem;
  cursor: pointer;
  transition: all 0.15s;
  background: var(--aged);
  min-width: 90px;
  position: relative;
}
.chord-card:hover           { border-color: var(--green); background: #f0f8f0; transform: translateY(-1px); box-shadow: 0 3px 10px rgba(46,110,46,0.15); }
.chord-card.best-match      { border-color: var(--green); background: #eaf4ea; box-shadow: 0 0 0 2px rgba(46,110,46,0.2); }
.chord-card.partially-matches { border-color: var(--gold); background: #fdf6e8; }

.cc-roman  { font-size: 0.65rem; color: #aaa; margin-bottom: 0.1rem; }
.cc-name   { font-family: 'Playfair Display', serif; font-size: 0.92rem; font-weight: 700; color: var(--ink); }
.cc-notes  { font-size: 0.68rem; color: #888; margin-top: 0.15rem; }
.cc-mood   { font-size: 0.65rem; color: var(--gold); font-style: italic; margin-top: 0.1rem; }
.cc-badge  {
  position: absolute;
  top: -7px; right: -7px;
  background: var(--green); color: white;
  font-size: 0.55rem; border-radius: 10px; padding: 0.1rem 0.35rem;
  white-space: nowrap;
  display: none;
}
.chord-card.best-match .cc-badge { display: block; }

.ca-suggest { margin-top: 0.2rem; }
.ca-suggest-label { font-size: 0.67rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--gold); margin-bottom: 0.45rem; }
.suggest-pills { display: flex; flex-wrap: wrap; gap: 0.35rem; }

.suggest-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: #eaf4ea;
  border: 1.5px solid var(--green);
  border-radius: 20px;
  padding: 0.25rem 0.7rem;
  font-family: 'Playfair Display', serif;
  font-size: 0.85rem;
  color: var(--green);
  cursor: pointer;
  transition: all 0.13s;
}
.suggest-pill:hover { background: var(--green); color: white; transform: translateY(-1px); }
.sp-note { font-weight: 700; }
.sp-role { font-size: 0.62rem; opacity: 0.7; font-family: 'Lora', serif; }

.no-suggest { font-size: 0.82rem; color: var(--green); font-style: italic; }
</style>
