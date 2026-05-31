<script setup lang="ts">
import { useScoreStore } from '@/stores/score'

const store = useScoreStore()

function exportNotes(): void {
  if (!store.slots.length) { alert('Geen noten om te exporteren.'); return }
  const title = store.scoreTitle
  const lines = [
    `// ${title}`,
    `// Tempo: ${store.tempo} bpm · Maatsoort: ${store.beatsPerMeasure}/4`,
    '',
    'const melody = [',
  ]
  store.slots.forEach(sl => {
    if (sl.pitches.length === 1) {
      const p = sl.pitches[0]
      lines.push(`  ['${p.name}${p.acc}',${p.octave},${sl.dur}],`)
    } else {
      const c = sl.pitches.map(p => `['${p.name}${p.acc}',${p.octave}]`).join(', ')
      lines.push(`  {chord:[${c}],dur:${sl.dur}},`)
    }
  })
  lines.push('];')
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = title.replace(/\s+/g, '_') + '.js'
  a.click()
}

function clearAll(): void {
  if (!store.slots.length) return
  if (!confirm('Alle noten verwijderen?')) return
  store.clearAll()
}
</script>

<template>
  <header class="app-header">
    <div class="logo">🎼 Noten Editor</div>
    <div class="header-actions">
      <button class="btn-small" @click="clearAll">✕ Alles wissen</button>
      <button class="btn-small" @click="exportNotes">↓ Exporteer</button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 2rem;
  border-bottom: 1px solid var(--soft);
  background: rgba(249, 244, 232, 0.95);
  backdrop-filter: blur(4px);
  position: sticky;
  top: 0;
  z-index: 20;
}

.logo {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: 1.35rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-actions {
  display: flex;
  gap: 0.6rem;
  align-items: center;
}

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
</style>
