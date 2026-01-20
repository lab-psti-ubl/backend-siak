import ProgressHafalan from '../models/ProgressHafalan.js';

// Get all progress hafalan for a santri
export const getProgressHafalanBySantri = async (req, res) => {
  try {
    const { santriId } = req.params;
    const { tahun } = req.query;

    let query = { santriId };
    if (tahun) {
      query.tahun = tahun;
    }

    const progressList = await ProgressHafalan.find(query).sort({ tanggal: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: progressList,
    });
  } catch (error) {
    console.error('Error getting progress hafalan:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data progress hafalan',
      error: error.message,
    });
  }
};

// Get all progress hafalan (for admin or ustadz)
export const getAllProgressHafalan = async (req, res) => {
  try {
    const { tahun, santriId } = req.query;

    let query = {};
    if (tahun) {
      query.tahun = tahun;
    }
    if (santriId) {
      query.santriId = santriId;
    }

    const progressList = await ProgressHafalan.find(query).sort({ tanggal: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: progressList,
    });
  } catch (error) {
    console.error('Error getting all progress hafalan:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data progress hafalan',
      error: error.message,
    });
  }
};

// Add new progress hafalan
export const addProgressHafalan = async (req, res) => {
  try {
    const { santriId, juz, surat, ayatDari, ayatSampai, tanggal, keterangan } = req.body;
    const createdBy = req.user?.id; // From auth middleware

    if (!santriId || !juz || !surat || !ayatDari || !ayatSampai || !tanggal) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap. Santri, juz, surat, ayat, dan tanggal wajib diisi',
      });
    }

    if (juz < 1 || juz > 30) {
      return res.status(400).json({
        success: false,
        message: 'Juz harus antara 1 sampai 30',
      });
    }

    if (ayatDari > ayatSampai) {
      return res.status(400).json({
        success: false,
        message: 'Ayat dari tidak boleh lebih besar dari ayat sampai',
      });
    }

    // Get year from tanggal
    const tahun = tanggal.split('-')[0];

    const newProgressId = `progress-hafalan-${Date.now()}`;
    const newProgress = new ProgressHafalan({
      id: newProgressId,
      santriId,
      juz: parseInt(juz),
      surat,
      ayatDari: parseInt(ayatDari),
      ayatSampai: parseInt(ayatSampai),
      tanggal,
      keterangan: keterangan || '',
      createdBy,
      tahun,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await newProgress.save();

    return res.status(201).json({
      success: true,
      message: 'Progress hafalan berhasil ditambahkan',
      data: newProgress,
    });
  } catch (error) {
    console.error('Error adding progress hafalan:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan progress hafalan',
      error: error.message,
    });
  }
};

// Update progress hafalan
export const updateProgressHafalan = async (req, res) => {
  try {
    const { id } = req.params;
    const { juz, surat, ayatDari, ayatSampai, tanggal, keterangan } = req.body;

    const progress = await ProgressHafalan.findOne({ id });
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress hafalan tidak ditemukan',
      });
    }

    if (ayatDari > ayatSampai) {
      return res.status(400).json({
        success: false,
        message: 'Ayat dari tidak boleh lebih besar dari ayat sampai',
      });
    }

    if (juz !== undefined) {
      if (juz < 1 || juz > 30) {
        return res.status(400).json({
          success: false,
          message: 'Juz harus antara 1 sampai 30',
        });
      }
      progress.juz = parseInt(juz);
    }

    // Update fields
    if (surat) progress.surat = surat;
    if (ayatDari !== undefined) progress.ayatDari = parseInt(ayatDari);
    if (ayatSampai !== undefined) progress.ayatSampai = parseInt(ayatSampai);
    if (tanggal) {
      progress.tanggal = tanggal;
      progress.tahun = tanggal.split('-')[0];
    }
    if (keterangan !== undefined) progress.keterangan = keterangan;
    progress.updatedAt = new Date().toISOString();

    await progress.save();

    return res.status(200).json({
      success: true,
      message: 'Progress hafalan berhasil diperbarui',
      data: progress,
    });
  } catch (error) {
    console.error('Error updating progress hafalan:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui progress hafalan',
      error: error.message,
    });
  }
};

// Save hasil tes hafalan
export const saveHasilTes = async (req, res) => {
  try {
    const { id } = req.params;
    const { hasilTes, lafadzKesalahan, catatanPerbaikan, poinPerbaikan, tanggalTes } = req.body;
    const tesOleh = req.user?.id; // From auth middleware

    if (!hasilTes || !['Mumtaz', 'Jayid Jiddan', 'Jayid', 'Maqbul'].includes(hasilTes)) {
      return res.status(400).json({
        success: false,
        message: 'Hasil tes harus diisi dan valid (Mumtaz, Jayid Jiddan, Jayid, atau Maqbul)',
      });
    }

    const progress = await ProgressHafalan.findOne({ id });
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress hafalan tidak ditemukan',
      });
    }

    // Get today's date if not provided
    const tesDate = tanggalTes || new Date().toISOString().split('T')[0];

    // Save current test result to history if exists
    if (progress.hasilTes) {
      if (!progress.riwayatTes) {
        progress.riwayatTes = [];
      }
      progress.riwayatTes.push({
        hasilTes: progress.hasilTes,
        tanggalTes: progress.tanggalTes || tesDate,
        tesOleh: progress.tesOleh || tesOleh,
        lafadzKesalahan: progress.lafadzKesalahan || [],
        catatanPerbaikan: progress.catatanPerbaikan || '',
        createdAt: progress.updatedAt || new Date().toISOString(),
      });
    }

    // Update current test result
    progress.hasilTes = hasilTes;
    progress.tanggalTes = tesDate;
    progress.tesOleh = tesOleh;
    progress.lafadzKesalahan = lafadzKesalahan || [];
    
    // Set status perbaikan based on hasil
    if (hasilTes === 'Jayid' || hasilTes === 'Maqbul') {
      progress.statusPerbaikan = 'pending';
      progress.catatanPerbaikan = catatanPerbaikan || '';
      progress.poinPerbaikan = poinPerbaikan || {};
    } else {
      progress.statusPerbaikan = 'completed';
      progress.catatanPerbaikan = '';
      progress.poinPerbaikan = undefined;
    }

    progress.updatedAt = new Date().toISOString();

    await progress.save();

    return res.status(200).json({
      success: true,
      message: 'Hasil tes hafalan berhasil disimpan',
      data: progress,
    });
  } catch (error) {
    console.error('Error saving hasil tes:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan hasil tes hafalan',
      error: error.message,
    });
  }
};

// Delete progress hafalan
export const deleteProgressHafalan = async (req, res) => {
  try {
    const { id } = req.params;

    const progress = await ProgressHafalan.findOne({ id });
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress hafalan tidak ditemukan',
      });
    }

    await ProgressHafalan.deleteOne({ id });

    return res.status(200).json({
      success: true,
      message: 'Progress hafalan berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting progress hafalan:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus progress hafalan',
      error: error.message,
    });
  }
};
