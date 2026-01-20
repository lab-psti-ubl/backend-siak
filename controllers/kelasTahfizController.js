import KelasTahfiz from '../models/KelasTahfiz.js';

// Get all kelas tahfiz
export const getAllKelasTahfiz = async (req, res) => {
  try {
    const kelasTahfiz = await KelasTahfiz.find().sort({ createdAt: -1 });
    
    return res.json({
      success: true,
      kelasTahfiz: kelasTahfiz,
      count: kelasTahfiz.length,
    });
  } catch (error) {
    console.error('Get all kelas tahfiz error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data kelas tahfiz',
    });
  }
};

// Get single kelas tahfiz by ID
export const getKelasTahfizById = async (req, res) => {
  try {
    const { id } = req.params;
    const kelasTahfiz = await KelasTahfiz.findOne({ id });
    
    if (!kelasTahfiz) {
      return res.status(404).json({
        success: false,
        message: 'Kelas tahfiz tidak ditemukan',
      });
    }
    
    return res.json({
      success: true,
      kelasTahfiz: kelasTahfiz,
    });
  } catch (error) {
    console.error('Get kelas tahfiz by id error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data kelas tahfiz',
    });
  }
};

// Create kelas tahfiz
export const createKelasTahfiz = async (req, res) => {
  try {
    const {
      id,
      namaKelas,
      ruangan,
      ustadzId,
      santriIds = [],
    } = req.body;

    // Validate required fields
    if (!id || !namaKelas || !ruangan || !ustadzId) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap. Pastikan id, namaKelas, ruangan, dan ustadzId diisi.',
      });
    }

    // Check if id already exists
    const existingKelas = await KelasTahfiz.findOne({ id });
    if (existingKelas) {
      return res.status(400).json({
        success: false,
        message: 'ID kelas tahfiz sudah digunakan',
      });
    }

    const newKelasTahfiz = new KelasTahfiz({
      id,
      namaKelas: namaKelas.trim(),
      ruangan: ruangan.trim(),
      ustadzId,
      santriIds: Array.isArray(santriIds) ? santriIds : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await newKelasTahfiz.save();

    return res.json({
      success: true,
      message: 'Kelas tahfiz berhasil ditambahkan',
      kelasTahfiz: newKelasTahfiz,
    });
  } catch (error) {
    console.error('Create kelas tahfiz error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'ID kelas tahfiz sudah digunakan',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan kelas tahfiz',
    });
  }
};

// Update kelas tahfiz
export const updateKelasTahfiz = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      namaKelas,
      ruangan,
      ustadzId,
      santriIds,
    } = req.body;

    const kelasTahfiz = await KelasTahfiz.findOne({ id });
    
    if (!kelasTahfiz) {
      return res.status(404).json({
        success: false,
        message: 'Kelas tahfiz tidak ditemukan',
      });
    }

    // Update fields
    if (namaKelas !== undefined) kelasTahfiz.namaKelas = namaKelas.trim();
    if (ruangan !== undefined) kelasTahfiz.ruangan = ruangan.trim();
    if (ustadzId !== undefined) kelasTahfiz.ustadzId = ustadzId;
    if (santriIds !== undefined) kelasTahfiz.santriIds = Array.isArray(santriIds) ? santriIds : [];
    kelasTahfiz.updatedAt = new Date().toISOString();

    await kelasTahfiz.save();

    return res.json({
      success: true,
      message: 'Kelas tahfiz berhasil diperbarui',
      kelasTahfiz: kelasTahfiz,
    });
  } catch (error) {
    console.error('Update kelas tahfiz error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui kelas tahfiz',
    });
  }
};

// Delete kelas tahfiz
export const deleteKelasTahfiz = async (req, res) => {
  try {
    const { id } = req.params;
    
    const kelasTahfiz = await KelasTahfiz.findOne({ id });
    
    if (!kelasTahfiz) {
      return res.status(404).json({
        success: false,
        message: 'Kelas tahfiz tidak ditemukan',
      });
    }

    await KelasTahfiz.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Kelas tahfiz berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete kelas tahfiz error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus kelas tahfiz',
    });
  }
};

