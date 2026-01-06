import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export const hashPassword = async (password) => {
  if (!password) {
    throw new Error('Password is required');
  }
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} - True if password matches
 */
export const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) {
    return false;
  }
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Check if a string is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
 * @param {string} password - Password string to check
 * @returns {boolean} - True if password appears to be hashed
 */
export const isPasswordHashed = (password) => {
  if (!password || typeof password !== 'string') {
    return false;
  }
  return password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$');
};

