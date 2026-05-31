<script setup lang="ts">
import { computed } from 'vue'
import { useScoreStore } from '@/stores/score'
import AppHeader      from '@/components/AppHeader.vue'
import Toolbar        from '@/components/Toolbar.vue'
import StaffSvg       from '@/components/StaffSvg.vue'
import ChordAssistant from '@/components/ChordAssistant.vue'
import PlayRow        from '@/components/PlayRow.vue'
import NoteChips      from '@/components/NoteChips.vue'

const store = useScoreStore()

const hintText = computed(() => {
  const sl = store.selectedSlot
  if (!sl) {
    return 'Klik op de notenbalk om een noot te plaatsen · klik op een bestaande noot of chip om hem te selecteren voor een akkoord'
  }
  const names = sl.pitches
    .map(p => p.name + (p.acc === '#' ? '♯' : p.acc === 'b' ? '♭' : '') + p.octave)
    .join(', ')
  return `🎹 Geselecteerd: ${names} — klik op de balk om een noot toe te voegen aan dit akkoord · klik nogmaals of op ✕ Deselecteer om de selectie op te heffen`
})
</script>

<template>
  <AppHeader />

  <div class="main">

    <Toolbar />

    <!-- Score card -->
    <div class="score-wrap">
      <div class="score-header">
        <input
          v-model="store.scoreTitle"
          class="score-title-edit"
          type="text"
          spellcheck="false"
        />
        <div class="score-info">{{ store.scoreInfo }}</div>
      </div>

      <StaffSvg />

      <div class="hint-bar" :class="{ selecting: store.selectedSlotId !== null }">
        {{ hintText }}
      </div>
    </div>

    <ChordAssistant />
    <PlayRow />
    <NoteChips />

  </div>
</template>

<style scoped>
.main {
  max-width: 980px;
  margin: 0 auto;
  padding: 1.8rem 1.5rem 4rem;
}

.score-wrap {
  background: white;
  border: 1px solid var(--soft);
  border-radius: 14px;
  padding: 1.4rem 1rem 0.8rem;
  box-shadow: 0 4px 20px var(--shadow);
  margin-bottom: 1.3rem;
  position: relative;
  overflow: hidden;
}
.score-wrap::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  background: linear-gradient(to right, var(--accent), var(--gold));
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.7rem;
  padding: 0 0.4rem;
}

.score-title-edit {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: 1.15rem;
  border: none;
  background: transparent;
  color: var(--ink);
  width: 240px;
  outline: none;
  border-bottom: 1px dashed var(--soft);
  padding-bottom: 2px;
}
.score-title-edit:focus { border-bottom-color: var(--gold); }

.score-info {
  font-size: 0.75rem;
  color: var(--gold);
  text-align: right;
  line-height: 1.6;
}

.hint-bar {
  font-size: 0.78rem;
  color: #999;
  font-style: italic;
  padding: 0.45rem 0.5rem;
  border-top: 1px solid var(--aged);
  margin-top: 0.3rem;
  min-height: 1.9rem;
  transition: color 0.2s;
}
.hint-bar.selecting {
  color: var(--green);
  font-style: normal;
  font-weight: 600;
}
</style>
