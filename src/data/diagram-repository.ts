import Dexie, { type Table } from 'dexie'
import type { DiagramDocument } from '../domain/diagram'

interface DiagramRecord {
  id: string
  updatedAt: string
  document: DiagramDocument
}

class DiagramDatabase extends Dexie {
  diagrams!: Table<DiagramRecord, string>

  constructor() {
    super('diagram-studio')
    this.version(1).stores({ diagrams: 'id, updatedAt' })
  }
}

const database = new DiagramDatabase()

export const diagramRepository = {
  async load(): Promise<DiagramDocument | null> {
    const record = await database.diagrams.get('current-diagram')
    return record?.document ?? null
  },

  async save(document: DiagramDocument): Promise<void> {
    await database.diagrams.put({
      id: document.id,
      updatedAt: document.updatedAt,
      document,
    })
  },
}
