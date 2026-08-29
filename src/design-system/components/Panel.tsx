import type { ReactNode } from 'react'

export interface PanelProps {
  /** "floating" lifts the panel off the canvas with a hairline + shadow. */
  variant?: 'flat' | 'floating'
  className?: string
  children: ReactNode
}

export function Panel({ variant = 'flat', className, children }: PanelProps) {
  const classes = [
    variant === 'floating' ? 'ds-floating' : 'ds-panel',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')
  return <div className={classes}>{children}</div>
}

export interface PanelHeaderProps {
  title: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
}

export function PanelHeader({ title, eyebrow, actions }: PanelHeaderProps) {
  return (
    <div className="ds-panel-header">
      <div className="ds-stack">
        {eyebrow ? <span className="ds-eyebrow">{eyebrow}</span> : null}
        <h2 className="ds-panel-header__title">{title}</h2>
      </div>
      {actions ? <div className="ds-row ds-gap-05">{actions}</div> : null}
    </div>
  )
}

export interface PanelSectionProps {
  title?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

export function PanelSection({ title, actions, children }: PanelSectionProps) {
  return (
    <section className="ds-panel-section">
      {title ? (
        <div className="ds-panel-section__head">
          <span className="ds-eyebrow">{title}</span>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  )
}
