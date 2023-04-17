import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['specs/*.spec.js'],
    watchExclude: ['node_modules/**', 'solve/**', 'answerscache/**', 'processedcache/**']
  },
})
