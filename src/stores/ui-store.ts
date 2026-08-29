import { create } from 'zustand'

export type ThemePreference = 'light' | 'dark' | 'system'

/** Mirrored by the pre-paint script in index.html — change both together. */
export const THEME_STORAGE_KEY = 'diagram-studio:theme'

const CYCLE: ThemePreference[] = ['light', 'dark', 'system']

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

/**
 * Reads the saved choice, falling back to "system" when storage is
 * unavailable (private browsing) or holds something unrecognised.
 */
export function readStoredTheme(): ThemePreference {
  try {
    const stored = globalThis.localStorage?.getItem(THEME_STORAGE_KEY)
    return isThemePreference(stored) ? stored : 'system'
  } catch {
    // Storage can be blocked entirely; the app still works, it just forgets.
    return 'system'
  }
}

/**
 * Stamps the choice on `<html>`. "system" clears the stamp so the
 * `prefers-color-scheme` block in tokens.css decides.
 */
export function applyTheme(theme: ThemePreference): void {
  const root = globalThis.document?.documentElement
  if (!root) return
  if (theme === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

/** light → dark → system → light. */
export function nextTheme(theme: ThemePreference): ThemePreference {
  return CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length]
}

interface UiState {
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
  cycleTheme: () => void
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: readStoredTheme(),

  setTheme: (theme) => {
    applyTheme(theme)
    try {
      globalThis.localStorage?.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Nothing to do — the theme is applied, it just will not be remembered.
    }
    set({ theme })
  },

  cycleTheme: () => get().setTheme(nextTheme(get().theme)),
}))
