import Guru from '../models/Guru.js';
import TahunAjaran from '../models/TahunAjaran.js';

/**
 * Get active tahun ajaran
 * @returns {Promise<{tahun: string, semester: number} | null>}
 */
export const getActiveTahunAjaran = async () => {
  try {
    const activeTahunAjaran = await TahunAjaran.findOne({ isActive: true });
    if (!activeTahunAjaran) {
      return null;
    }
    return {
      tahun: activeTahunAjaran.tahun,
      semester: activeTahunAjaran.semester,
    };
  } catch (error) {
    console.error('Error getting active tahun ajaran:', error);
    return null;
  }
};

/**
 * Ensure riwayat kelas wali exists in database
 * Adds entry if it doesn't exist for the current tahun ajaran and semester
 * @param {string} guruId - ID of the guru
 * @param {string} kelasId - ID of the kelas
 * @returns {Promise<boolean>} - Returns true if entry was added or already exists
 */
export const ensureRiwayatKelasWali = async (guruId, kelasId) => {
  try {
    // Get active tahun ajaran
    const activeTahunAjaran = await getActiveTahunAjaran();
    if (!activeTahunAjaran) {
      console.warn('No active tahun ajaran found, skipping riwayatKelasWali update');
      return false;
    }

    // Get guru
    const guru = await Guru.findOne({ id: guruId });
    if (!guru) {
      console.warn(`Guru with id ${guruId} not found`);
      return false;
    }

    // Check if guru is wali kelas for this kelas
    if (!guru.isWaliKelas || guru.kelasWali !== kelasId) {
      return false;
    }

    // Get current riwayat
    const riwayat = guru.riwayatKelasWali || [];

    // Check if entry already exists
    const exists = riwayat.some(
      r => r.kelasId === kelasId &&
           r.tahunAjaran === activeTahunAjaran.tahun &&
           r.semester === activeTahunAjaran.semester
    );

    // If entry doesn't exist, add it
    if (!exists) {
      const newRiwayat = [
        ...riwayat,
        {
          kelasId: kelasId,
          tahunAjaran: activeTahunAjaran.tahun,
          semester: activeTahunAjaran.semester,
        }
      ];

      await Guru.updateOne(
        { id: guruId },
        { riwayatKelasWali: newRiwayat }
      );

      console.log(`Added riwayatKelasWali for guru ${guruId}, kelas ${kelasId}, tahun ${activeTahunAjaran.tahun}, semester ${activeTahunAjaran.semester}`);
      return true;
    }

    return true;
  } catch (error) {
    console.error('Error ensuring riwayat kelas wali:', error);
    return false;
  }
};
