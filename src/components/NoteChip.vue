<script setup lang="ts">
import type { Slot } from '@/types/music'
import { durLabel } from '@/theory'

const props = defineProps<{
  slot:       Slot
  index:      number
  selected:   boolean
  playing:    boolean
  dragOver:   boolean
}>()

const emit = defineEmits<{
  click:      []
  delete:     []
  dragstart:  [index: number]
  dragover:   [index: number]
  dragleave:  []
  drop:       [index: number]
  dragend:    []
}>()

function accSym(acc: string): string {
  return acc === '#' ? '♯' : acc === 'b' ? '♭' : ''
}
</script>

<template>
  <div
    class="note-chip"
    :class="{
      'chord-chip':    slot.pitches.length > 1,
      'slot-selected': selected,
      'playing-chip':  playing,
      'drag-over':     dragOver,
    }"
    :data-slotid="slot.id"
    draggable="true"
    :title="selected
      ? 'Geselecteerd voor akkoord — klik opnieuw om te deselecteren'
      : 'Klik om te selecteren · sleep om te verplaatsen'"
    @click="emit('click')"
    @dragstart="emit('dragstart', index)"
    @dragover.prevent="emit('dragover', index)"
    @dragleave="emit('dragleave')"
    @drop.prevent="emit('drop', index)"
    @dragend="emit('dragend')"
  >
    <!-- Position index -->
    <span class="chip-idx">{{ index + 1 }}</span>

    <!-- Pitch name(s) -->
    <div class="chip-pitches">
      <span
        v-for="p in slot.pitches"
        :key="`${p.name}${p.acc}${p.octave}`"
        class="chip-pitch"
      >
        {{ p.name }}{{ accSym(p.acc) }}<sub>{{ p.octave }}</sub>
      </span>
    </div>

    <!-- Duration label -->
    <span class="chip-dur">{{ durLabel(slot.dur) }}</span>

    <!-- Delete button -->
    <span class="chip-del" @click.stop="emit('delete')">×</span>
  </div>
</template>

<style scoped>
.note-chip {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  background: var(--aged);
  border: 1.5px solid var(--soft);
  border-radius: 8px;
  padding: 0.28rem 0.55rem 0.22rem;
  font-family: 'Playfair Display', serif;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.12s;
  min-width: 38px;
  position: relative;
  user-select: none;
}
.note-chip:hover             { background: #fff0e8; border-color: var(--accent); }
.note-chip.chord-chip        { border-color: var(--green); background: #eaf4ea; }
.note-chip.slot-selected     { background: var(--green); border-color: var(--green); color: white; box-shadow: 0 0 0 3px rgba(46,110,46,0.25); }
.note-chip.playing-chip      { background: var(--accent); border-color: var(--accent); color: white; }
.note-chip.drag-over         { outline: 2px solid var(--accent); outline-offset: 2px; }

.chip-idx {
  font-size: 0.48rem;
  position: absolute;
  top: 2px;
  left: 3px;
  opacity: 0.3;
}

.chip-pitches {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  margin: 1px 0;
}

.chip-pitch {
  font-size: 0.82rem;
  font-weight: bold;
  line-height: 1.25;
}

.chip-dur {
  font-size: 0.57rem;
  font-family: 'Lora', serif;
  opacity: 0.65;
  margin-top: 1px;
}

.chip-del {
  position: absolute;
  top: -7px;
  right: -7px;
  width: 16px;
  height: 16px;
  background: var(--accent);
  color: white;
  border-radius: 50%;
  font-size: 0.65rem;
  line-height: 16px;
  text-align: center;
  opacity: 0;
  transition: opacity 0.13s;
  cursor: pointer;
  z-index: 2;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}
.note-chip:hover .chip-del,
.note-chip.slot-selected .chip-del { opacity: 1; }
</style>
