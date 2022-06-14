// ensure NODE_ENV
process.env.NODE_ENV = 'test'

// if tsconfig.test.json exists in cwd prefer it
const { existsSync } = require('fs')
const { join } = require('path')
const { argv } = require('process')
const testTsconfigPath = join(process.cwd(), 'tsconfig.test.json')
if (existsSync(testTsconfigPath)) {
  process.env.TS_NODE_PROJECT = testTsconfigPath
}

// when not in watch mode, exit test runner on unhandled rejections
if (!argv.includes('--watch')) {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection during test execution:', promise, 'reason:', reason)
    process.exit(1)
  })
}

module.exports = {
  require: ['esbuild-register'],
  extension: ['ts'],
  watchExtensions: ['ts'],
  timeout: 30000,
}
