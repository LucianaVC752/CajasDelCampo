module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/frontend/'],
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