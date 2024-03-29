process.env.NODE_ENV = 'test' // ensure NODE_ENV
process.env.TEST_ENV = process.env.TEST_ENV || 'local'

// if tsconfig.test.json exists in cwd prefer it
const { existsSync } = require('fs')
const { join } = require('path')
const testTsconfigPath = join(process.cwd(), 'tsconfig.test.json')
if (existsSync(testTsconfigPath)) {
  process.env.TS_NODE_PROJECT = testTsconfigPath
}

// exit test runner on unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection during test execution:', promise, 'reason:', reason)
  process.exit(1)
})

module.exports = {
  require: ['ts-node/register/transpile-only', 'dotenv/config'],
  extension: ['ts'],
  watchExtensions: ['ts'],
  spec: ['test-e2e/**/*.test.ts'],
  timeout: 5000000,
}
