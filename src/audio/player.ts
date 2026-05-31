import type { Pitch, Slot } from '@/types/music'
import { parseNote } from '@/theory'

// ─── AudioContext singleton ───────────────────────────────────────────────────

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    masterGain = ctx.createGain()
    masterGain.gain.value = 0.5
    masterGain.connect(ctx.destination)
  }
  return ctx
}

function resetCtx(): void {
  if (ctx) { ctx.close(); ctx = null; masterGain = null }
}

// ─── Frequency calculation ────────────────────────────────────────────────────

const NOTE_SEMITONES: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
}

export function noteToFreq(name: string, acc: string, octave: number): number {
  const semi = (NOTE_SEMITONES[name] ?? 0) + (acc === '#' ? 1 : acc === 'b' ? -1 : 0)
  return 440 * Math.pow(2, (semi - 9 + (octave - 4) * 12) / 12)
}

// ─── Low-level note playback ──────────────────────────────────────────────────

function playFreq(freq: number, startTime: number, dur: number, vol = 0.38): void {
  const c = getCtx()
  if (!masterGain) return
  const osc  = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain)
  gain.connect(masterGain)
  osc.type = 'triangle'
  osc.frequency.value = freq
  const rel = Math.min(0.1, dur * 0.28)
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(vol, startTime + 0.015)
  gain.gain.setValueAtTime(vol, startTime + dur - rel)
  gain.gain.linearRampToValueAtTime(0, startTime + dur)
  osc.start(startTime)
  osc.stop(startTime + dur + 0.05)
}

// ─── Preview helpers (called on hover/click) ─────────────────────────────────

export function previewPitch(name: string, acc: string, octave: number): void {
  const c = getCtx()
  playFreq(noteToFreq(name, acc, octave), c.currentTime + 0.01, 0.35, 0.32)
}

export function previewSlot(slot: Slot, tempo: number): void {
  const c    = getCtx()
  const beat = 60 / tempo
  const dur  = Math.min(slot.dur * beat * 0.9, 0.8)
  slot.pitches.forEach(p =>
    playFreq(noteToFreq(p.name, p.acc, p.octave), c.currentTime + 0.01, dur, 0.35),
  )
}

export function previewChordNotes(chordNotes: string[]): void {
  const c = getCtx()
  chordNotes.forEach((n, i) => {
    const { name, acc } = parseNote(n)
    setTimeout(() => playFreq(noteToFreq(name, acc, 4), c.currentTime + 0.01, 0.35, 0.28), i * 60)
  })
}

// ─── Full playback ────────────────────────────────────────────────────────────

export interface PlaybackCallbacks {
  /** Called when a slot starts playing; use to highlight it in the UI. */
  onSlotStart: (slotId: number, pitches: Pitch[]) => void
  /** Called when a slot finishes playing; use to remove highlights. */
  onSlotEnd:   (slotId: number, pitches: Pitch[]) => void
  /** Called when the whole sequence finishes. */
  onEnded:     () => void
}

let _playing    = false
let _timeoutIds: ReturnType<typeof setTimeout>[] = []

export function isPlaying(): boolean {
  return _playing
}

export function stopPlayback(): void {
  _timeoutIds.forEach(id => clearTimeout(id))
  _timeoutIds = []
  _playing    = false
}

export function startPlayback(
  slots:     Slot[],
  tempo:     number,
  callbacks: PlaybackCallbacks,
): void {
  if (!slots.length) return

  // Fresh AudioContext avoids stale-context issues after a previous stop
  resetCtx()
  getCtx()
  _playing = true

  const beat   = 60 / tempo
  let   offset = 0

  slots.forEach(sl => {
    const dur = sl.dur * beat
    const t   = ctx!.currentTime + offset + 0.05

    sl.pitches.forEach(p =>
      playFreq(noteToFreq(p.name, p.acc, p.octave), t, dur * 0.88, 0.35),
    )

    const startId = setTimeout(() => {
      callbacks.onSlotStart(sl.id, sl.pitches)
    }, offset * 1000)

    const endId = setTimeout(() => {
      callbacks.onSlotEnd(sl.id, sl.pitches)
    }, (offset + dur * 0.85) * 1000)

    _timeoutIds.push(startId, endId)
    offset += dur
  })

  const totalMs = slots.reduce((s, sl) => s + sl.dur * beat, 0) * 1000 + 300
  _timeoutIds.push(setTimeout(() => {
    stopPlayback()
    callbacks.onEnded()
  }, totalMs))
}
