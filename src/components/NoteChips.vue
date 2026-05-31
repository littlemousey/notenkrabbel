<script setup lang="ts">
import { ref } from 'vue'
import { useScoreStore } from '@/stores/score'
import NoteChip from './NoteChip.vue'

const store     = useScoreStore()
const dragSrcIdx = ref<number | null>(null)
const dragOverIdx = ref<number | null>(null)

function onDragStart(idx: number): void {
  dragSrcIdx.value = idx
}

function onDragOver(idx: number): void {
  dragOverIdx.value = idx
}

function onDragLeave(): void {
  dragOverIdx.value = null
}

function onDrop(targetIdx: number): void {
  if (dragSrcIdx.value !== null && dragSrcIdx.value !== targetIdx) {
    store.moveSlot(dragSrcIdx.value, targetIdx)
  }
  dragSrcIdx.value  = null
  dragOverIdx.value = null
}

function onDragEnd(): void {
  dragSrcIdx.value  = null
  dragOverIdx.value = null
}
</script>

<template>
  <div class="note-list-wrap">
    <div class="note-list-title">
      Noten in volgorde — klik om te selecteren/beluisteren · sleep om te verplaatsen · × om te verwijderen
    </div>

    <div class="note-chips">
      <span v-if="!store.slots.length" class="empty-hint">
        Nog geen noten — klik op de notenbalk om te beginnen…
      </span>

      <NoteChip
        v-for="(sl, si) in store.slots"
        :key="sl.id"
        :slot="sl"
        :index="si"
        :selected="sl.id === store.selectedSlotId"
        :playing="sl.id === store.playingSlotId"
        :drag-over="dragOverIdx === si"
        @click="store.selectSlot(sl.id)"
        @delete="store.removeSlot(sl.id)"
        @dragstart="onDragStart"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
        @dragend="onDragEnd"
      />
    </div>
  </div>
</template>

<style scoped>
.note-list-wrap {
  background: white;
  border: 1px solid var(--soft);
  border-radius: 12px;
  padding: 0.95rem 1.1rem;
  box-shadow: 0 2px 8px var(--shadow);
}

.note-list-title {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--gold);
  margin-bottom: 0.7rem;
}

.note-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;
  align-items: flex-start;
}

.empty-hint {
  font-size: 0.82rem;
  color: var(--soft);
  font-style: italic;
  padding: 0.4rem;
}
</style>
