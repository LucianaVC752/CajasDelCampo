module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    'server.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/config/',
    '<rootDir>/models/'
  ]
};