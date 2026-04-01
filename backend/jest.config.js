/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  cache: true,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/services/**/*.{ts,tsx}',
    'src/lib/**/*.{ts,tsx}',
    'src/utils/**/*.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.d.ts',
  ],
  moduleDirectories: ['node_modules', 'src'],
};
