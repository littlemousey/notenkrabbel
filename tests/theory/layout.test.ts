import { describe, it, expect } from 'vitest'
import {
  slotWidth,
  staffY,
  snapPitch,
  computeLayout,
  durLabel,
  STAFF_BOTTOM,
  STAFF_TOP,
  LINE_GAP,
  NOTE_START,
  EXTRA_PADDING,
} from '@/theory/layout'
import type { Slot, Duration } from '@/types/music'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSlot(id: number, dur: Duration): Slot {
  return { id, dur, pitches: [{ name: 'C', acc: '', octave: 4 }] }
}

// ─── slotWidth ────────────────────────────────────────────────────────────────

describe('slotWidth', () => {
  it('returns correct pixel width for each duration', () => {
    expect(slotWidth(0.25)).toBe(22)
    expect(slotWidth(0.5)).toBe(29)
    expect(slotWidth(1)).toBe(39)
    expect(slotWidth(1.5)).toBe(50)
    expect(slotWidth(2)).toBe(58)
    expect(slotWidth(3)).toBe(72)
  })

  it('falls back to 39 for unknown duration', () => {
    // cast to bypass TS — tests defensive fallback
    expect(slotWidth(99 as Duration)).toBe(39)
  })
})

// ─── staffY ───────────────────────────────────────────────────────────────────

describe('staffY', () => {
  // Middle E (E4) sits on the first staff line from the bottom (STAFF_BOTTOM)
  it('places E4 on STAFF_BOTTOM', () => {
    expect(staffY('E', 4)).toBe(STAFF_BOTTOM)
  })

  // C4 is one space below STAFF_BOTTOM (ledger line note)
  it('places C4 below STAFF_BOTTOM', () => {
    expect(staffY('C', 4)).toBeGreaterThan(STAFF_BOTTOM)
  })

  // Higher notes have smaller Y values (higher on the screen)
  it('places higher notes at smaller Y values', () => {
    expect(staffY('G', 4)).toBeLessThan(staffY('E', 4))
    expect(staffY('B', 4)).toBeLessThan(staffY('G', 4))
    expect(staffY('C', 5)).toBeLessThan(staffY('B', 4))
  })

  // Octave span should equal 7 * LINE_GAP/2
  it('spans exactly 7 steps (one octave) between C4 and C5', () => {
    const diff = staffY('C', 4) - staffY('C', 5)
    expect(diff).toBeCloseTo(7 * (LINE_GAP / 2))
  })

  // Adjacent step should equal LINE_GAP/2
  it('separates adjacent note steps by LINE_GAP/2', () => {
    const diff = staffY('C', 4) - staffY('D', 4)
    expect(diff).toBeCloseTo(LINE_GAP / 2)
  })

  it('STAFF_TOP equals STAFF_BOTTOM minus 4 line gaps', () => {
    expect(STAFF_TOP).toBe(STAFF_BOTTOM - 4 * LINE_GAP)
  })
})

// ─── snapPitch ────────────────────────────────────────────────────────────────

describe('snapPitch', () => {
  it('round-trips: staffY → snapPitch gives back the same note', () => {
    const pairs: [string, number][] = [
      ['C', 4], ['D', 4], ['E', 4], ['F', 4], ['G', 4], ['A', 4], ['B', 4],
      ['C', 5], ['G', 5],
    ]
    for (const [name, octave] of pairs) {
      const y     = staffY(name, octave)
      const snapped = snapPitch(y, '')
      expect(snapped.name).toBe(name)
      expect(snapped.octave).toBe(octave)
    }
  })

  it('passes the accidental through unchanged', () => {
    const y = staffY('F', 4)
    expect(snapPitch(y, '#').acc).toBe('#')
    expect(snapPitch(y, 'b').acc).toBe('b')
    expect(snapPitch(y, '').acc).toBe('')
  })
})

// ─── computeLayout ────────────────────────────────────────────────────────────

describe('computeLayout', () => {
  const startX = NOTE_START + 16   // first note X position

  it('returns empty slot array and minimal totalWidth for no slots', () => {
    const layout = computeLayout([])
    expect(layout.slots).toHaveLength(0)
    expect(layout.totalWidth).toBe(startX + EXTRA_PADDING)
  })

  it('positions the first slot at startX', () => {
    const layout = computeLayout([makeSlot(0, 1)])
    expect(layout.slots[0].x).toBe(startX)
  })

  it('advances X by slotWidth for each slot', () => {
    const layout = computeLayout([makeSlot(0, 1), makeSlot(1, 2)])
    expect(layout.slots[0].x).toBe(startX)
    expect(layout.slots[1].x).toBe(startX + slotWidth(1))
  })

  it('includes EXTRA_PADDING in totalWidth', () => {
    const layout = computeLayout([makeSlot(0, 1)])
    expect(layout.totalWidth).toBe(startX + slotWidth(1) + EXTRA_PADDING)
  })

  it('stores slotId correctly', () => {
    const layout = computeLayout([makeSlot(7, 1), makeSlot(99, 2)])
    expect(layout.slots[0].slotId).toBe(7)
    expect(layout.slots[1].slotId).toBe(99)
  })

  it('handles mixed durations', () => {
    const slots  = [makeSlot(0, 0.5), makeSlot(1, 1), makeSlot(2, 2)]
    const layout = computeLayout(slots)
    expect(layout.slots[1].x).toBe(startX + slotWidth(0.5))
    expect(layout.slots[2].x).toBe(startX + slotWidth(0.5) + slotWidth(1))
  })
})

// ─── durLabel ─────────────────────────────────────────────────────────────────

describe('durLabel', () => {
  it('returns correct labels for all durations', () => {
    expect(durLabel(0.25)).toBe('1/16')
    expect(durLabel(0.5)).toBe('1/8')
    expect(durLabel(1)).toBe('1/4')
    expect(durLabel(1.5)).toBe('3/8')
    expect(durLabel(2)).toBe('1/2')
    expect(durLabel(3)).toBe('3/4')
  })

  it('falls back to string representation for unknown value', () => {
    expect(durLabel(99 as Duration)).toBe('99')
  })
})
