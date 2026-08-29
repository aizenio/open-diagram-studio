import type { ReactNode } from 'react'

export interface SegmentedOption<Value extends string> {
  value: Value
  label: string
  icon?: ReactNode
}

export interface SegmentedControlProps<Value extends string> {
  label: string
  value: Value
  options: readonly SegmentedOption<Value>[]
  onChange: (value: Value) => void
}

/** Small mutually-exclusive choice, e.g. edge style or grid mode. */
export function SegmentedControl<Value extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<Value>) {
  return (
    <div className="ds-segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="ds-segmented__item"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  )
}
