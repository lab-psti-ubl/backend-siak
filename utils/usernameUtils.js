import Guru from '../models/Guru.js';

/**
 * Generate username from full name: lowercase, no spaces.
 * Example: "Ari Mardiansyah" -> "arimardiansyah"
 */
export function generateUsernameFromName(name) {
  if (!name || typeof name !== 'string') return '';
  return name.trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * Get a unique username for Guru. If base username exists, append number (arimardiansyah2, arimardiansyah3, ...).
 * @param {string} name - Full name of guru
 * @param {string|null} excludeId - Guru id to exclude (for updates)
 * @returns {Promise<string>}
 */
export async function getUniqueUsernameForGuru(name, excludeId = null) {
  let base = generateUsernameFromName(name);
  if (!base) base = 'guru';
  let username = base;
  let n = 1;
  for (;;) {
    const filter = excludeId
      ? { username, id: { $ne: excludeId } }
      : { username };
    const existing = await Guru.findOne(filter);
    if (!existing) return username;
    username = base + String(++n);
  }
}
