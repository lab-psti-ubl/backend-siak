import RiwayatKelasMurid from '../models/RiwayatKelasMurid.js';

// Get all riwayat kelas murid
export const getAllRiwayatKelasMurid = async (req, res) => {
  try {
    const { muridId, kelasId, tahunAjaran, semester, status } = req.query;
    
    const query = {};
    
    if (muridId) query.muridId = muridId;
    if (kelasId) query.kelasId = kelasId;
    if (tahunAjaran) query.tahunAjaran = tahunAjaran;
    if (semester !== undefined) query.semester = parseInt(semester);
    if (status) query.status = status;
    
    const riwayatList = await RiwayatKelasMurid.find(query).sort({ createdAt: -1 });
    
    return res.json({
      success: true,
      riwayatKelasMurid: riwayatList.map(r => r.toObject()),
      count: riwayatList.length,
    });
  } catch (error) {
    console.error('Get all riwayat kelas murid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data riwayat kelas murid',
      error: error.message,
    });
  }
};

// Get riwayat kelas murid by ID
export const getRiwayatKelasMuridById = async (req, res) => {
  try {
    const { id } = req.params;
    const riwayat = await RiwayatKelasMurid.findOne({ id });
    
    if (!riwayat) {
      return res.status(404).json({
        success: false,
        message: 'Riwayat kelas murid tidak ditemukan',
      });
    }
    
    return res.json({
      success: true,
      riwayatKelasMurid: riwayat.toObject(),
    });
  } catch (error) {
    console.error('Get riwayat kelas murid by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data riwayat kelas murid',
      error: error.message,
    });
  }
};

// Get riwayat kelas murid by muridId
export const getRiwayatKelasMuridByMuridId = async (req, res) => {
  try {
    const { muridId } = req.params;
    const { tahunAjaran, semester } = req.query;
    
    const query = { muridId };
    
    if (tahunAjaran) query.tahunAjaran = tahunAjaran;
    if (semester !== undefined) query.semester = parseInt(semester);
    
    const riwayatList = await RiwayatKelasMurid.find(query).sort({ createdAt: -1 });
    
    return res.json({
      success: true,
      riwayatKelasMurid: riwayatList.map(r => r.toObject()),
      count: riwayatList.length,
    });
  } catch (error) {
    console.error('Get riwayat kelas murid by muridId error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data riwayat kelas murid',
      error: error.message,
    });
  }
};

// Create riwayat kelas murid
export const createRiwayatKelasMurid = async (req, res) => {
  try {
    const {
      id,
      muridId,
      kelasId,
      tahunAjaran,
      semester,
      status,
    } = req.body;

    // Validation
    if (!muridId || !kelasId || !tahunAjaran || semester === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap. muridId, kelasId, tahunAjaran, dan semester wajib diisi',
      });
    }

    // Check if riwayat already exists
    const existingRiwayat = await RiwayatKelasMurid.findOne({ 
      muridId, 
      kelasId, 
      tahunAjaran, 
      semester 
    });

    if (existingRiwayat) {
      return res.json({
        success: true,
        message: 'Riwayat kelas murid sudah ada',
        riwayatKelasMurid: existingRiwayat.toObject(),
      });
    }

    // Generate ID if not provided
    const riwayatId = id || `riwayat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newRiwayat = new RiwayatKelasMurid({
      id: riwayatId,
      muridId,
      kelasId,
      tahunAjaran,
      semester,
      status: status || 'aktif',
      createdAt: new Date().toISOString(),
    });

    await newRiwayat.save();

    return res.status(201).json({
      success: true,
      message: 'Riwayat kelas murid berhasil dibuat',
      riwayatKelasMurid: newRiwayat.toObject(),
    });
  } catch (error) {
    console.error('Create riwayat kelas murid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat riwayat kelas murid',
      error: error.message,
    });
  }
};

// Bulk create riwayat kelas murid (ensure multiple)
export const bulkCreateRiwayatKelasMurid = async (req, res) => {
  try {
    const { riwayatList } = req.body;

    if (!Array.isArray(riwayatList) || riwayatList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'riwayatList harus berupa array yang tidak kosong',
      });
    }

    const results = [];
    const errors = [];

    for (const riwayatData of riwayatList) {
      try {
        const {
          id,
          muridId,
          kelasId,
          tahunAjaran,
          semester,
          status,
        } = riwayatData;

        if (!muridId || !kelasId || !tahunAjaran || semester === undefined) {
          errors.push({ riwayatData, error: 'Data tidak lengkap' });
          continue;
        }

        // Check if already exists
        const existingRiwayat = await RiwayatKelasMurid.findOne({ 
          muridId, 
          kelasId, 
          tahunAjaran, 
          semester 
        });

        if (existingRiwayat) {
          results.push(existingRiwayat.toObject());
          continue;
        }

        const riwayatId = id || `riwayat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newRiwayat = new RiwayatKelasMurid({
          id: riwayatId,
          muridId,
          kelasId,
          tahunAjaran,
          semester,
          status: status || 'aktif',
          createdAt: new Date().toISOString(),
        });

        await newRiwayat.save();
        results.push(newRiwayat.toObject());
      } catch (error) {
        errors.push({ riwayatData, error: error.message });
      }
    }

    return res.json({
      success: true,
      message: `Berhasil memproses ${results.length} dari ${riwayatList.length} riwayat`,
      riwayatKelasMurid: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Bulk create riwayat kelas murid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses riwayat kelas murid',
      error: error.message,
    });
  }
};

// Update riwayat kelas murid
export const updateRiwayatKelasMurid = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      kelasId,
    } = req.body;

    const riwayat = await RiwayatKelasMurid.findOne({ id });
    
    if (!riwayat) {
      return res.status(404).json({
        success: false,
        message: 'Riwayat kelas murid tidak ditemukan',
      });
    }

    if (status) riwayat.status = status;
    if (kelasId) riwayat.kelasId = kelasId;

    await riwayat.save();

    return res.json({
      success: true,
      message: 'Riwayat kelas murid berhasil diperbarui',
      riwayatKelasMurid: riwayat.toObject(),
    });
  } catch (error) {
    console.error('Update riwayat kelas murid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui riwayat kelas murid',
      error: error.message,
    });
  }
};

// Delete riwayat kelas murid
export const deleteRiwayatKelasMurid = async (req, res) => {
  try {
    const { id } = req.params;
    const riwayat = await RiwayatKelasMurid.findOne({ id });
    
    if (!riwayat) {
      return res.status(404).json({
        success: false,
        message: 'Riwayat kelas murid tidak ditemukan',
      });
    }

    await RiwayatKelasMurid.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Riwayat kelas murid berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete riwayat kelas murid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus riwayat kelas murid',
      error: error.message,
    });
  }
};

