import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { ControlSize } from './Button'
import { Tooltip, type TooltipPlacement } from './Tooltip'

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Required: an icon-only control must still announce itself. */
  label: string
  icon: ReactNode
  size?: ControlSize
  active?: boolean
  tone?: 'default' | 'danger'
  outlined?: boolean
  /** Keyboard shortcut shown in the tooltip, e.g. "R". */
  shortcut?: string
  /** Set to false to opt out of the tooltip (inside menus, for example). */
  tooltip?: boolean
  tooltipPlacement?: TooltipPlacement
}

/**
 * Square icon-only button. Always renders an accessible name, and by default
 * a tooltip carrying that same name plus its shortcut.
 */
export function IconButton({
  label,
  icon,
  size = 'md',
  active = false,
  tone = 'default',
  outlined = false,
  shortcut,
  tooltip = true,
  tooltipPlacement = 'right',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const classes = [
    'ds-icon-btn',
    size !== 'md' ? `ds-icon-btn--${size}` : '',
    active ? 'ds-icon-btn--active' : '',
    tone === 'danger' ? 'ds-icon-btn--danger' : '',
    outlined ? 'ds-icon-btn--outlined' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  const button = (
    <button
      type={type}
      className={classes}
      aria-label={label}
      title={tooltip ? undefined : label}
      {...rest}
    >
      {icon}
    </button>
  )

  if (!tooltip) return button

  return (
    <Tooltip label={label} shortcut={shortcut} placement={tooltipPlacement}>
      {button}
    </Tooltip>
  )
}
