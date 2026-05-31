import type { Pitch, Slot, Duration, StaffLayout, SlotLayout } from '@/types/music'

// ─── Staff geometry constants ─────────────────────────────────────────────────

export const LINE_GAP      = 13
export const STAFF_BOTTOM  = 122
export const STAFF_TOP     = STAFF_BOTTOM - 4 * LINE_GAP
export const LEFT_MARGIN   = 74
export const NOTE_START    = LEFT_MARGIN + 20
export const EXTRA_PADDING = 55

// ─── Duration → pixel width ───────────────────────────────────────────────────

const DUR_WIDTH: Record<number, number> = {
  0.25: 22,
  0.5:  29,
  1:    39,
  1.5:  50,
  2:    58,
  3:    72,
}

export function slotWidth(dur: Duration): number {
  return DUR_WIDTH[dur] ?? 39
}

// ─── Staff-line Y position for a note ────────────────────────────────────────

const NOTE_STEP: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }

export function staffY(name: string, octave: number): number {
  const step = NOTE_STEP[name] ?? 0
  return STAFF_BOTTOM - (((octave - 4) * 7 + step) - 2) * (LINE_GAP / 2)
}

// ─── Snap SVG Y coordinate to the nearest note/step ─────────────────────────

const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

export function snapPitch(svgY: number, acc: string): Pitch {
  const steps = Math.round((STAFF_BOTTOM - svgY) / (LINE_GAP / 2))
  const abs   = steps + 2
  const oct   = Math.floor(abs / 7) + 4
  const idx   = ((abs % 7) + 7) % 7
  return {
    name:   NOTE_NAMES[idx],
    acc:    acc as Pitch['acc'],
    octave: oct,
  }
}

// ─── Compute X positions for all slots ───────────────────────────────────────

export function computeLayout(slots: Slot[]): StaffLayout {
  let x = NOTE_START + 16
  const slotLayouts: SlotLayout[] = slots.map(sl => {
    const layout: SlotLayout = { slotId: sl.id, x, width: slotWidth(sl.dur) }
    x += slotWidth(sl.dur)
    return layout
  })
  return { slots: slotLayouts, totalWidth: x + EXTRA_PADDING }
}

// ─── Human-readable duration label ───────────────────────────────────────────

const DUR_LABEL: Record<number, string> = {
  0.25: '1/16',
  0.5:  '1/8',
  1:    '1/4',
  1.5:  '3/8',
  2:    '1/2',
  3:    '3/4',
}

export function durLabel(dur: Duration): string {
  return DUR_LABEL[dur] ?? String(dur)
}
