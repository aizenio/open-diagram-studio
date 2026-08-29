import type { ReactNode } from 'react'

export interface ToolbarProps {
  orientation?: 'vertical' | 'horizontal'
  label: string
  className?: string
  children: ReactNode
}

/** Floating rail of icon buttons. */
export function Toolbar({
  orientation = 'vertical',
  label,
  className,
  children,
}: ToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation}
      className={['ds-toolbar', `ds-toolbar--${orientation}`, className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

export function Divider({
  orientation = 'horizontal',
}: {
  orientation?: 'horizontal' | 'vertical'
}) {
  return (
    <span
      aria-hidden="true"
      className={`ds-divider ds-divider--${orientation}`}
    />
  )
}
