/**
 * Content-Type detection based on file extension
 */

export const MIME_TYPES = {
  // HTML
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',

  // CSS
  '.css': 'text/css; charset=utf-8',

  // JavaScript
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',

  // JSON
  '.json': 'application/json; charset=utf-8',

  // Images
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',

  // Fonts
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',

  // Text
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',

  // Video
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',

  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

/**
 * Get MIME type from file path
 * @param {string} filePath - File path or name
 * @returns {string} MIME type or 'application/octet-stream' as fallback
 */
export function getContentType(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return 'application/octet-stream';
  }

  const idx = filePath.lastIndexOf('.');
  const ext = idx >= 0 ? filePath.toLowerCase().substring(idx) : '';
  return MIME_TYPES[ext] || 'application/octet-stream';
}
