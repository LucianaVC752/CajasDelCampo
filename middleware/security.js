const crypto = require('crypto');
const { logValidation } = require('../utils/securityLogger');

// Basic recursive sanitization: strips HTML tags and dangerous patterns
function sanitizeValue(value) {
  if (typeof value !== 'string') return value;
  // Skip base64 image content to avoid corrupting it
  if (/^data:image\//.test(value)) return value;
  // Remove script tags and any HTML tags
  let sanitized = value.replace(/<\s*script[^>]*>([\s\S]*?)<\s*\/\s*script\s*>/gi, '')
                      .replace(/<[^>]*>/g, '')
                      .replace(/[\u0000-\u001F\u007F]/g, '') // control chars
                      .trim();
  return sanitized;
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && typeof val === 'object') {
      sanitized[key] = sanitizeObject(val);
    } else {
      sanitized[key] = sanitizeValue(val);
    }
  }
  return sanitized;
}

// Middleware: sanitize req.body and req.query
function sanitizeRequest(req, res, next) {
  try {
    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) req.query = sanitizeObject(req.query);
    next();
  } catch (e) {
    logValidation(req, [{ msg: 'Sanitization error', error: e.message }]);
    res.status(400).json({ message: 'Invalid request payload' });
  }
}

// CSRF protection using double-submit cookie with HMAC-signed token
const TOKEN_HEADER = 'x-csrf-token';
const TOKEN_COOKIE = 'XSRF-TOKEN';
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function parseCookies(req) {
  const header = req.headers['cookie'] || '';
  const out = {};
  header.split(';').forEach(part => {
    const [k, ...rest] = part.trim().split('=');
    if (!k) return;
    out[k] = decodeURIComponent(rest.join('='));
  });
  return out;
}

function signToken(payload, secret) {
  const h = crypto.createHmac('sha256', secret);
  h.update(payload);
  return h.digest('hex');
}

function generateCsrfToken(req) {
  const secret = process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || 'change-me';
  const ts = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const userKey = req.user?.user_id ? String(req.user.user_id) : '';
  const payload = `${ts}.${nonce}.${userKey}`;
  const sig = signToken(payload, secret);
  return `${ts}.${nonce}.${sig}`;
}

function verifyCsrfToken(req, token) {
  try {
    const secret = process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || 'change-me';
    const parts = String(token).split('.');
    if (parts.length !== 3) return false;
    const [tsStr, nonce, sig] = parts;
    const ts = parseInt(tsStr, 10);
    if (!ts || Date.now() - ts > TOKEN_TTL_MS) return false;
    const userKey = req.user?.user_id ? String(req.user.user_id) : '';
    const expectedSig = signToken(`${tsStr}.${nonce}.${userKey}`, secret);
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
  } catch (e) {
    return false;
  }
}

function setCsrfCookie(res, token) {
  const isProd = String(process.env.NODE_ENV).toLowerCase() === 'production';
  const attrs = [
    `${TOKEN_COOKIE}=${encodeURIComponent(token)}`,
    `Path=/`,
    `Max-Age=${Math.floor(TOKEN_TTL_MS / 1000)}`,
    `SameSite=Strict`,
  ];
  if (isProd) attrs.push('Secure');
  // HttpOnly is intentionally NOT set for double-submit pattern
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function csrfTokenRoute(req, res) {
  const token = generateCsrfToken(req);
  setCsrfCookie(res, token);
  res.json({ csrfToken: token });
}

function csrfProtect(req, res, next) {
  // Only protect state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const cookies = parseCookies(req);
  const headerToken = req.headers[TOKEN_HEADER];
  const cookieToken = cookies[TOKEN_COOKIE];
  if (!headerToken || !cookieToken) {
    return res.status(403).json({ message: 'CSRF token missing' });
  }
  // Double-submit check and signature verification
  if (headerToken !== cookieToken || !verifyCsrfToken(req, headerToken)) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  next();
}

module.exports = {
  sanitizeRequest,
  csrfTokenRoute,
  csrfProtect,
};