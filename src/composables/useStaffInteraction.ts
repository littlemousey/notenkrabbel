import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { Pitch, Duration } from '@/types/music'
import { snapPitch, durLabel } from '@/theory'
import { useScoreStore } from '@/stores/score'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TooltipState {
  visible: boolean
  text:    string
  x:       number
  y:       number
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useStaffInteraction(
  svgRef:      Ref<SVGSVGElement | null>,
  selectedDur: Ref<Duration>,
  selectedAcc: Ref<string>,
) {
  const store = useScoreStore()

  // ─── Hover / ghost note ────────────────────────────────────────────────────

  const hoveredPitch = ref<Pitch | null>(null)
  const hoverX       = ref<number | null>(null)

  const tooltip = ref<TooltipState>({ visible: false, text: '', x: 0, y: 0 })

  // ─── Drag (chip reordering) ────────────────────────────────────────────────

  const dragSrcIdx = ref<number | null>(null)

  // ─── SVG coordinate conversion ─────────────────────────────────────────────

  function getSvgXY(evt: MouseEvent): { x: number; y: number } {
    const svg = svgRef.value
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const vb   = svg.viewBox.baseVal
    return {
      x: (evt.clientX - rect.left) * (vb.width  / rect.width),
      y: (evt.clientY - rect.top)  * (vb.height / rect.height),
    }
  }

  // ─── Staff hover ───────────────────────────────────────────────────────────

  function onStaffHover(evt: MouseEvent): void {
    const { x, y } = getSvgXY(evt)
    hoveredPitch.value = snapPitch(y, selectedAcc.value)
    hoverX.value       = x

    const p      = hoveredPitch.value
    const accSym = p.acc === '#' ? '♯' : p.acc === 'b' ? '♭' : ''
    const action = store.selectedSlotId !== null ? 'toevoegen aan akkoord' : 'nieuwe noot'

    tooltip.value = {
      visible: true,
      text:    `${p.name}${accSym}${p.octave} · ${durLabel(selectedDur.value)} · ${action}`,
      x:       evt.clientX + 14,
      y:       evt.clientY - 22,
    }
  }

  function onStaffLeave(): void {
    hoveredPitch.value = null
    hoverX.value       = null
    tooltip.value.visible = false
  }

  // ─── Staff click ───────────────────────────────────────────────────────────

  function onStaffClick(evt: MouseEvent): void {
    const { y } = getSvgXY(evt)
    const pitch = snapPitch(y, selectedAcc.value)

    if (store.selectedSlotId !== null) {
      store.addPitchToSelected(pitch)
    } else {
      store.addSlot(pitch, selectedDur.value)
    }
  }

  // ─── Tooltip follow-mouse (attach to document in the component) ────────────

  function onMouseMove(evt: MouseEvent): void {
    if (tooltip.value.visible) {
      tooltip.value.x = evt.clientX + 14
      tooltip.value.y = evt.clientY - 22
    }
  }

  // ─── Drag helpers ──────────────────────────────────────────────────────────

  function onDragStart(idx: number): void {
    dragSrcIdx.value = idx
  }

  function onDrop(targetIdx: number): void {
    if (dragSrcIdx.value === null || dragSrcIdx.value === targetIdx) return
    store.moveSlot(dragSrcIdx.value, targetIdx)
    dragSrcIdx.value = null
  }

  function onDragEnd(): void {
    dragSrcIdx.value = null
  }

  // ─── Hint bar text ─────────────────────────────────────────────────────────

  const hintText = computed(() => {
    const sl = store.selectedSlot
    if (!sl) {
      return 'Klik op de notenbalk om een noot te plaatsen · klik op een bestaande noot of chip om hem te selecteren voor een akkoord'
    }
    const pitchNames = sl.pitches
      .map(p => p.name + (p.acc === '#' ? '♯' : p.acc === 'b' ? '♭' : '') + p.octave)
      .join(', ')
    return `🎹 Geselecteerd: ${pitchNames} — klik op de balk om een noot toe te voegen aan dit akkoord · klik nogmaals of op ✕ Deselecteer om de selectie op te heffen`
  })

  const hintSelecting = computed(() => store.selectedSlotId !== null)

  return {
    // hover / ghost
    hoveredPitch,
    hoverX,
    // tooltip
    tooltip,
    // drag
    dragSrcIdx,
    // event handlers
    onStaffHover,
    onStaffLeave,
    onStaffClick,
    onMouseMove,
    onDragStart,
    onDrop,
    onDragEnd,
    // hint bar
    hintText,
    hintSelecting,
  }
}
