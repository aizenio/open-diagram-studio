import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ControlSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ControlSize
  /** Icon rendered before the label. Size it with `iconSize` from `sizes`. */
  icon?: ReactNode
  block?: boolean
}

/**
 * Text button. `type` defaults to "button" so a button inside a form never
 * submits by accident.
 */
export function Button({
  variant = 'ghost',
  size = 'md',
  icon,
  block = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    'ds-btn',
    `ds-btn--${variant}`,
    size !== 'md' ? `ds-btn--${size}` : '',
    block ? 'ds-btn--block' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} {...rest}>
      {icon}
      {children}
    </button>
  )
}
