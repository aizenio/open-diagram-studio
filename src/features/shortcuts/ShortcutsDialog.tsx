import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { IconButton, Kbd } from '../../design-system'
import { formatBinding, type ShortcutBinding } from './use-shortcuts'

interface ShortcutsDialogProps {
  open: boolean
  /** The live binding list — the dialog never keeps its own copy, so it
   *  cannot drift from what the keyboard actually does. */
  bindings: ShortcutBinding[]
  onClose: () => void
}

export function ShortcutsDialog({
  open,
  bindings,
  onClose,
}: ShortcutsDialogProps) {
  const closeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.querySelector('button')?.focus()
  }, [open])

  if (!open) return null

  const groups = new Map<string, ShortcutBinding[]>()
  bindings
    .filter((binding) => binding.title)
    .forEach((binding) => {
      const group = binding.group ?? 'Other'
      groups.set(group, [...(groups.get(group) ?? []), binding])
    })

  return (
    <div
      className="shortcuts-scrim"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="shortcuts-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
      >
        <div className="shortcuts-header">
          <h2>Keyboard shortcuts</h2>
          <div ref={closeRef}>
            <IconButton
              label="Close shortcuts"
              tooltipPlacement="left"
              icon={<X size={16} />}
              onClick={onClose}
            />
          </div>
        </div>

        <div className="shortcuts-body">
          {[...groups].map(([group, items]) => (
            <section key={group} className="shortcuts-group">
              <h3 className="ds-eyebrow">{group}</h3>
              <dl>
                {items.map((binding) => (
                  <div key={binding.title}>
                    <dt>{binding.title}</dt>
                    <dd>
                      <Kbd onSurface>{formatBinding(binding)}</Kbd>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
