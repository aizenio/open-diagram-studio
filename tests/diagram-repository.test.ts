import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { diagramRepository } from '../src/data/diagram-repository'
import type { DiagramDocument } from '../src/domain/diagram'

describe('diagram repository', () => {
  it('returns null before saving, then saves and replaces the current diagram', async () => {
    expect(await diagramRepository.load()).toBeNull()

    const initial: DiagramDocument = {
      id: 'current-diagram',
      title: 'First title',
      version: 1,
      updatedAt: '2026-08-29T08:00:00.000Z',
      nodes: [],
      edges: [],
    }
    await diagramRepository.save(initial)
    expect(await diagramRepository.load()).toEqual(initial)

    const updated = {
      ...initial,
      title: 'Updated title',
      updatedAt: '2026-08-29T08:01:00.000Z',
    }
    await diagramRepository.save(updated)

    expect(await diagramRepository.load()).toEqual(updated)
  })
})