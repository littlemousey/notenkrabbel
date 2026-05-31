import type { Pitch, ChordMatch, KeyId } from '@/types/music'
import { KEY_DATA } from './keys'

/**
 * Parse a note string like 'F#' or 'Bb' into separate name and accidental.
 * Plain note names like 'C' return acc = ''.
 */
export function parseNote(noteStr: string): { name: string; acc: string } {
  if (noteStr.endsWith('#')) return { name: noteStr[0], acc: '#' }
  if (noteStr.endsWith('b') && noteStr.length === 2) return { name: noteStr[0], acc: 'b' }
  return { name: noteStr, acc: '' }
}

/**
 * How well do the current pitches match a given chord?
 * Returns score (number of matching notes), plus matching/missing/extra lists.
 */
export function matchChord(currentPitches: Pitch[], chordNotes: string[]): ChordMatch {
  const curNames = currentPitches.map(p => p.name + p.acc)
  const matching = chordNotes.filter(n => curNames.includes(n))
  const missing  = chordNotes.filter(n => !curNames.includes(n))
  const extra    = curNames.filter(n => !chordNotes.includes(n))
  return { score: matching.length, matching, missing, extra }
}

/**
 * Is a given note (name + accidental) part of the diatonic scale for keyId?
 */
export function isInKey(name: string, acc: string, keyId: KeyId): boolean {
  const scale = KEY_DATA[keyId].scale
  const noteStr = name + acc
  return scale.includes(noteStr) || (acc === '' && scale.includes(name))
}

/**
 * Return the harmonic role of a note within a chord (root / third / fifth / seventh).
 */
export function noteRole(noteNameAcc: string, chordNotes: string[]): string {
  const idx = chordNotes.indexOf(noteNameAcc)
  return (['grondtoon', 'terts', 'kwint', 'septiem'][idx]) ?? ''
}

/**
 * Find the chord in the given key that best matches the supplied pitches.
 * Returns the best-matching ChordDef and its score, or null when no pitches given.
 */
export function findBestMatch(
  pitches: Pitch[],
  keyId: KeyId,
): { chord: (typeof KEY_DATA)[KeyId]['chords'][number]; score: number } | null {
  if (pitches.length === 0) return null
  const chords = KEY_DATA[keyId].chords
  let best = chords[0]
  let bestScore = 0
  for (const ch of chords) {
    const { score } = matchChord(pitches, ch.notes)
    if (score > bestScore) { bestScore = score; best = ch }
  }
  return bestScore > 0 ? { chord: best, score: bestScore } : null
}

/**
 * Guess a good octave for a new note based on existing pitches in the slot.
 * Tries to keep notes close together (within approximately one octave).
 */
export function guessOctave(existingPitches: Pitch[]): number {
  if (existingPitches.length === 0) return 4
  return Math.round(existingPitches.reduce((s, p) => s + p.octave, 0) / existingPitches.length)
}
