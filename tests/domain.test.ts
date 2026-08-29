import { describe, expect, it } from 'vitest'
import { createBlankDocument } from '../src/domain/diagram'

describe('diagram document', () => {
  it('creates an empty versioned document with a valid timestamp', () => {
    const document = createBlankDocument()

    expect(document).toMatchObject({
      id: 'current-diagram',
      title: 'Untitled diagram',
      version: 1,
      nodes: [],
      edges: [],
    })
    expect(Number.isNaN(Date.parse(document.updatedAt))).toBe(false)
  })
})