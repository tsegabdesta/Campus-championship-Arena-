/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CAMPUS ARENA - SECURITY UTILITIES
 * Hardened sanitization, escaping, and validation routines for Phase 1
 */

/**
 * Escapes HTML control characters to prevent Stored and DOM XSS injection.
 */
export function escapeHTML(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Normalizes and validates room codes strictly to alphanumeric characters and hyphens.
 */
export function sanitizeRoomCode(code: unknown): string {
  if (!code || typeof code !== 'string') return '';
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\-]/g, '')
    .slice(0, 16);
}

/**
 * Ensures URLs only utilize safe web schemes (HTTPS / HTTP / safe relative paths).
 * Strictly guards against javascript:, data:, and vbscript: vectors.
 */
export function sanitizeUrl(url: unknown): string {
  const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/bottts/svg?seed=Abebe';
  if (!url || typeof url !== 'string') {
    return DEFAULT_AVATAR;
  }
  const clean = url.trim();
  try {
    // Relative safe paths
    if (clean.startsWith('/') || clean.startsWith('./')) {
      return clean;
    }
    const parsed = new URL(clean);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
  } catch {
    // Invalid URL format
    return DEFAULT_AVATAR;
  }
  return DEFAULT_AVATAR;
}

/**
 * Sanitizes generic user text input with length enforcement
 */
export function sanitizeText(val: unknown, maxLength = 60): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLength);
}

/**
 * Safe integer parser with fallback
 */
export function sanitizeInteger(val: unknown, fallback = 0, min?: number, max?: number): number {
  const num = typeof val === 'number' ? Math.floor(val) : parseInt(String(val), 10);
  if (isNaN(num)) return fallback;
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  return num;
}
