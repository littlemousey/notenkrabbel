import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Slot, Pitch, Duration, Accidental, BeatsPerMeasure, KeyId } from '@/types/music'
import { parseNote, guessOctave, findBestMatch } from '@/theory'
import {
  previewPitch, previewSlot, previewChordNotes,
  startPlayback, stopPlayback as audioStop, isPlaying,
} from '@/audio/player'

export const useScoreStore = defineStore('score', () => {

  // ─── State ────────────────────────────────────────────────────────────────

  const scoreTitle      = ref('Mijn melodie')
  const slots           = ref<Slot[]>([])
  const selectedSlotId  = ref<number | null>(null)
  const playingSlotId   = ref<number | null>(null)
  const tempo           = ref(90)
  const beatsPerMeasure = ref<BeatsPerMeasure>(4)
  const currentKey      = ref<KeyId>('C')
  const selectedDur     = ref<Duration>(1)
  const selectedAcc     = ref<Accidental>('')

  let _nextId = 0

  // ─── Computed ─────────────────────────────────────────────────────────────

  const selectedSlot = computed(() =>
    selectedSlotId.value !== null
      ? slots.value.find(s => s.id === selectedSlotId.value) ?? null
      : null,
  )

  const totalBeats = computed(() =>
    slots.value.reduce((s, sl) => s + sl.dur, 0),
  )

  const measureCount = computed(() =>
    Math.floor(totalBeats.value / beatsPerMeasure.value),
  )

  const chordCount = computed(() =>
    slots.value.filter(sl => sl.pitches.length > 1).length,
  )

  const scoreInfo = computed(() => {
    let info = `${slots.value.length} slots · ${beatsPerMeasure.value}/4 · ${measureCount.value} maten`
    if (chordCount.value) info += ` · ${chordCount.value} akkoord${chordCount.value > 1 ? 'en' : ''}`
    return info
  })

  // ─── Slot mutations ───────────────────────────────────────────────────────

  function addSlot(pitch: Pitch, dur: Duration): void {
    slots.value.push({ id: _nextId++, dur, pitches: [pitch] })
    previewPitch(pitch.name, pitch.acc, pitch.octave)
  }

  function addPitchToSelected(pitch: Pitch): void {
    const sl = selectedSlot.value
    if (!sl) return
    const exists = sl.pitches.some(
      p => p.name === pitch.name && p.acc === pitch.acc && p.octave === pitch.octave,
    )
    if (!exists) {
      sl.pitches.push(pitch)
      previewPitch(pitch.name, pitch.acc, pitch.octave)
    }
  }

  /** Add a note (from a chord suggestion pill) to the currently selected slot. */
  function addNoteStringToSelected(noteStr: string): void {
    const sl = selectedSlot.value
    if (!sl) return
    const { name, acc } = parseNote(noteStr)
    const octave = guessOctave(sl.pitches)
    addPitchToSelected({ name: name as Pitch['name'], acc: acc as Pitch['acc'], octave })
  }

  /** Replace all pitches in the selected slot with a full chord voicing. */
  function insertChord(chordNotes: string[]): void {
    const sl = selectedSlot.value
    if (!sl) return
    const base = sl.pitches.length > 0 ? sl.pitches[0].octave : 4
    sl.pitches = chordNotes.map((n, i) => {
      const { name, acc } = parseNote(n)
      let oct = base
      if (i > 0) {
        // Ensure each added note is not lower than the previous one in pitch
        const prev = sl.pitches[i - 1]
        if (prev) {
          const prevMidi = (prev.octave * 12) + midiStep(prev.name, prev.acc)
          const curMidi  = (oct * 12) + midiStep(name, acc)
          if (curMidi < prevMidi) oct++
        }
      }
      return { name: name as Pitch['name'], acc: acc as Pitch['acc'], octave: oct }
    })
    previewSlot(sl, tempo.value)
  }

  function removeSlot(slotId: number): void {
    const idx = slots.value.findIndex(s => s.id === slotId)
    if (idx === -1) return
    if (selectedSlotId.value === slotId) selectedSlotId.value = null
    slots.value.splice(idx, 1)
  }

  function moveSlot(fromIdx: number, toIdx: number): void {
    const [moved] = slots.value.splice(fromIdx, 1)
    slots.value.splice(toIdx, 0, moved)
  }

  function undoLast(): void {
    if (!slots.value.length) return
    const last = slots.value[slots.value.length - 1]
    if (last.pitches.length > 1) {
      last.pitches.pop()
    } else {
      if (selectedSlotId.value === last.id) selectedSlotId.value = null
      slots.value.pop()
    }
  }

  function clearAll(): void {
    slots.value      = []
    selectedSlotId.value = null
  }

  // ─── Selection ────────────────────────────────────────────────────────────

  function selectSlot(id: number): void {
    if (selectedSlotId.value === id) {
      selectedSlotId.value = null
      return
    }
    selectedSlotId.value = id
    const sl = slots.value.find(s => s.id === id)
    if (sl) previewSlot(sl, tempo.value)
  }

  function deselect(): void {
    selectedSlotId.value = null
  }

  // ─── Playback ─────────────────────────────────────────────────────────────

  const playing = computed(() => isPlaying())

  function togglePlay(): void {
    if (isPlaying()) {
      stopPlay()
      return
    }
    if (!slots.value.length) return
    startPlayback(slots.value, tempo.value, {
      onSlotStart: (id) => { playingSlotId.value = id },
      onSlotEnd:   ()   => { playingSlotId.value = null },
      onEnded:     ()   => { playingSlotId.value = null },
    })
  }

  function stopPlay(): void {
    audioStop()
    playingSlotId.value = null
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  function setTempo(bpm: number): void {
    tempo.value = bpm
  }

  function setMeter(bpm: BeatsPerMeasure): void {
    beatsPerMeasure.value = bpm
  }

  function setKey(key: KeyId): void {
    currentKey.value = key
  }

  function setDur(d: Duration): void {
    selectedDur.value = d
  }

  function setAcc(a: Accidental): void {
    selectedAcc.value = a
  }

  // ─── Chord assistant helpers ───────────────────────────────────────────────

  const bestChordMatch = computed(() => {
    const sl = selectedSlot.value
    if (!sl || sl.pitches.length === 0) return null
    return findBestMatch(sl.pitches, currentKey.value)
  })

  function previewChord(notes: string[]): void {
    previewChordNotes(notes)
  }

  // ─── Internal helper ──────────────────────────────────────────────────────

  function midiStep(name: string, acc: string): number {
    const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
    return (base[name] ?? 0) + (acc === '#' ? 1 : acc === 'b' ? -1 : 0)
  }

  // ─── Export ───────────────────────────────────────────────────────────────

  return {
    // state
    scoreTitle, slots, selectedSlotId, playingSlotId,
    tempo, beatsPerMeasure, currentKey, selectedDur, selectedAcc,
    // computed
    selectedSlot, totalBeats, measureCount, chordCount, scoreInfo,
    playing, bestChordMatch,
    // actions
    addSlot, addPitchToSelected, addNoteStringToSelected,
    insertChord, removeSlot, moveSlot, undoLast, clearAll,
    selectSlot, deselect,
    togglePlay, stopPlay, setTempo, setMeter, setKey, setDur, setAcc,
    previewChord,
  }
})
