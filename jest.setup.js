process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';