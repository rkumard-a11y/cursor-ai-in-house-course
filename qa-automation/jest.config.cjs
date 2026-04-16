const path = require('path')

const qaDir = __dirname
const repoRoot = path.join(qaDir, '..')
const tsJestTransform = require.resolve('ts-jest', { paths: [qaDir] })

/** @type {import('jest').Config} */
module.exports = {
  rootDir: repoRoot,
  testEnvironment: 'node',
  roots: [path.join(qaDir, 'tests', 'unit')],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
  transform: {
    '^.+\\.tsx?$': [
      tsJestTransform,
      {
        tsconfig: path.join(qaDir, 'tsconfig.json'),
      },
    ],
  },
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '<rootDir>/src/**/*.tsx',
    '!<rootDir>/src/**/*.d.ts',
  ],
  coverageDirectory: path.join(qaDir, 'reports', 'raw', 'jest-coverage'),
  coverageReporters: ['json-summary', 'text-summary'],
}
