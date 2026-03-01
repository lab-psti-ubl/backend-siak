import SesiAbsensiTahfiz from '../models/SesiAbsensiTahfiz.js';
import { getISOStringIndonesia } from '../utils/dateUtils.js';

export const getAllSesiAbsensiTahfiz = async (req, res) => {
  try {
    const sesiAbsensiTahfiz = await SesiAbsensiTahfiz.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      sesiAbsensiTahfiz: sesiAbsensiTahfiz.map(s => s.toObject()),
    });
  } catch (error) {
    console.error('Error getting sesi absensi tahfiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data sesi absensi tahfiz',
      error: error.message,
    });
  }
};

export const getSesiAbsensiTahfizById = async (req, res) => {
  try {
    const { id } = req.params;
    const sesiAbsensiTahfiz = await SesiAbsensiTahfiz.findOne({ id });
    if (!sesiAbsensiTahfiz) {
      return res.status(404).json({
        success: false,
        message: 'Sesi absensi tahfiz tidak ditemukan',
      });
    }
    return res.json({
      success: true,
      sesiAbsensiTahfiz: sesiAbsensiTahfiz.toObject(),
    });
  } catch (error) {
    console.error('Error getting sesi absensi tahfiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data sesi absensi tahfiz',
      error: error.message,
    });
  }
};

export const getSesiAbsensiTahfizByTanggal = async (req, res) => {
  try {
    const { tanggal, jadwalId, createdBy } = req.query;
    
    const query = {};
    if (tanggal) query.tanggal = tanggal;
    if (jadwalId) query.jadwalId = jadwalId;
    if (createdBy) query.createdBy = createdBy;
    
    if (!tanggal && !jadwalId && !createdBy) {
      return res.status(400).json({
        success: false,
        message: 'Minimal satu parameter diperlukan (tanggal, jadwalId, atau createdBy)',
      });
    }
    
    const sesiAbsensiTahfiz = await SesiAbsensiTahfiz.find(query).sort({ jamBuka: 1 });
    return res.json({
      success: true,
      sesiAbsensiTahfiz: sesiAbsensiTahfiz.map(s => s.toObject()),
    });
  } catch (error) {
    console.error('Error getting sesi absensi tahfiz by tanggal:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data sesi absensi tahfiz',
      error: error.message,
    });
  }
};

export const createSesiAbsensiTahfiz = async (req, res) => {
  try {
    const {
      id,
      jadwalId,
      tanggal,
      jamBuka,
      jamTutup,
      status,
      createdBy,
      jurnal,
      tahun,
    } = req.body;

    if (!id || !jadwalId || !tanggal || !jamBuka || !status || !createdBy || !tahun) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap',
      });
    }

    const existingSesi = await SesiAbsensiTahfiz.findOne({ id });
    if (existingSesi) {
      return res.status(400).json({
        success: false,
        message: 'Sesi absensi tahfiz dengan ID tersebut sudah ada',
      });
    }

    const newSesi = new SesiAbsensiTahfiz({
      id,
      jadwalId,
      tanggal,
      jamBuka,
      jamTutup,
      status,
      createdBy,
      jurnal,
      tahun,
      createdAt: getISOStringIndonesia(),
      updatedAt: getISOStringIndonesia(),
    });

    await newSesi.save();
    return res.status(201).json({
      success: true,
      message: 'Sesi absensi tahfiz berhasil dibuat',
      sesiAbsensiTahfiz: newSesi.toObject(),
    });
  } catch (error) {
    console.error('Error creating sesi absensi tahfiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat sesi absensi tahfiz',
      error: error.message,
    });
  }
};

export const updateSesiAbsensiTahfiz = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const sesiAbsensiTahfiz = await SesiAbsensiTahfiz.findOne({ id });
    if (!sesiAbsensiTahfiz) {
      return res.status(404).json({
        success: false,
        message: 'Sesi absensi tahfiz tidak ditemukan',
      });
    }

    delete updateData.id; // Prevent ID change
    updateData.updatedAt = getISOStringIndonesia();

    await SesiAbsensiTahfiz.updateOne({ id }, updateData);
    const updatedSesi = await SesiAbsensiTahfiz.findOne({ id });

    return res.json({
      success: true,
      message: 'Sesi absensi tahfiz berhasil diperbarui',
      sesiAbsensiTahfiz: updatedSesi.toObject(),
    });
  } catch (error) {
    console.error('Error updating sesi absensi tahfiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui sesi absensi tahfiz',
      error: error.message,
    });
  }
};

export const deleteSesiAbsensiTahfiz = async (req, res) => {
  try {
    const { id } = req.params;
    const sesiAbsensiTahfiz = await SesiAbsensiTahfiz.findOne({ id });
    if (!sesiAbsensiTahfiz) {
      return res.status(404).json({
        success: false,
        message: 'Sesi absensi tahfiz tidak ditemukan',
      });
    }

    await SesiAbsensiTahfiz.deleteOne({ id });
    return res.json({
      success: true,
      message: 'Sesi absensi tahfiz berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting sesi absensi tahfiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus sesi absensi tahfiz',
      error: error.message,
    });
  }
};

// Add absensi to sesi tahfiz
export const addAbsensiToSesiTahfiz = async (req, res) => {
  try {
    const { sesiId } = req.params;
    const absensiData = req.body;

    if (!absensiData.muridId || !absensiData.status || !absensiData.waktu || !absensiData.method) {
      return res.status(400).json({
        success: false,
        message: 'Data absensi tidak lengkap',
      });
    }

    const sesi = await SesiAbsensiTahfiz.findOne({ id: sesiId });
    if (!sesi) {
      return res.status(404).json({
        success: false,
        message: 'Sesi absensi tahfiz tidak ditemukan',
      });
    }

    // Generate ID if not provided
    const absensiId = absensiData.id || `absensi-tahfiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check if absensi already exists for this murid
    const existingIndex = sesi.dataAbsensi?.findIndex(a => a.muridId === absensiData.muridId);
    
    const newAbsensi = {
      id: absensiId,
      muridId: absensiData.muridId,
      status: absensiData.status,
      waktu: absensiData.waktu,
      keterangan: absensiData.keterangan,
      method: absensiData.method,
      statusAbsen: absensiData.statusAbsen,
      keteranganAbsensi: absensiData.keteranganAbsensi,
      // Add sumberData for server (fallback)
      sumberData: 'server',
      sumberDataUpdatedAt: getISOStringIndonesia(),
    };

    if (existingIndex !== undefined && existingIndex >= 0) {
      // Update existing absensi
      sesi.dataAbsensi[existingIndex] = newAbsensi;
    } else {
      // Add new absensi
      if (!sesi.dataAbsensi) {
        sesi.dataAbsensi = [];
      }
      sesi.dataAbsensi.push(newAbsensi);
    }

    sesi.updatedAt = getISOStringIndonesia();
    await sesi.save();

    return res.json({
      success: true,
      message: 'Absensi berhasil disimpan',
      absensi: newAbsensi,
      sesiAbsensiTahfiz: sesi.toObject(),
    });
  } catch (error) {
    console.error('Error adding absensi to sesi tahfiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan absensi',
      error: error.message,
    });
  }
};

// Remove absensi from sesi tahfiz
export const removeAbsensiFromSesiTahfiz = async (req, res) => {
  try {
    const { sesiId, absensiId } = req.params;

    const sesi = await SesiAbsensiTahfiz.findOne({ id: sesiId });
    if (!sesi) {
      return res.status(404).json({
        success: false,
        message: 'Sesi absensi tahfiz tidak ditemukan',
      });
    }

    if (!sesi.dataAbsensi || sesi.dataAbsensi.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Absensi tidak ditemukan',
      });
    }

    sesi.dataAbsensi = sesi.dataAbsensi.filter(a => a.id !== absensiId);
    sesi.updatedAt = getISOStringIndonesia();
    await sesi.save();

    return res.json({
      success: true,
      message: 'Absensi berhasil dihapus',
      sesiAbsensiTahfiz: sesi.toObject(),
    });
  } catch (error) {
    console.error('Error removing absensi from sesi tahfiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus absensi',
      error: error.message,
    });
  }
};

// Bulk add absensi to sesi tahfiz
export const bulkAddAbsensiToSesiTahfiz = async (req, res) => {
  try {
    const { sesiId } = req.params;
    const { absensiList } = req.body;

    if (!Array.isArray(absensiList) || absensiList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'absensiList harus berupa array yang tidak kosong',
      });
    }

    const sesi = await SesiAbsensiTahfiz.findOne({ id: sesiId });
    if (!sesi) {
      return res.status(404).json({
        success: false,
        message: 'Sesi absensi tahfiz tidak ditemukan',
      });
    }

    if (!sesi.dataAbsensi) {
      sesi.dataAbsensi = [];
    }

    const results = [];
    for (const absensiData of absensiList) {
      if (!absensiData.muridId || !absensiData.status || !absensiData.waktu || !absensiData.method) {
        continue;
      }

      const absensiId = absensiData.id || `absensi-tahfiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const existingIndex = sesi.dataAbsensi.findIndex(a => a.muridId === absensiData.muridId);
      
      const newAbsensi = {
        id: absensiId,
        muridId: absensiData.muridId,
        status: absensiData.status,
        waktu: absensiData.waktu,
        keterangan: absensiData.keterangan,
        method: absensiData.method,
        statusAbsen: absensiData.statusAbsen,
        keteranganAbsensi: absensiData.keteranganAbsensi,
        // Add sumberData for server (fallback)
        sumberData: 'server',
        sumberDataUpdatedAt: getISOStringIndonesia(),
      };

      if (existingIndex >= 0) {
        sesi.dataAbsensi[existingIndex] = newAbsensi;
      } else {
        sesi.dataAbsensi.push(newAbsensi);
      }
      
      results.push(newAbsensi);
    }

    sesi.updatedAt = getISOStringIndonesia();
    await sesi.save();

    return res.json({
      success: true,
      message: `Berhasil memproses ${results.length} dari ${absensiList.length} absensi`,
      absensi: results,
      sesiAbsensiTahfiz: sesi.toObject(),
    });
  } catch (error) {
    console.error('Error bulk adding absensi to sesi tahfiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses absensi',
      error: error.message,
    });
  }
};

