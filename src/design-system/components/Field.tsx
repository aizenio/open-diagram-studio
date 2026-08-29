import type { InputHTMLAttributes, ReactNode } from 'react'

export interface FieldProps {
  label: ReactNode
  hint?: ReactNode
  /** Renders label and control side by side instead of stacked. */
  inline?: boolean
  htmlFor?: string
  children: ReactNode
}

/** Label + control + optional hint. The only way to label an input. */
export function Field({ label, hint, inline = false, htmlFor, children }: FieldProps) {
  return (
    <div
      className="ds-field"
      style={
        inline
          ? { gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', alignItems: 'center' }
          : undefined
      }
    >
      <label className="ds-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <span className="ds-field__hint">{hint}</span> : null}
    </div>
  )
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Hides borders until hover/focus. For inline-editable titles. */
  quiet?: boolean
}

export function TextInput({ quiet = false, className, ...rest }: TextInputProps) {
  const classes = ['ds-input', quiet ? 'ds-input--quiet' : '', className ?? '']
    .filter(Boolean)
    .join(' ')
  return <input className={classes} {...rest} />
}

export function ColorInput({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="color"
      className={['ds-color-input', className ?? ''].filter(Boolean).join(' ')}
      {...rest}
    />
  )
}

export function RangeInput({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="range"
      className={['ds-range', className ?? ''].filter(Boolean).join(' ')}
      {...rest}
    />
  )
}

export interface SwatchPickerProps {
  label: string
  value: string
  options: readonly { name: string; value: string }[]
  onSelect: (value: string) => void
}

/** Grid of preset colours. Faster than the OS picker for common edits. */
export function SwatchPicker({ label, value, options, onSelect }: SwatchPickerProps) {
  return (
    <div className="ds-swatches" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="ds-swatch"
          style={{ background: option.value }}
          aria-label={option.name}
          aria-pressed={value.toLowerCase() === option.value.toLowerCase()}
          onClick={() => onSelect(option.value)}
        />
      ))}
    </div>
  )
}
