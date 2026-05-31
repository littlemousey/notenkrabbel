import { describe, it, expect } from 'vitest'
import {
  parseNote,
  matchChord,
  isInKey,
  noteRole,
  findBestMatch,
  guessOctave,
} from '@/theory/chords'
import type { Pitch } from '@/types/music'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pitch(name: string, acc: string, octave: number): Pitch {
  return { name: name as Pitch['name'], acc: acc as Pitch['acc'], octave }
}

// ─── parseNote ────────────────────────────────────────────────────────────────

describe('parseNote', () => {
  it('parses a plain note', () => {
    expect(parseNote('C')).toEqual({ name: 'C', acc: '' })
    expect(parseNote('G')).toEqual({ name: 'G', acc: '' })
  })

  it('parses a sharp', () => {
    expect(parseNote('F#')).toEqual({ name: 'F', acc: '#' })
    expect(parseNote('C#')).toEqual({ name: 'C', acc: '#' })
  })

  it('parses a flat', () => {
    expect(parseNote('Bb')).toEqual({ name: 'B', acc: 'b' })
    expect(parseNote('Eb')).toEqual({ name: 'E', acc: 'b' })
  })

  it('does not confuse a single-character flat-letter name (e.g. "B") as a flat', () => {
    expect(parseNote('B')).toEqual({ name: 'B', acc: '' })
  })
})

// ─── matchChord ───────────────────────────────────────────────────────────────

describe('matchChord', () => {
  const cMajorNotes = ['C', 'E', 'G']

  it('scores 0 for no matching pitches', () => {
    const result = matchChord([pitch('D', '', 4)], cMajorNotes)
    expect(result.score).toBe(0)
    expect(result.matching).toEqual([])
    expect(result.missing).toEqual(['C', 'E', 'G'])
    expect(result.extra).toEqual(['D'])
  })

  it('scores 1 for one matching pitch', () => {
    const result = matchChord([pitch('C', '', 4)], cMajorNotes)
    expect(result.score).toBe(1)
    expect(result.matching).toEqual(['C'])
    expect(result.missing).toEqual(['E', 'G'])
    expect(result.extra).toEqual([])
  })

  it('scores 3 for a complete match', () => {
    const pitches = [pitch('C', '', 4), pitch('E', '', 4), pitch('G', '', 4)]
    const result  = matchChord(pitches, cMajorNotes)
    expect(result.score).toBe(3)
    expect(result.matching).toEqual(['C', 'E', 'G'])
    expect(result.missing).toEqual([])
    expect(result.extra).toEqual([])
  })

  it('reports extra pitches not in the chord', () => {
    const pitches = [pitch('C', '', 4), pitch('E', '', 4), pitch('G', '', 4), pitch('A', '', 4)]
    const result  = matchChord(pitches, cMajorNotes)
    expect(result.score).toBe(3)
    expect(result.extra).toEqual(['A'])
  })

  it('handles accidentals correctly — F# matches G major V chord', () => {
    const dMajorNotes = ['D', 'F#', 'A']
    const result = matchChord([pitch('F', '#', 4)], dMajorNotes)
    expect(result.score).toBe(1)
    expect(result.matching).toEqual(['F#'])
  })

  it('returns score 0 for empty pitches', () => {
    expect(matchChord([], cMajorNotes).score).toBe(0)
  })
})

// ─── isInKey ──────────────────────────────────────────────────────────────────

describe('isInKey', () => {
  it('identifies scale tones correctly in C major', () => {
    expect(isInKey('C', '',  'C')).toBe(true)
    expect(isInKey('D', '',  'C')).toBe(true)
    expect(isInKey('E', '',  'C')).toBe(true)
    expect(isInKey('B', '',  'C')).toBe(true)
  })

  it('rejects chromatic notes in C major', () => {
    expect(isInKey('F', '#', 'C')).toBe(false)
    expect(isInKey('B', 'b', 'C')).toBe(false)
    expect(isInKey('C', '#', 'C')).toBe(false)
  })

  it('accepts F# in G major', () => {
    expect(isInKey('F', '#', 'G')).toBe(true)
  })

  it('accepts Bb in F major', () => {
    expect(isInKey('B', 'b', 'F')).toBe(true)
  })

  it('accepts G# in A minor (harmonic leading tone)', () => {
    // G# is NOT in the natural A minor scale
    expect(isInKey('G', '#', 'Am')).toBe(false)
  })

  it('accepts all natural tones in A minor', () => {
    for (const note of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
      expect(isInKey(note, '', 'Am')).toBe(true)
    }
  })
})

// ─── noteRole ─────────────────────────────────────────────────────────────────

describe('noteRole', () => {
  const cMajor = ['C', 'E', 'G']

  it('identifies the root', ()   => expect(noteRole('C', cMajor)).toBe('grondtoon'))
  it('identifies the third', ()  => expect(noteRole('E', cMajor)).toBe('terts'))
  it('identifies the fifth', ()  => expect(noteRole('G', cMajor)).toBe('kwint'))
  it('returns empty for non-members', () => expect(noteRole('A', cMajor)).toBe(''))
})

// ─── findBestMatch ────────────────────────────────────────────────────────────

describe('findBestMatch', () => {
  it('returns null for empty pitches', () => {
    expect(findBestMatch([], 'C')).toBeNull()
  })

  it('finds C major as best match when only C is present', () => {
    const result = findBestMatch([pitch('C', '', 4)], 'C')
    expect(result).not.toBeNull()
    expect(result!.chord.name).toBe('C majeur')
    expect(result!.score).toBe(1)
  })

  it('finds C major as best match for a complete C-E-G chord', () => {
    const pitches = [pitch('C', '', 4), pitch('E', '', 4), pitch('G', '', 4)]
    const result  = findBestMatch(pitches, 'C')
    expect(result!.chord.name).toBe('C majeur')
    expect(result!.score).toBe(3)
  })

  it('finds G major as best match for G-B in G major key', () => {
    const pitches = [pitch('G', '', 4), pitch('B', '', 4)]
    const result  = findBestMatch(pitches, 'G')
    expect(result!.chord.name).toBe('G majeur')
  })

  it('returns null when no chord has score > 0', () => {
    // D# is not in C major at all
    const result = findBestMatch([pitch('D', '#', 4)], 'C')
    expect(result).toBeNull()
  })
})

// ─── guessOctave ──────────────────────────────────────────────────────────────

describe('guessOctave', () => {
  it('returns 4 for an empty pitch list', () => {
    expect(guessOctave([])).toBe(4)
  })

  it('returns the octave of a single pitch', () => {
    expect(guessOctave([pitch('C', '', 5)])).toBe(5)
  })

  it('returns the average octave rounded', () => {
    const pitches = [pitch('C', '', 4), pitch('E', '', 4), pitch('G', '', 5)]
    // average = (4+4+5)/3 = 4.33 → rounds to 4
    expect(guessOctave(pitches)).toBe(4)
  })

  it('rounds up correctly', () => {
    const pitches = [pitch('C', '', 4), pitch('G', '', 5)]
    // average = (4+5)/2 = 4.5 → rounds to 5
    expect(guessOctave(pitches)).toBe(5)
  })
})
