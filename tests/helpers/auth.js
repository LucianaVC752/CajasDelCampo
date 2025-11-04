const jwt = require('jsonwebtoken');

function signJwt(user) {
  const secret = process.env.JWT_SECRET || 'test_secret_key_please_change';
  return jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    secret,
    { expiresIn: '15m' }
  );
}

module.exports = { signJwt };