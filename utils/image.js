const path = require('path');

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

// Detect MIME type from image buffer (PNG, JPEG, GIF, WEBP)
function detectImageMimeType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  // PNG
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  // GIF
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'image/gif';
  }
  // WEBP (RIFF....WEBP)
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

function buildImageFromFile(file) {
  const relativePath = path.join('/uploads', file.filename).replace(/\\/g, '/');
  return { image_url: relativePath, image_data: null };
}

function buildImageFromBase64(base64String) {
  const commaIndex = base64String.indexOf(',');
  const rawBase64 = commaIndex !== -1 ? base64String.slice(commaIndex + 1) : base64String;
  try {
    const buffer = Buffer.from(rawBase64, 'base64');
    if (buffer.length > MAX_IMAGE_SIZE) {
      return { error: 'Base64 image too large (max 2MB)' };
    }
    return { image_data: buffer };
  } catch (e) {
    return { error: 'Invalid Base64 image data' };
  }
}

module.exports = {
  detectImageMimeType,
  buildImageFromFile,
  buildImageFromBase64,
  MAX_IMAGE_SIZE,
};