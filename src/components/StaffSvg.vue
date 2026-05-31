<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useScoreStore } from '@/stores/score'
import {
  computeLayout, staffY, slotWidth,
  STAFF_BOTTOM, STAFF_TOP, LINE_GAP, LEFT_MARGIN, NOTE_START, EXTRA_PADDING,
} from '@/theory'
import { useStaffInteraction } from '@/composables/useStaffInteraction'
import type { Slot, Pitch } from '@/types/music'

const store = useScoreStore()
const {
  slots, selectedSlotId, playingSlotId, beatsPerMeasure,
  selectedDur, selectedAcc,
} = storeToRefs(store)

const svgRef = ref<SVGSVGElement | null>(null)

const { hoveredPitch, hoverX, tooltip, onStaffHover, onStaffLeave, onStaffClick, onMouseMove } =
  useStaffInteraction(svgRef, selectedDur, selectedAcc)

onMounted(()  => document.addEventListener('mousemove', onMouseMove))
onUnmounted(() => document.removeEventListener('mousemove', onMouseMove))

// ─── Layout ───────────────────────────────────────────────────────────────────

const layout   = computed(() => computeLayout(slots.value))
const svgWidth = computed(() => Math.max(700, layout.value.totalWidth))

function slotX(idx: number): number {
  return layout.value.slots[idx]?.x ?? 0
}

// ─── Barlines ─────────────────────────────────────────────────────────────────

const barlineXs = computed(() => {
  let beatAcc = 0
  const result: number[] = []
  slots.value.forEach((sl, i) => {
    beatAcc += sl.dur
    const isLast = i === slots.value.length - 1
    const mod = Math.abs(Math.round(beatAcc * 100) % Math.round(beatsPerMeasure.value * 100))
    if (!isLast && mod < 1) {
      result.push((layout.value.slots[i]?.x ?? 0) + slotWidth(sl.dur) - 2)
    }
  })
  return result
})

const endX = computed(() => layout.value.totalWidth - EXTRA_PADDING + 8)

// ─── Selected highlight band ──────────────────────────────────────────────────

const highlight = computed(() => {
  if (selectedSlotId.value === null) return null
  const si = slots.value.findIndex(s => s.id === selectedSlotId.value)
  if (si < 0) return null
  const x = slotX(si)
  const w = slotWidth(slots.value[si].dur)
  return {
    x:      x - 8,
    y:      STAFF_TOP - LINE_GAP * 3.5,
    width:  w + 4,
    height: (STAFF_BOTTOM + LINE_GAP * 3.5) - (STAFF_TOP - LINE_GAP * 3.5),
  }
})

// ─── Overlay bounds (click area for new notes) ───────────────────────────────

const overlayBounds = computed(() => ({
  x:      NOTE_START,
  y:      STAFF_TOP  - LINE_GAP * 4,
  width:  svgWidth.value - NOTE_START - 12,
  height: (STAFF_BOTTOM + LINE_GAP * 4) - (STAFF_TOP - LINE_GAP * 4),
}))

// ─── Note drawing helpers ─────────────────────────────────────────────────────

function noteColor(slotId: number, ghost = false): string {
  if (ghost)                         return '#8b2e00'
  if (slotId === selectedSlotId.value) return '#2e6e2e'
  return '#1a1008'
}

function ledgerAbove(y: number): number[] {
  if (y >= STAFF_TOP - 2) return []
  const lines: number[] = []
  for (let ly = STAFF_TOP - LINE_GAP; ly >= y - 2; ly -= LINE_GAP) lines.push(ly)
  return lines
}

function ledgerBelow(y: number): number[] {
  if (y <= STAFF_BOTTOM + 2) return []
  const lines: number[] = []
  for (let ly = STAFF_BOTTOM + LINE_GAP; ly <= y + 2; ly += LINE_GAP) lines.push(ly)
  return lines
}

/** true = stem points upward */
function stemUp(y: number): boolean {
  return y > STAFF_BOTTOM - 2 * LINE_GAP
}

function flagPath1(sx: number, y: number, up: boolean): string {
  return up
    ? `M${sx},${y - 30} C${sx + 11},${y - 22} ${sx + 13},${y - 15} ${sx + 5},${y - 9}`
    : `M${sx},${y + 30} C${sx - 11},${y + 22} ${sx - 13},${y + 15} ${sx - 5},${y + 9}`
}

function flagPath2(sx: number, y: number, up: boolean): string {
  return up
    ? `M${sx},${y - 22} C${sx + 11},${y - 14} ${sx + 13},${y - 7} ${sx + 5},${y - 1}`
    : `M${sx},${y + 22} C${sx - 11},${y + 14} ${sx - 13},${y + 7} ${sx - 5},${y + 1}`
}

function ringOpacity(slotId: number): string {
  return playingSlotId.value === slotId ? '0.85' : '0'
}

// ─── Hit rect for a slot ──────────────────────────────────────────────────────

function hitRect(sl: Slot, x: number) {
  const ys   = sl.pitches.map(p => staffY(p.name, p.octave))
  const minY = Math.min(...ys) - 12
  const maxY = Math.max(...ys) + 12
  const w    = slotWidth(sl.dur)
  return { x: x - w / 2 + 2, y: minY, width: w - 4, height: maxY - minY }
}

// ─── Ghost note data ──────────────────────────────────────────────────────────

const ghost = computed(() => {
  if (!hoveredPitch.value || hoverX.value === null) return null
  return { pitch: hoveredPitch.value, x: hoverX.value }
})
</script>

<template>
  <div style="overflow-x: auto">
    <svg
      ref="svgRef"
      :viewBox="`0 0 ${svgWidth} 175`"
      :width="svgWidth"
      style="display:block; min-width:680px; user-select:none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- ── Staff lines ── -->
      <line
        v-for="i in 5"
        :key="`sl-${i}`"
        :x1="LEFT_MARGIN - 8" :x2="svgWidth - 10"
        :y1="STAFF_BOTTOM - (i - 1) * LINE_GAP"
        :y2="STAFF_BOTTOM - (i - 1) * LINE_GAP"
        stroke="#b8995a" stroke-width="1"
      />

      <!-- ── Selected slot highlight ── -->
      <rect
        v-if="highlight"
        :x="highlight.x" :y="highlight.y"
        :width="highlight.width" :height="highlight.height"
        fill="rgba(46,110,46,0.10)" rx="5"
        stroke="rgba(46,110,46,0.35)" stroke-width="1" stroke-dasharray="3,3"
      />

      <!-- ── Treble clef ── -->
      <text
        :x="5" :y="STAFF_BOTTOM + 6"
        font-size="68" fill="#8b6343" font-family="serif"
      >𝄞</text>

      <!-- ── Time signature ── -->
      <text
        :x="LEFT_MARGIN - 2" :y="STAFF_BOTTOM - LINE_GAP * 1.2"
        font-size="16" fill="#8b6343" font-weight="bold"
      >{{ beatsPerMeasure }}</text>
      <text
        :x="LEFT_MARGIN - 2" :y="STAFF_BOTTOM + 1"
        font-size="16" fill="#8b6343" font-weight="bold"
      >4</text>

      <!-- ── Barlines ── -->
      <line
        v-for="bx in barlineXs" :key="`bar-${bx}`"
        :x1="bx" :x2="bx" :y1="STAFF_TOP" :y2="STAFF_BOTTOM"
        stroke="#b8995a" stroke-width="1.2"
      />

      <!-- ══════════════════════════════════════════════════ -->
      <!-- ── Placed slots                                  ── -->
      <!-- ══════════════════════════════════════════════════ -->
      <g v-for="(sl, si) in slots" :key="sl.id">
        <g v-for="p in sl.pitches" :key="`${sl.id}-${p.name}${p.acc}${p.octave}`">
          <!-- Ledger lines above -->
          <line
            v-for="ly in ledgerAbove(staffY(p.name, p.octave))" :key="`la-${ly}`"
            :x1="slotX(si) - 9" :x2="slotX(si) + 9" :y1="ly" :y2="ly"
            :stroke="noteColor(sl.id)" stroke-width="1"
          />
          <!-- Ledger lines below -->
          <line
            v-for="ly in ledgerBelow(staffY(p.name, p.octave))" :key="`lb-${ly}`"
            :x1="slotX(si) - 9" :x2="slotX(si) + 9" :y1="ly" :y2="ly"
            :stroke="noteColor(sl.id)" stroke-width="1"
          />
          <!-- Accidental -->
          <text
            v-if="p.acc === '#'"
            :x="slotX(si) - 14" :y="staffY(p.name, p.octave) + 4"
            font-size="11" :fill="noteColor(sl.id)" font-family="serif"
          >♯</text>
          <text
            v-else-if="p.acc === 'b'"
            :x="slotX(si) - 12" :y="staffY(p.name, p.octave) + 5"
            font-size="12" :fill="noteColor(sl.id)" font-family="serif"
          >♭</text>
          <!-- Note head -->
          <ellipse
            :cx="slotX(si)" :cy="staffY(p.name, p.octave)"
            rx="5.5" ry="3.8"
            :fill="sl.dur < 2 ? noteColor(sl.id) : 'none'"
            :stroke="noteColor(sl.id)"
            :stroke-width="sl.id === selectedSlotId ? '2' : '1.5'"
            :transform="`rotate(-18,${slotX(si)},${staffY(p.name, p.octave)})`"
          />
          <!-- Playback ring -->
          <ellipse
            :cx="slotX(si)" :cy="staffY(p.name, p.octave)"
            rx="9.5" ry="7.5" fill="none"
            stroke="#2e6e2e" stroke-width="2"
            :opacity="ringOpacity(sl.id)"
          />
        </g>

        <!-- Stem (use first pitch for direction, span all pitches) -->
        <line
          v-if="sl.dur < 3 && sl.pitches.length"
          :x1="stemUp(staffY(sl.pitches[0].name, sl.pitches[0].octave)) ? slotX(si) + 5 : slotX(si) - 5"
          :x2="stemUp(staffY(sl.pitches[0].name, sl.pitches[0].octave)) ? slotX(si) + 5 : slotX(si) - 5"
          :y1="staffY(sl.pitches[0].name, sl.pitches[0].octave)"
          :y2="stemUp(staffY(sl.pitches[0].name, sl.pitches[0].octave))
               ? staffY(sl.pitches[0].name, sl.pitches[0].octave) - 30
               : staffY(sl.pitches[0].name, sl.pitches[0].octave) + 30"
          :stroke="noteColor(sl.id)" stroke-width="1.3"
        />

        <!-- Flags (1/8 and 1/16) -->
        <template v-if="sl.dur <= 0.5 && sl.pitches.length">
          <path
            :d="flagPath1(
              stemUp(staffY(sl.pitches[0].name, sl.pitches[0].octave)) ? slotX(si) + 5 : slotX(si) - 5,
              staffY(sl.pitches[0].name, sl.pitches[0].octave),
              stemUp(staffY(sl.pitches[0].name, sl.pitches[0].octave))
            )"
            fill="none" :stroke="noteColor(sl.id)" stroke-width="1.3"
          />
          <path
            v-if="sl.dur <= 0.25"
            :d="flagPath2(
              stemUp(staffY(sl.pitches[0].name, sl.pitches[0].octave)) ? slotX(si) + 5 : slotX(si) - 5,
              staffY(sl.pitches[0].name, sl.pitches[0].octave),
              stemUp(staffY(sl.pitches[0].name, sl.pitches[0].octave))
            )"
            fill="none" :stroke="noteColor(sl.id)" stroke-width="1.3"
          />
        </template>

        <!-- Augmentation dot (1.5) -->
        <circle
          v-if="sl.dur === 1.5 && sl.pitches.length"
          :cx="slotX(si) + 9"
          :cy="staffY(sl.pitches[0].name, sl.pitches[0].octave) - 1"
          r="2.2" :fill="noteColor(sl.id)"
        />

        <!-- Chord connector (vertical line between top and bottom pitch) -->
        <line
          v-if="sl.pitches.length > 1"
          :x1="slotX(si)" :x2="slotX(si)"
          :y1="Math.min(...sl.pitches.map((p: Pitch) => staffY(p.name, p.octave)))"
          :y2="Math.max(...sl.pitches.map((p: Pitch) => staffY(p.name, p.octave)))"
          stroke="#1a1008" stroke-width="1.3"
        />

        <!-- Invisible hit rect — catches clicks to select the slot -->
        <rect
          v-bind="hitRect(sl, slotX(si))"
          fill="transparent" cursor="pointer"
          @click.stop="store.selectSlot(sl.id)"
        />
      </g>

      <!-- ── Ghost note (hover preview) ── -->
      <template v-if="ghost">
        <line
          v-for="ly in ledgerAbove(staffY(ghost.pitch.name, ghost.pitch.octave))" :key="`gla-${ly}`"
          :x1="ghost.x - 9" :x2="ghost.x + 9" :y1="ly" :y2="ly"
          stroke="#8b2e00" stroke-width="1" opacity="0.32"
        />
        <line
          v-for="ly in ledgerBelow(staffY(ghost.pitch.name, ghost.pitch.octave))" :key="`glb-${ly}`"
          :x1="ghost.x - 9" :x2="ghost.x + 9" :y1="ly" :y2="ly"
          stroke="#8b2e00" stroke-width="1" opacity="0.32"
        />
        <text
          v-if="ghost.pitch.acc === '#'"
          :x="ghost.x - 14" :y="staffY(ghost.pitch.name, ghost.pitch.octave) + 4"
          font-size="11" fill="#8b2e00" font-family="serif" opacity="0.32"
        >♯</text>
        <text
          v-else-if="ghost.pitch.acc === 'b'"
          :x="ghost.x - 12" :y="staffY(ghost.pitch.name, ghost.pitch.octave) + 5"
          font-size="12" fill="#8b2e00" font-family="serif" opacity="0.32"
        >♭</text>
        <ellipse
          :cx="ghost.x" :cy="staffY(ghost.pitch.name, ghost.pitch.octave)"
          rx="5.5" ry="3.8"
          :fill="selectedDur < 2 ? '#8b2e00' : 'none'"
          stroke="#8b2e00" stroke-width="1.5"
          :transform="`rotate(-18,${ghost.x},${staffY(ghost.pitch.name, ghost.pitch.octave)})`"
          opacity="0.32"
        />
      </template>

      <!-- ── Click/hover overlay (below hit rects, above staff) ── -->
      <rect
        v-bind="overlayBounds"
        fill="transparent" cursor="crosshair"
        @mousemove="onStaffHover"
        @mouseleave="onStaffLeave"
        @click="onStaffClick"
      />

      <!-- ── Opening barline ── -->
      <line
        :x1="LEFT_MARGIN - 8" :x2="LEFT_MARGIN - 8"
        :y1="STAFF_TOP" :y2="STAFF_BOTTOM"
        stroke="#8b6343" stroke-width="1.5"
      />

      <!-- ── End barlines ── -->
      <line
        :x1="endX" :x2="endX"
        :y1="STAFF_TOP" :y2="STAFF_BOTTOM"
        stroke="#8b6343" stroke-width="2.5"
      />
      <line
        :x1="endX + 4" :x2="endX + 4"
        :y1="STAFF_TOP" :y2="STAFF_BOTTOM"
        stroke="#8b6343" stroke-width="5"
      />
    </svg>
  </div>

  <!-- Tooltip — rendered to body so it's never clipped by overflow:hidden -->
  <Teleport to="body">
    <div
      class="staff-tooltip"
      :style="{
        opacity:  tooltip.visible ? '1' : '0',
        left:     tooltip.x + 'px',
        top:      tooltip.y + 'px',
      }"
    >{{ tooltip.text }}</div>
  </Teleport>
</template>

<style scoped>
.staff-tooltip {
  position: fixed;
  background: var(--ink);
  color: var(--paper);
  padding: 0.28rem 0.65rem;
  border-radius: 5px;
  font-size: 0.73rem;
  pointer-events: none;
  transition: opacity 0.1s;
  z-index: 100;
  font-family: 'Lora', serif;
  white-space: nowrap;
}
</style>
