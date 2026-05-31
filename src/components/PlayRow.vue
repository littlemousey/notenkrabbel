<script setup lang="ts">
import { useScoreStore } from '@/stores/score'

const store = useScoreStore()
</script>

<template>
  <div class="play-row">
    <button
      class="btn-play-main"
      :class="{ playing: store.playing }"
      @click="store.togglePlay"
    >
      {{ store.playing ? '■ Stop' : '▶ Afspelen' }}
    </button>

    <button class="btn-small" @click="store.stopPlay">⏹ Stop</button>

    <div class="tempo-row">
      <span>Tempo</span>
      <input
        type="range"
        min="40" max="180"
        :value="store.tempo"
        @input="store.setTempo(Number(($event.target as HTMLInputElement).value))"
      />
      <span>{{ store.tempo }}</span>
      <span class="tempo-unit">♩/min</span>
    </div>
  </div>
</template>

<style scoped>
.play-row {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.75rem 1rem;
  background: var(--aged);
  border-radius: 10px;
  margin-bottom: 1.3rem;
  border: 1px solid var(--soft);
  flex-wrap: wrap;
}

.btn-play-main {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 30px;
  padding: 0.52rem 1.5rem;
  font-family: 'Lora', serif;
  font-size: 0.92rem;
  cursor: pointer;
  transition: all 0.18s;
  box-shadow: 0 3px 10px rgba(139,46,0,0.22);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.btn-play-main:hover   { background: #6a2200; transform: translateY(-1px); }
.btn-play-main.playing { background: var(--green); }

.btn-small {
  background: white;
  border: 1.5px solid var(--soft);
  border-radius: 20px;
  padding: 0.38rem 0.85rem;
  font-family: 'Lora', serif;
  font-size: 0.8rem;
  color: var(--ink);
  cursor: pointer;
  transition: all 0.13s;
}
.btn-small:hover { border-color: var(--gold); color: var(--accent); }

.tempo-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  color: #888;
  margin-left: auto;
}

.tempo-unit { opacity: 0.45; margin-left: 2px; }

input[type='range'] {
  -webkit-appearance: none;
  height: 3px;
  background: var(--soft);
  border-radius: 2px;
  width: 68px;
}
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
}
</style>
