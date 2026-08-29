import type { ReactNode } from 'react'

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger'

export interface StatusDotProps {
  tone?: StatusTone
  /** Pulses while an operation is in flight. */
  pulse?: boolean
}

export function StatusDot({ tone = 'neutral', pulse = false }: StatusDotProps) {
  return (
    <i
      aria-hidden="true"
      className={[
        'ds-status-dot',
        tone !== 'neutral' ? `ds-status-dot--${tone}` : '',
        pulse ? 'ds-status-dot--pulse' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}

export interface BadgeProps {
  tone?: 'neutral' | 'accent'
  children: ReactNode
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span className={`ds-badge${tone === 'accent' ? ' ds-badge--accent' : ''}`}>
      {children}
    </span>
  )
}

export interface KbdProps {
  /** Renders on a light surface instead of a dark tooltip. */
  onSurface?: boolean
  children: ReactNode
}

export function Kbd({ onSurface = false, children }: KbdProps) {
  return (
    <kbd className={`ds-kbd${onSurface ? ' ds-kbd--onSurface' : ''}`}>
      {children}
    </kbd>
  )
}

export interface SpinnerProps {
  /** Diameter in pixels. */
  size?: number
  label?: string
}

/**
 * Indeterminate progress. Announces itself, so a screen reader is not left
 * waiting in silence while the board loads.
 */
export function Spinner({ size = 16, label = 'Loading' }: SpinnerProps) {
  return (
    <span
      className="ds-spinner"
      role="status"
      aria-label={label}
      style={{ width: size, height: size }}
    />
  )
}

export interface EmptyStateProps {
  icon?: ReactNode
  title: ReactNode
  body?: ReactNode
  action?: ReactNode
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="ds-empty-state">
      {icon}
      <p className="ds-empty-state__title">{title}</p>
      {body ? <p className="ds-empty-state__body">{body}</p> : null}
      {action}
    </div>
  )
}
