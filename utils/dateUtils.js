/**
 * Utility functions for handling Indonesia timezone (Asia/Jakarta, UTC+7)
 * Menggunakan Luxon untuk penanganan timezone yang konsisten.
 *
 * PENTING: Jangan gunakan new Date().toISOString() untuk timestamp yang ditampilkan!
 * toISOString() selalu mengembalikan UTC (Z). Gunakan getISOStringIndonesia() untuk
 * timestamp yang menunjukkan waktu Indonesia.
 */

import { DateTime } from 'luxon';

const TIMEZONE_INDONESIA = 'Asia/Jakarta';

/**
 * Get today's date in Indonesia timezone (WIB/UTC+7)
 * @returns {string} Tanggal hari ini dalam format YYYY-MM-DD sesuai waktu Indonesia
 */
function getTodayIndonesia() {
  return DateTime.now().setZone(TIMEZONE_INDONESIA).toISODate();
}

/**
 * Get current time in Indonesia timezone (HH:MM format)
 * @returns {string} Waktu saat ini dalam format HH:MM sesuai waktu Indonesia
 */
function getCurrentTimeIndonesia() {
  return DateTime.now().setZone(TIMEZONE_INDONESIA).toFormat('HH:mm');
}

/**
 * Get current datetime as ISO string in Indonesia timezone (dengan offset +07:00)
 * Untuk timestamp seperti sumberDataUpdatedAt, createdAt, updatedAt
 * @returns {string} ISO string format "2026-02-10T07:47:38.354+07:00"
 */
function getISOStringIndonesia() {
  return DateTime.now().setZone(TIMEZONE_INDONESIA).toISO();
}

export { getTodayIndonesia, getCurrentTimeIndonesia, getISOStringIndonesia };
