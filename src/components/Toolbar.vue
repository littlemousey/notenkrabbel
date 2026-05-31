<script setup lang="ts">
import { useScoreStore } from '@/stores/score'
import type { Duration, Accidental, BeatsPerMeasure } from '@/types/music'

const store = useScoreStore()

const DUR_BUTTONS: { dur: Duration; label: string }[] = [
  { dur: 0.25, label: '𝅘𝅥𝅯 1/16' },
  { dur: 0.5,  label: '♪ 1/8'   },
  { dur: 1,    label: '♩ 1/4'   },
  { dur: 1.5,  label: '𝅗𝅥. 3/8' },
  { dur: 2,    label: '𝅗𝅥 1/2'  },
  { dur: 3,    label: '𝅝 3/4'   },
]

const ACC_BUTTONS: { acc: Accidental; label: string; id: string }[] = [
  { acc: '',  label: '♮', id: 'natural' },
  { acc: '#', label: '♯', id: 'sharp'   },
  { acc: 'b', label: '♭', id: 'flat'    },
]

const METER_BUTTONS: { meter: BeatsPerMeasure; label: string }[] = [
  { meter: 3, label: '3/4' },
  { meter: 4, label: '4/4' },
]
</script>

<template>
  <div class="toolbar">

    <div class="tool-group">
      <span class="tool-label">Duur</span>
      <button
        v-for="b in DUR_BUTTONS"
        :key="b.dur"
        class="tool-btn"
        :class="{ active: store.selectedDur === b.dur }"
        @click="store.setDur(b.dur)"
      >{{ b.label }}</button>
    </div>

    <div class="tool-group">
      <span class="tool-label">Voorteken</span>
      <button
        v-for="b in ACC_BUTTONS"
        :key="b.id"
        class="tool-btn"
        :class="{ active: store.selectedAcc === b.acc }"
        @click="store.setAcc(b.acc)"
      >{{ b.label }}</button>
    </div>

    <div class="tool-group">
      <span class="tool-label">Maat</span>
      <button
        v-for="b in METER_BUTTONS"
        :key="b.meter"
        class="tool-btn"
        :class="{ active: store.beatsPerMeasure === b.meter }"
        @click="store.setMeter(b.meter)"
      >{{ b.label }}</button>
    </div>

    <div class="tool-group">
      <span class="tool-label">Bewerken</span>
      <button class="tool-btn danger" @click="store.undoLast">↩ Ongedaan</button>
      <button class="tool-btn danger" @click="store.deselect">✕ Deselecteer</button>
    </div>

  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
  background: white;
  border: 1px solid var(--soft);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.4rem;
  box-shadow: 0 2px 8px var(--shadow);
}

.tool-group {
  display: flex;
  gap: 0.28rem;
  align-items: center;
  padding-right: 0.75rem;
  border-right: 1px solid var(--soft);
}
.tool-group:last-child { border-right: none; padding-right: 0; }

.tool-label {
  font-size: 0.67rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--gold);
  margin-right: 0.25rem;
  white-space: nowrap;
}

.tool-btn {
  background: var(--aged);
  border: 1.5px solid var(--soft);
  border-radius: 7px;
  padding: 0.32rem 0.6rem;
  font-family: 'Lora', serif;
  font-size: 0.83rem;
  color: var(--ink);
  cursor: pointer;
  transition: all 0.13s;
  white-space: nowrap;
  line-height: 1;
}
.tool-btn:hover    { background: var(--soft); border-color: var(--gold); }
.tool-btn.active   { background: var(--accent); border-color: var(--accent); color: white; box-shadow: 0 2px 7px rgba(139,46,0,0.28); }
.tool-btn.danger:hover { background: #fff0e8; border-color: var(--accent); color: var(--accent); }
</style>
