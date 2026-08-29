/**
 * Platform differences in keyboard conventions.
 *
 * The primary modifier is Cmd on Apple platforms and Ctrl everywhere else,
 * and the two render very differently: macOS stacks bare glyphs (⌘⇧D) while
 * Windows and Linux join names with plus signs (Ctrl+Shift+D).
 */

interface UserAgentDataLike {
  platform?: string
}

/** True where Cmd is the primary modifier. */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  const withData = navigator as Navigator & {
    userAgentData?: UserAgentDataLike
  }
  const platform = withData.userAgentData?.platform || navigator.platform || ''
  const probe = platform || navigator.userAgent || ''
  return /mac|iphone|ipad|ipod/i.test(probe)
}

/** Label for the primary modifier — "⌘" or "Ctrl". */
export function modifierLabel(): string {
  return isApplePlatform() ? '⌘' : 'Ctrl'
}

export function shiftLabel(): string {
  return isApplePlatform() ? '⇧' : 'Shift'
}

/** How the platform joins the parts of a chord. */
export function chordSeparator(): string {
  return isApplePlatform() ? '' : '+'
}

const NAMED_KEYS: Record<string, { apple: string; other: string }> = {
  escape: { apple: 'esc', other: 'Esc' },
  backspace: { apple: '⌫', other: 'Backspace' },
  delete: { apple: '⌦', other: 'Del' },
  enter: { apple: '↩', other: 'Enter' },
  arrowleft: { apple: '←', other: '←' },
  arrowright: { apple: '→', other: '→' },
  arrowup: { apple: '↑', other: '↑' },
  arrowdown: { apple: '↓', other: '↓' },
  ' ': { apple: 'space', other: 'Space' },
}

/** Renders one key for display: "r" → "R", "escape" → "Esc" or "esc". */
export function keyLabel(key: string): string {
  const named = NAMED_KEYS[key.toLowerCase()]
  if (named) return isApplePlatform() ? named.apple : named.other
  return key.length === 1 ? key.toUpperCase() : key
}
