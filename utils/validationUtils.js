import User from '../models/User.js';
import Guru from '../models/Guru.js';
import Murid from '../models/Murid.js';

/**
 * Check if email is unique across all collections (User, Guru, Murid)
 * @param {string} email - Email to check
 * @param {string} excludeId - Optional ID to exclude from check (for update operations)
 * @returns {Promise<boolean>} - Returns true if email is unique, false if exists
 */
export const isEmailUnique = async (email, excludeId = null) => {
  try {
    const checks = [];
    
    if (excludeId) {
      checks.push(User.findOne({ email, id: { $ne: excludeId } }));
      checks.push(Guru.findOne({ email, id: { $ne: excludeId } }));
      checks.push(Murid.findOne({ email, id: { $ne: excludeId } }));
    } else {
      checks.push(User.findOne({ email }));
      checks.push(Guru.findOne({ email }));
      checks.push(Murid.findOne({ email }));
    }
    
    const results = await Promise.all(checks);
    // If any result is found, email is not unique
    return results.every(r => !r);
  } catch (error) {
    console.error('Error checking email uniqueness:', error);
    return false;
  }
};

/**
 * Check if RFID GUID is unique across all collections (User, Guru, Murid)
 * @param {string} rfidGuid - RFID GUID to check
 * @param {string} excludeId - Optional ID to exclude from check (for update operations)
 * @returns {Promise<boolean>} - Returns true if RFID GUID is unique or empty, false if exists
 */
export const isRfidGuidUnique = async (rfidGuid, excludeId = null) => {
  try {
    // If rfidGuid is empty/null/undefined, it's considered unique
    if (!rfidGuid) {
      return true;
    }
    
    const checks = [];
    
    if (excludeId) {
      checks.push(User.findOne({ rfidGuid, id: { $ne: excludeId } }));
      checks.push(Guru.findOne({ rfidGuid, id: { $ne: excludeId } }));
      checks.push(Murid.findOne({ rfidGuid, id: { $ne: excludeId } }));
    } else {
      checks.push(User.findOne({ rfidGuid }));
      checks.push(Guru.findOne({ rfidGuid }));
      checks.push(Murid.findOne({ rfidGuid }));
    }
    
    const results = await Promise.all(checks);
    // If any result is found, RFID GUID is not unique
    return results.every(r => !r);
  } catch (error) {
    console.error('Error checking RFID GUID uniqueness:', error);
    return false;
  }
};

/**
 * Find user by email across all collections (User, Guru, Murid)
 * Returns the user object with collection type
 * @param {string} email - Email to search
 * @returns {Promise<{user: object, collection: 'user'|'guru'|'murid'|null}>}
 */
export const findUserByEmail = async (email) => {
  try {
    // Check in User collection
    let user = await User.findOne({ email });
    if (user) {
      return { user: user.toObject(), collection: 'user' };
    }
    
    // Check in Guru collection
    let guru = await Guru.findOne({ email });
    if (guru) {
      return { user: guru.toObject(), collection: 'guru' };
    }
    
    // Check in Murid collection
    let murid = await Murid.findOne({ email });
    if (murid) {
      return { user: murid.toObject(), collection: 'murid' };
    }
    
    return { user: null, collection: null };
  } catch (error) {
    console.error('Error finding user by email:', error);
    return { user: null, collection: null };
  }
};

