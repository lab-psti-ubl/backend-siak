import SesiAbsensi from '../models/SesiAbsensi.js';
import { getISOStringIndonesia } from '../utils/dateUtils.js';

export const getAllSesiAbsensi = async (req, res) => {
  try {
    const sesiAbsensi = await SesiAbsensi.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      sesiAbsensi: sesiAbsensi.map(s => s.toObject()),
    });
  } catch (error) {
    console.error('Error getting sesi absensi:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data sesi absensi',
      error: error.message,
    });
  }
};

export const getSesiAbsensiById = async (req, res) => {
  try {
    const { id } = req.params;
    const sesiAbsensi = await SesiAbsensi.findOne({ id });
    if (!sesiAbsensi) {
      return res.status(404).json({
        success: false,
        message: 'Sesi absensi tidak ditemukan',
      });
    }
    return res.json({
      success: true,
      sesiAbsensi: sesiAbsensi.toObject(),
    });
  } catch (error) {
    console.error('Error getting sesi absensi:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data sesi absensi',
      error: error.message,
    });
  }
};

export const getSesiAbsensiByTanggal = async (req, res) => {
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
    
    const sesiAbsensi = await SesiAbsensi.find(query).sort({ jamBuka: 1 });
    return res.json({
      success: true,
      sesiAbsensi: sesiAbsensi.map(s => s.toObject()),
    });
  } catch (error) {
    console.error('Error getting sesi absensi by tanggal:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data sesi absensi',
      error: error.message,
    });
  }
};

export const createSesiAbsensi = async (req, res) => {
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
      tahunAjaranId,
      semester,
    } = req.body;

    if (!id || !jadwalId || !tanggal || !jamBuka || !status || !createdBy || !tahunAjaranId || semester === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap',
      });
    }

    const existingSesi = await SesiAbsensi.findOne({ id });
    if (existingSesi) {
      return res.status(400).json({
        success: false,
        message: 'Sesi absensi dengan ID tersebut sudah ada',
      });
    }

    const newSesi = new SesiAbsensi({
      id,
      jadwalId,
      tanggal,
      jamBuka,
      jamTutup,
      status,
      createdBy,
      jurnal,
      tahunAjaranId,
      semester,
      createdAt: getISOStringIndonesia(),
      updatedAt: getISOStringIndonesia(),
    });

    await newSesi.save();
    return res.status(201).json({
      success: true,
      message: 'Sesi absensi berhasil dibuat',
      sesiAbsensi: newSesi.toObject(),
    });
  } catch (error) {
    console.error('Error creating sesi absensi:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat sesi absensi',
      error: error.message,
    });
  }
};

export const updateSesiAbsensi = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const sesiAbsensi = await SesiAbsensi.findOne({ id });
    if (!sesiAbsensi) {
      return res.status(404).json({
        success: false,
        message: 'Sesi absensi tidak ditemukan',
      });
    }

    delete updateData.id; // Prevent ID change
    updateData.updatedAt = getISOStringIndonesia();

    await SesiAbsensi.updateOne({ id }, updateData);
    const updatedSesi = await SesiAbsensi.findOne({ id });

    return res.json({
      success: true,
      message: 'Sesi absensi berhasil diperbarui',
      sesiAbsensi: updatedSesi.toObject(),
    });
  } catch (error) {
    console.error('Error updating sesi absensi:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui sesi absensi',
      error: error.message,
    });
  }
};

export const deleteSesiAbsensi = async (req, res) => {
  try {
    const { id } = req.params;
    const sesiAbsensi = await SesiAbsensi.findOne({ id });
    if (!sesiAbsensi) {
      return res.status(404).json({
        success: false,
        message: 'Sesi absensi tidak ditemukan',
      });
    }

    await SesiAbsensi.deleteOne({ id });
    return res.json({
      success: true,
      message: 'Sesi absensi berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting sesi absensi:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus sesi absensi',
      error: error.message,
    });
  }
};

// Add absensi to sesi
export const addAbsensiToSesi = async (req, res) => {
  try {
    const { sesiId } = req.params;
    const absensiData = req.body;

    if (!absensiData.muridId || !absensiData.status || !absensiData.waktu || !absensiData.method) {
      return res.status(400).json({
        success: false,
        message: 'Data absensi tidak lengkap',
      });
    }

    const sesi = await SesiAbsensi.findOne({ id: sesiId });
    if (!sesi) {
      return res.status(404).json({
        success: false,
        message: 'Sesi absensi tidak ditemukan',
      });
    }

    // Generate ID if not provided
    const absensiId = absensiData.id || `absensi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
      sesiAbsensi: sesi.toObject(),
    });
  } catch (error) {
    console.error('Error adding absensi to sesi:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan absensi',
      error: error.message,
    });
  }
};

// Remove absensi from sesi
export const removeAbsensiFromSesi = async (req, res) => {
  try {
    const { sesiId, absensiId } = req.params;

    const sesi = await SesiAbsensi.findOne({ id: sesiId });
    if (!sesi) {
      return res.status(404).json({
        success: false,
        message: 'Sesi absensi tidak ditemukan',
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
      sesiAbsensi: sesi.toObject(),
    });
  } catch (error) {
    console.error('Error removing absensi from sesi:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus absensi',
      error: error.message,
    });
  }
};

// Bulk add absensi to sesi
export const bulkAddAbsensiToSesi = async (req, res) => {
  try {
    const { sesiId } = req.params;
    const { absensiList } = req.body;

    if (!Array.isArray(absensiList) || absensiList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'absensiList harus berupa array yang tidak kosong',
      });
    }

    const sesi = await SesiAbsensi.findOne({ id: sesiId });
    if (!sesi) {
      return res.status(404).json({
        success: false,
        message: 'Sesi absensi tidak ditemukan',
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

      const absensiId = absensiData.id || `absensi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
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
      sesiAbsensi: sesi.toObject(),
    });
  } catch (error) {
    console.error('Error bulk adding absensi to sesi:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses absensi',
      error: error.message,
    });
  }
};

