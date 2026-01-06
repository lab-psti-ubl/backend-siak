import PengaturanKomponenNilai from '../models/PengaturanKomponenNilai.js';
import PengaturanGrade from '../models/PengaturanGrade.js';
import Absensi from '../models/Absensi.js';
import SesiAbsensi from '../models/SesiAbsensi.js';
import JadwalPelajaran from '../models/JadwalPelajaran.js';
import Nilai from '../models/Nilai.js';

// Default komponen nilai jika tidak ada di database
const DEFAULT_KOMPONEN_NILAI = {
  kehadiran: 20,
  tugas: 30,
  uts: 25,
  uas: 25
};

// Default semua komponen
const DEFAULT_SEMUA_KOMPONEN = [
  { id: '1', nama: 'UTS', persentase: 25, isDefault: true, hasNilai: false },
  { id: '2', nama: 'UAS', persentase: 25, isDefault: true, hasNilai: false },
  { id: '3', nama: 'Tugas', persentase: 30, isDefault: true, hasNilai: true },
  { id: '4', nama: 'Kehadiran', persentase: 20, isDefault: true, hasNilai: false },
];

/**
 * Get komponen nilai dari database atau default
 */
export const getKomponenNilai = async () => {
  try {
    const semuaKomponen = await PengaturanKomponenNilai.find({}).sort({ createdAt: 1 });
    if (semuaKomponen.length > 0) {
      return {
        kehadiran: semuaKomponen.find(k => k.nama === 'Kehadiran')?.persentase ?? DEFAULT_KOMPONEN_NILAI.kehadiran,
        tugas: semuaKomponen.find(k => k.nama === 'Tugas')?.persentase ?? DEFAULT_KOMPONEN_NILAI.tugas,
        uts: semuaKomponen.find(k => k.nama === 'UTS')?.persentase ?? DEFAULT_KOMPONEN_NILAI.uts,
        uas: semuaKomponen.find(k => k.nama === 'UAS')?.persentase ?? DEFAULT_KOMPONEN_NILAI.uas,
      };
    }
  } catch (error) {
    console.error('Error getting komponen nilai:', error);
  }
  return DEFAULT_KOMPONEN_NILAI;
};

/**
 * Get semua komponen nilai dari database atau default
 */
export const getSemuaKomponenNilai = async () => {
  try {
    const semuaKomponen = await PengaturanKomponenNilai.find({}).sort({ createdAt: 1 });
    if (semuaKomponen.length > 0) {
      return semuaKomponen.map(k => ({
        id: k.id,
        nama: k.nama,
        persentase: k.persentase,
        isDefault: k.isDefault,
        hasNilai: k.hasNilai,
      }));
    }
  } catch (error) {
    console.error('Error getting semua komponen nilai:', error);
  }
  return DEFAULT_SEMUA_KOMPONEN;
};

/**
 * Get maximum tugas count and unique tugas names from all murid in the same class
 */
export const getMaxTugasInfo = async (mataPelajaranId, kelasId, semester, tahunAjaran) => {
  try {
    const nilaiDoc = await Nilai.findOne({
      mataPelajaranId,
      kelasId,
      semester,
      tahunAjaran,
    });

    if (!nilaiDoc || !nilaiDoc.dataNilai || nilaiDoc.dataNilai.length === 0) {
      return { maxCount: 0, uniqueTugasNames: [] };
    }

    // Collect all unique tugas names from all murid
    const uniqueTugasNames = new Set();
    let maxCount = 0;

    nilaiDoc.dataNilai.forEach(muridNilai => {
      if (muridNilai.tugas && muridNilai.tugas.length > 0) {
        muridNilai.tugas.forEach(tugas => {
          if (tugas.nama) {
            uniqueTugasNames.add(tugas.nama);
          }
        });
        if (muridNilai.tugas.length > maxCount) {
          maxCount = muridNilai.tugas.length;
        }
      }
    });

    return {
      maxCount,
      uniqueTugasNames: Array.from(uniqueTugasNames).sort()
    };
  } catch (error) {
    console.error('Error getting max tugas info:', error);
    return { maxCount: 0, uniqueTugasNames: [] };
  }
};

/**
 * Get maximum count per komponen dinamis from all murid in the same class
 * Returns object with komponenNama as key and maxCount as value
 */
export const getMaxKomponenDinamisInfo = async (mataPelajaranId, kelasId, semester, tahunAjaran) => {
  try {
    const nilaiDoc = await Nilai.findOne({
      mataPelajaranId,
      kelasId,
      semester,
      tahunAjaran,
    });

    if (!nilaiDoc || !nilaiDoc.dataNilai || nilaiDoc.dataNilai.length === 0) {
      return {};
    }

    // Count max values per komponenNama
    const maxCountPerKomponen = {};

    nilaiDoc.dataNilai.forEach(muridNilai => {
      if (muridNilai.komponenDinamis && muridNilai.komponenDinamis.length > 0) {
        // Group by komponenNama
        const groupedByNama = {};
        muridNilai.komponenDinamis.forEach(kd => {
          if (kd.komponenNama) {
            if (!groupedByNama[kd.komponenNama]) {
              groupedByNama[kd.komponenNama] = [];
            }
            groupedByNama[kd.komponenNama].push(kd);
          }
        });

        // Update max count per komponen
        Object.keys(groupedByNama).forEach(komponenNama => {
          const count = groupedByNama[komponenNama].length;
          if (!maxCountPerKomponen[komponenNama] || count > maxCountPerKomponen[komponenNama]) {
            maxCountPerKomponen[komponenNama] = count;
          }
        });
      }
    });

    return maxCountPerKomponen;
  } catch (error) {
    console.error('Error getting max komponen dinamis info:', error);
    return {};
  }
};

/**
 * Calculate rata-rata tugas based on maximum tugas count in class
 * If murid doesn't have a tugas that exists in class, count it as 0
 */
export const calculateRataTugas = (tugas, maxTugasCount = null, uniqueTugasNames = null) => {
  if (!tugas || tugas.length === 0) {
    // If no tugas and we have max count, return 0 (all missing tugas = 0)
    return maxTugasCount && maxTugasCount > 0 ? 0 : 0;
  }

  // If we have unique tugas names, calculate based on those
  if (uniqueTugasNames && uniqueTugasNames.length > 0) {
    let total = 0;
    let count = 0;

    uniqueTugasNames.forEach(tugasName => {
      const tugasItem = tugas.find(t => t.nama === tugasName);
      if (tugasItem) {
        total += tugasItem.nilai || 0;
      }
      // Count all unique tugas names (including missing ones as 0)
      count++;
    });

    return count > 0 ? total / count : 0;
  }

  // Fallback: if we have max count, use it
  if (maxTugasCount && maxTugasCount > 0) {
    const total = tugas.reduce((sum, t) => sum + (t.nilai || 0), 0);
    return total / maxTugasCount;
  }

  // Original logic: calculate based on actual tugas count
  const total = tugas.reduce((sum, t) => sum + (t.nilai || 0), 0);
  return total / tugas.length;
};

/**
 * Calculate rata-rata komponen dinamis based on maximum count in class
 * If murid doesn't have values that exist in class, count missing ones as 0
 */
export const calculateRataKomponen = (komponen, maxCount = null) => {
  if (!komponen || komponen.length === 0) {
    // If no komponen and we have max count, return 0 (all missing komponen = 0)
    return maxCount && maxCount > 0 ? 0 : 0;
  }

  // If we have max count, calculate based on that
  if (maxCount && maxCount > 0) {
    const total = komponen.reduce((sum, k) => sum + (k.nilai || 0), 0);
    return total / maxCount;
  }

  // Original logic: calculate based on actual komponen count
  const total = komponen.reduce((sum, k) => sum + (k.nilai || 0), 0);
  return total / komponen.length;
};

/**
 * Calculate nilai kehadiran dari absensi
 */
export const calculateKehadiran = async (
  muridId,
  mataPelajaranId,
  kelasId,
  guruId,
  semester,
  tahunAjaran
) => {
  try {
    // Get all schedules for this teacher, subject, and class in the current semester
    const relevantSchedules = await JadwalPelajaran.find({
      guruId,
      mataPelajaranId,
      kelasId,
      semester,
      tahunAjaran,
    });

    if (relevantSchedules.length === 0) return 100;

    // Get all sessions for these schedules
    const scheduleIds = relevantSchedules.map(s => s.id);
    const subjectSessions = await SesiAbsensi.find({
      jadwalId: { $in: scheduleIds }
    });

    if (subjectSessions.length === 0) return 100; // No sessions opened yet = 100%

    // Count attendance from dataAbsensi inside each session
    let hadirCount = 0;
    let totalSessions = subjectSessions.length;

    for (const session of subjectSessions) {
      // Check if session has dataAbsensi (new structure from database)
      if (session.dataAbsensi && Array.isArray(session.dataAbsensi)) {
        const studentRecord = session.dataAbsensi.find(a => a.muridId === muridId);
        if (studentRecord && studentRecord.status === 'hadir') {
          hadirCount++;
        }
      } else {
        // Fallback to old structure using separate absensi array with sesiId
        const studentAttendance = await Absensi.findOne({
          muridId,
          sesiId: session.id
        });
        if (studentAttendance && studentAttendance.status === 'hadir') {
          hadirCount++;
        }
      }
    }

    return totalSessions > 0 ? (hadirCount / totalSessions) * 100 : 100;
  } catch (error) {
    console.error('Error calculating kehadiran:', error);
    return 100; // Default to 100% on error
  }
};

/**
 * Calculate nilai akhir
 */
export const calculateNilaiAkhir = async (
  nilaiKehadiran,
  rataTugas,
  nilaiUTS,
  nilaiUAS,
  komponenDinamis,
  maxKomponenDinamisInfo = null
) => {
  const komponen = await getKomponenNilai();
  const semuaKomponen = await getSemuaKomponenNilai();
  const activeKomponenNames = semuaKomponen.map(k => k.nama);

  const skorKehadiran = (nilaiKehadiran / 100) * komponen.kehadiran;
  const skorTugas = (rataTugas / 100) * komponen.tugas;
  const skorUTS = nilaiUTS ? (nilaiUTS / 100) * komponen.uts : 0;
  const skorUAS = nilaiUAS ? (nilaiUAS / 100) * komponen.uas : 0;

  let skorKomponenDinamis = 0;
  if (komponenDinamis && komponenDinamis.length > 0) {
    const gruppedByNama = {};
    komponenDinamis.forEach(kd => {
      if (activeKomponenNames.includes(kd.komponenNama)) {
        if (!gruppedByNama[kd.komponenNama]) {
          gruppedByNama[kd.komponenNama] = [];
        }
        gruppedByNama[kd.komponenNama].push(kd);
      }
    });

    for (const [nama, values] of Object.entries(gruppedByNama)) {
      const kompConfig = semuaKomponen.find(k => k.nama === nama);
      if (kompConfig) {
        // Get max count for this komponen if available
        const maxCount = maxKomponenDinamisInfo && maxKomponenDinamisInfo[nama] 
          ? maxKomponenDinamisInfo[nama] 
          : null;
        const rataKomponen = calculateRataKomponen(values, maxCount);
        skorKomponenDinamis += (rataKomponen / 100) * kompConfig.persentase;
      }
    }
  }

  return skorKehadiran + skorTugas + skorUTS + skorUAS + skorKomponenDinamis;
};

/**
 * Get grade from nilai akhir
 */
export const getGrade = async (nilaiAkhir) => {
  try {
    const grades = await PengaturanGrade.find({}).sort({ minNilai: -1 });
    if (grades.length > 0) {
      const matchedGrade = grades.find(g => nilaiAkhir >= g.minNilai && nilaiAkhir <= g.maxNilai);
      return matchedGrade ? matchedGrade.grade : 'E';
    }
  } catch (error) {
    console.error('Error getting grade:', error);
  }
  // Default grade mapping if no grades in database
  if (nilaiAkhir >= 90) return 'A';
  if (nilaiAkhir >= 80) return 'B';
  if (nilaiAkhir >= 70) return 'C';
  if (nilaiAkhir >= 60) return 'D';
  return 'E';
};

/**
 * Calculate and update nilai akhir and grade for a murid nilai
 */
export const calculateAndUpdateNilaiAkhir = async (muridNilaiData, mataPelajaranId, kelasId, guruId, semester, tahunAjaran) => {
  try {
    // Calculate kehadiran
    const nilaiKehadiran = await calculateKehadiran(
      muridNilaiData.muridId,
      mataPelajaranId,
      kelasId,
      guruId,
      semester,
      tahunAjaran
    );

    // Get max tugas info from all murid in the same class
    const { maxCount, uniqueTugasNames } = await getMaxTugasInfo(
      mataPelajaranId,
      kelasId,
      semester,
      tahunAjaran
    );

    // Calculate rata-rata tugas based on max tugas count in class
    const rataTugas = calculateRataTugas(
      muridNilaiData.tugas || [],
      maxCount,
      uniqueTugasNames
    );

    // Get max komponen dinamis info from all murid in the same class
    const maxKomponenDinamisInfo = await getMaxKomponenDinamisInfo(
      mataPelajaranId,
      kelasId,
      semester,
      tahunAjaran
    );

    // Calculate nilai akhir
    const nilaiAkhir = await calculateNilaiAkhir(
      nilaiKehadiran,
      rataTugas,
      muridNilaiData.uts || null,
      muridNilaiData.uas || null,
      muridNilaiData.komponenDinamis || [],
      maxKomponenDinamisInfo
    );

    // Get grade
    const grade = await getGrade(nilaiAkhir);

    return {
      ...muridNilaiData,
      nilaiAkhir,
      grade,
    };
  } catch (error) {
    console.error('Error calculating nilai akhir:', error);
    // Return original data if calculation fails
    return muridNilaiData;
  }
};

/**
 * Recalculate nilai akhir for all murid in the same class
 * This is needed when tugas or komponen dinamis is updated, as max count may change
 */
export const recalculateAllMuridNilaiAkhir = async (mataPelajaranId, kelasId, semester, tahunAjaran) => {
  try {
    const nilaiDoc = await Nilai.findOne({
      mataPelajaranId,
      kelasId,
      semester,
      tahunAjaran,
    });

    if (!nilaiDoc || !nilaiDoc.dataNilai || nilaiDoc.dataNilai.length === 0) {
      return;
    }

    // Get max tugas info once for all murid
    const { maxCount, uniqueTugasNames } = await getMaxTugasInfo(
      mataPelajaranId,
      kelasId,
      semester,
      tahunAjaran
    );

    // Get max komponen dinamis info once for all murid
    const maxKomponenDinamisInfo = await getMaxKomponenDinamisInfo(
      mataPelajaranId,
      kelasId,
      semester,
      tahunAjaran
    );

    // Recalculate for each murid
    for (let i = 0; i < nilaiDoc.dataNilai.length; i++) {
      const muridNilai = nilaiDoc.dataNilai[i];
      
      // Calculate kehadiran
      const nilaiKehadiran = await calculateKehadiran(
        muridNilai.muridId,
        mataPelajaranId,
        kelasId,
        nilaiDoc.guruId,
        semester,
        tahunAjaran
      );

      // Calculate rata-rata tugas based on max tugas count
      const rataTugas = calculateRataTugas(
        muridNilai.tugas || [],
        maxCount,
        uniqueTugasNames
      );

      // Calculate nilai akhir with max komponen dinamis info
      const nilaiAkhir = await calculateNilaiAkhir(
        nilaiKehadiran,
        rataTugas,
        muridNilai.uts || null,
        muridNilai.uas || null,
        muridNilai.komponenDinamis || [],
        maxKomponenDinamisInfo
      );

      // Get grade
      const grade = await getGrade(nilaiAkhir);

      // Update nilai akhir and grade
      nilaiDoc.dataNilai[i].nilaiAkhir = nilaiAkhir;
      nilaiDoc.dataNilai[i].grade = grade;
      nilaiDoc.dataNilai[i].updatedAt = new Date().toISOString();
    }

    nilaiDoc.updatedAt = new Date().toISOString();
    await nilaiDoc.save();
  } catch (error) {
    console.error('Error recalculating all murid nilai akhir:', error);
  }
};


