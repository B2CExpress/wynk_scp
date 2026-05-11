/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testRegex: '.*\\.(test|spec)\\.ts$',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // npm workspaces faz hoisting: deps transitivas vivem em ../node_modules.
  // Jest não sobe a árvore como Node, então listamos explicitamente.
  moduleDirectories: ['node_modules', '<rootDir>/../node_modules'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
};
