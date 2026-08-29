import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  applyTheme,
  isThemePreference,
  nextTheme,
  readStoredTheme,
  THEME_STORAGE_KEY,
  useUiStore,
} from '../src/stores/ui-store'

/** Minimal stand-ins — vitest runs these in the node environment. */
function stubStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
      removeItem: (key: string) => void data.delete(key),
    },
  })
  return data
}

function stubDocument() {
  const attributes = new Map<string, string>()
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      documentElement: {
        setAttribute: (name: string, value: string) =>
          void attributes.set(name, value),
        removeAttribute: (name: string) => void attributes.delete(name),
      },
    },
  })
  return attributes
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage')
  Reflect.deleteProperty(globalThis, 'document')
})

describe('theme preference helpers', () => {
  it('recognises only the three supported values', () => {
    expect(isThemePreference('light')).toBe(true)
    expect(isThemePreference('dark')).toBe(true)
    expect(isThemePreference('system')).toBe(true)
    expect(isThemePreference('sepia')).toBe(false)
    expect(isThemePreference(null)).toBe(false)
  })

  it('cycles light to dark to system and back', () => {
    expect(nextTheme('light')).toBe('dark')
    expect(nextTheme('dark')).toBe('system')
    expect(nextTheme('system')).toBe('light')
  })
})

describe('readStoredTheme', () => {
  it('returns the saved value', () => {
    stubStorage({ [THEME_STORAGE_KEY]: 'dark' })
    expect(readStoredTheme()).toBe('dark')
  })

  it('falls back to system for an unrecognised value', () => {
    stubStorage({ [THEME_STORAGE_KEY]: 'neon' })
    expect(readStoredTheme()).toBe('system')
  })

  it('falls back to system when storage is absent', () => {
    expect(readStoredTheme()).toBe('system')
  })

  it('falls back to system when storage throws', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked')
      },
    })
    expect(readStoredTheme()).toBe('system')
  })
})

describe('applyTheme', () => {
  it('stamps an explicit choice on the document element', () => {
    const attributes = stubDocument()
    applyTheme('dark')
    expect(attributes.get('data-theme')).toBe('dark')
  })

  it('clears the stamp for system so the media query decides', () => {
    const attributes = stubDocument()
    applyTheme('light')
    applyTheme('system')
    expect(attributes.has('data-theme')).toBe(false)
  })

  it('does nothing without a document', () => {
    expect(() => applyTheme('dark')).not.toThrow()
  })
})

describe('useUiStore', () => {
  beforeEach(() => {
    useUiStore.setState({ theme: 'system' })
  })

  it('persists and applies an explicit choice', () => {
    const storage = stubStorage()
    const attributes = stubDocument()

    useUiStore.getState().setTheme('dark')

    expect(useUiStore.getState().theme).toBe('dark')
    expect(storage.get(THEME_STORAGE_KEY)).toBe('dark')
    expect(attributes.get('data-theme')).toBe('dark')
  })

  it('cycles through the three preferences', () => {
    stubStorage()
    stubDocument()
    const { cycleTheme } = useUiStore.getState()

    cycleTheme()
    expect(useUiStore.getState().theme).toBe('light')
    cycleTheme()
    expect(useUiStore.getState().theme).toBe('dark')
    cycleTheme()
    expect(useUiStore.getState().theme).toBe('system')
  })

  it('still applies the theme when storage rejects the write', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => {
          throw new Error('quota exceeded')
        },
      },
    })
    const attributes = stubDocument()

    expect(() => useUiStore.getState().setTheme('light')).not.toThrow()
    expect(attributes.get('data-theme')).toBe('light')
    expect(useUiStore.getState().theme).toBe('light')
  })
})
