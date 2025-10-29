const CryptoJS = require('crypto-js');

const key = process.env.ENCRYPTION_KEY;

function ensureKey() {
  if (!key || key.length < 16) {
    throw new Error('Missing or weak ENCRYPTION_KEY env var');
  }
}

function encrypt(value) {
  if (value === null || value === undefined) return value;
  ensureKey();
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  const ciphertext = CryptoJS.AES.encrypt(str, key).toString();
  return ciphertext;
}

function decrypt(ciphertext) {
  if (ciphertext === null || ciphertext === undefined) return ciphertext;
  ensureKey();
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decoded = bytes.toString(CryptoJS.enc.Utf8);
    // Try JSON parse, fallback to string
    try {
      return JSON.parse(decoded);
    } catch {
      return decoded;
    }
  } catch (e) {
    return null;
  }
}

module.exports = { encrypt, decrypt };