import '@testing-library/jest-dom';

// Mock axios to avoid parsing ESM in node_modules during Jest tests
jest.mock('axios', () => {
  const mockInstance = {
    defaults: { headers: { common: {} } },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };

  const create = jest.fn(() => mockInstance);

  return {
    __esModule: true,
    default: { create, ...mockInstance },
    create,
    ...mockInstance,
  };
});