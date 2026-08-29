import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { duration } from '../tokens'

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left'

export interface TooltipProps {
  label: string
  shortcut?: string
  placement?: TooltipPlacement
  /** Delay before showing, in ms. Keeps the UI quiet during fast pointer sweeps. */
  delay?: number
  children: ReactNode
}

/** Gap between the trigger and the bubble. */
const OFFSET = 8

/**
 * Hover/focus tooltip.
 *
 * The bubble is portalled to `document.body` rather than rendered inside the
 * trigger. Every floating card in the app sets a `z-index`, which makes it a
 * stacking context — a tooltip nested inside one can never paint above a
 * sibling card no matter how high its own `z-index` is. Escaping to the body
 * is the only way a tooltip can sit above everything.
 *
 * Handlers live on the wrapping anchor, so any child works without being
 * cloned. Purely presentational: the trigger keeps its own accessible name, so
 * the tooltip is never the only label.
 */
export function Tooltip({
  label,
  shortcut,
  placement = 'top',
  delay = duration.slow,
  children,
}: TooltipProps) {
  const anchor = useRef<HTMLSpanElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  )

  useEffect(
    () => () => {
      if (timer.current !== undefined) window.clearTimeout(timer.current)
    },
    [],
  )

  const hide = useCallback(() => {
    if (timer.current !== undefined) window.clearTimeout(timer.current)
    setPosition(null)
  }, [])

  const show = useCallback(() => {
    if (timer.current !== undefined) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const rect = anchor.current?.getBoundingClientRect()
      if (!rect) return
      const anchors: Record<TooltipPlacement, { top: number; left: number }> = {
        top: { top: rect.top - OFFSET, left: rect.left + rect.width / 2 },
        bottom: { top: rect.bottom + OFFSET, left: rect.left + rect.width / 2 },
        left: { top: rect.top + rect.height / 2, left: rect.left - OFFSET },
        right: { top: rect.top + rect.height / 2, left: rect.right + OFFSET },
      }
      setPosition(anchors[placement])
    }, delay)
  }, [delay, placement])

  // A panel scrolling under an open tooltip would leave it stranded.
  useEffect(() => {
    if (!position) return
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [hide, position])

  const bubble =
    position && typeof document !== 'undefined'
      ? createPortal(
          <div
            className={`ds-tooltip-layer ds-tooltip-layer--${placement}`}
            style={{ top: position.top, left: position.left }}
          >
            <span role="tooltip" className="ds-tooltip">
              {label}
              {shortcut ? <kbd className="ds-kbd">{shortcut}</kbd> : null}
            </span>
          </div>,
          document.body,
        )
      : null

  return (
    <span
      ref={anchor}
      className="ds-tooltip-anchor"
      onPointerEnter={show}
      onPointerLeave={hide}
      onPointerDown={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {bubble}
    </span>
  )
}
