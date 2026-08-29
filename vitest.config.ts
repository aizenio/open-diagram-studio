import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      include: [
        'src/data/**/*.ts',
        'src/domain/**/*.ts',
        'src/stores/**/*.ts',
      ],
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        branches: 70,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    },
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})