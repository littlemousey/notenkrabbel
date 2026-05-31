// ─── Primitive music types ───────────────────────────────────────────────────

export type NoteName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'

export type Accidental = '' | '#' | 'b'

/** Note duration expressed in quarter-note beats (e.g. 0.25 = 1/16, 1 = 1/4) */
export type Duration = 0.25 | 0.5 | 1 | 1.5 | 2 | 3

export type BeatsPerMeasure = 3 | 4

export type KeyId = 'C' | 'G' | 'F' | 'D' | 'Am' | 'Em' | 'Dm'

export type ChordType = 'maj' | 'min' | 'dim'

// ─── Core data model ─────────────────────────────────────────────────────────

export interface Pitch {
  name: NoteName
  acc: Accidental
  octave: number
}

export interface Slot {
  id: number
  dur: Duration
  pitches: Pitch[]
}

// ─── Music theory structures ──────────────────────────────────────────────────

/**
 * A single chord within a key (e.g. the IV chord in C major = F major).
 * `notes` uses the same notation as Pitch.name + Pitch.acc combined into
 * a single string, e.g. 'C', 'F#', 'Bb'.
 */
export interface ChordDef {
  roman: string
  name: string
  type: ChordType
  notes: string[]   // e.g. ['C', 'E', 'G'] or ['F#', 'A', 'C#']
  mood: string
  role: string
}

export interface KeyData {
  label: string
  scale: string[]   // diatonic note names, e.g. ['C','D','E','F','G','A','B']
  chords: ChordDef[]
}

export type KeyDataMap = Record<KeyId, KeyData>

// ─── Chord matching result ────────────────────────────────────────────────────

export interface ChordMatch {
  score: number       // number of pitches in the slot that belong to this chord
  matching: string[]  // note strings that matched
  missing: string[]   // note strings from the chord not yet in the slot
  extra: string[]     // note strings in the slot not belonging to this chord
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

export interface SlotLayout {
  slotId: number
  x: number
  width: number
}

export interface StaffLayout {
  slots: SlotLayout[]
  totalWidth: number
}
