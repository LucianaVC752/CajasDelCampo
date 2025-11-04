const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'security.log');

function ensureLogFile() {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '', { encoding: 'utf8' });
  } catch (e) {
    // Fallback to console only if filesystem not available
  }
}

function writeLog(entry) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n';
  try {
    ensureLogFile();
    fs.appendFile(LOG_FILE, line, () => {});
  } catch (e) {
    // swallow
  }
  console.log('[SECURITY]', line.trim());
}

function logValidation(req, errors) {
  writeLog({
    type: 'validation_error',
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userId: req.user?.user_id || null,
    errors
  });
}

function logAuthEvent(req, event, metadata = {}) {
  writeLog({
    type: 'auth_event',
    event,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userId: req.user?.user_id || null,
    ...metadata
  });
}

function logRateLimit(req, key, info = {}) {
  writeLog({
    type: 'rate_limit',
    key,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    ...info
  });
}

function logCspReport(req, report) {
  writeLog({
    type: 'csp_report',
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userId: req.user?.user_id || null,
    report
  });
}

module.exports = { logValidation, logAuthEvent, logRateLimit, logCspReport };