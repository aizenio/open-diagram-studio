import { afterEach, describe, expect, it } from 'vitest'
import {
  chordSeparator,
  isApplePlatform,
  keyLabel,
  modifierLabel,
  shiftLabel,
} from '../src/features/shortcuts/platform'
import { formatBinding } from '../src/features/shortcuts/use-shortcuts'

function stubPlatform(platform: string, userAgent = '') {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { platform, userAgent },
  })
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'navigator')
})

describe('platform detection', () => {
  it('recognises macOS', () => {
    stubPlatform('MacIntel')
    expect(isApplePlatform()).toBe(true)
  })

  it('recognises iPad', () => {
    stubPlatform('iPad')
    expect(isApplePlatform()).toBe(true)
  })

  it('treats Windows as non-Apple', () => {
    stubPlatform('Win32')
    expect(isApplePlatform()).toBe(false)
  })

  it('falls back to the user agent when platform is empty', () => {
    stubPlatform('', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
    expect(isApplePlatform()).toBe(true)
  })

  it('assumes non-Apple without a navigator', () => {
    expect(isApplePlatform()).toBe(false)
  })
})

describe('labels', () => {
  it('uses Apple glyphs and no separator on a Mac', () => {
    stubPlatform('MacIntel')
    expect(modifierLabel()).toBe('⌘')
    expect(shiftLabel()).toBe('⇧')
    expect(chordSeparator()).toBe('')
    expect(keyLabel('escape')).toBe('esc')
    expect(keyLabel('backspace')).toBe('⌫')
  })

  it('uses names joined by plus signs elsewhere', () => {
    stubPlatform('Win32')
    expect(modifierLabel()).toBe('Ctrl')
    expect(shiftLabel()).toBe('Shift')
    expect(chordSeparator()).toBe('+')
    expect(keyLabel('escape')).toBe('Esc')
    expect(keyLabel('backspace')).toBe('Backspace')
  })

  it('upper-cases single letters on both platforms', () => {
    stubPlatform('Win32')
    expect(keyLabel('r')).toBe('R')
    stubPlatform('MacIntel')
    expect(keyLabel('r')).toBe('R')
  })
})

describe('formatBinding', () => {
  const run = () => undefined

  it('writes a Mac chord as stacked glyphs', () => {
    stubPlatform('MacIntel')
    expect(formatBinding({ key: 'd', mod: true, run })).toBe('⌘D')
    expect(formatBinding({ key: 'a', mod: true, shift: true, run })).toBe('⌘⇧A')
  })

  it('writes a Windows chord with plus signs', () => {
    stubPlatform('Win32')
    expect(formatBinding({ key: 'd', mod: true, run })).toBe('Ctrl+D')
    expect(formatBinding({ key: 'a', mod: true, shift: true, run })).toBe(
      'Ctrl+Shift+A',
    )
  })

  it('shows the first key when a binding accepts several', () => {
    stubPlatform('Win32')
    expect(formatBinding({ key: ['backspace', 'delete'], run })).toBe(
      'Backspace',
    )
  })

  it('honours an explicit display override', () => {
    stubPlatform('Win32')
    expect(formatBinding({ key: ['+', '='], mod: true, display: '+', run })).toBe(
      'Ctrl++',
    )
  })
})
