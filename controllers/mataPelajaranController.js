import MataPelajaran from '../models/MataPelajaran.js';

// Get all mata pelajaran
export const getAllMataPelajaran = async (req, res) => {
  try {
    const mataPelajaran = await MataPelajaran.find().sort({ name: 1 });
    
    return res.json({
      success: true,
      mataPelajaran: mataPelajaran.map(m => m.toObject()),
      count: mataPelajaran.length,
    });
  } catch (error) {
    console.error('Get all mata pelajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data mata pelajaran',
    });
  }
};

// Get single mata pelajaran by ID
export const getMataPelajaranById = async (req, res) => {
  try {
    const { id } = req.params;
    const mataPelajaran = await MataPelajaran.findOne({ id });
    
    if (!mataPelajaran) {
      return res.status(404).json({
        success: false,
        message: 'Mata pelajaran tidak ditemukan',
      });
    }
    
    return res.json({
      success: true,
      mataPelajaran: mataPelajaran.toObject(),
    });
  } catch (error) {
    console.error('Get mata pelajaran by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data mata pelajaran',
    });
  }
};

// Create new mata pelajaran
export const createMataPelajaran = async (req, res) => {
  try {
    const {
      name,
      code,
      sks,
      keterangan,
      jurusanId,
      semester,
      tingkatKelas,
    } = req.body;

    // Validation
    if (!name || !code || !sks || !keterangan || !semester || !tingkatKelas) {
      return res.status(400).json({
        success: false,
        message: 'Nama, kode, SKS, keterangan, semester, dan tingkat kelas wajib diisi',
      });
    }

    if (keterangan === 'jurusan' && !jurusanId) {
      return res.status(400).json({
        success: false,
        message: 'Jurusan wajib dipilih untuk mata pelajaran jurusan',
      });
    }

    if (!Array.isArray(tingkatKelas) || tingkatKelas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Pilih minimal satu tingkat kelas',
      });
    }

    // Check if code already exists
    const existingCode = await MataPelajaran.findOne({ code });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Kode mata pelajaran sudah terdaftar',
      });
    }

    // Create new mata pelajaran
    const newMataPelajaran = new MataPelajaran({
      id: `mapel${Date.now()}`,
      name,
      code: code.toUpperCase(),
      sks,
      keterangan,
      jurusanId: keterangan === 'jurusan' ? jurusanId : undefined,
      semester,
      tingkatKelas: tingkatKelas.sort(),
    });

    await newMataPelajaran.save();

    return res.json({
      success: true,
      message: 'Mata pelajaran berhasil ditambahkan',
      mataPelajaran: newMataPelajaran.toObject(),
    });
  } catch (error) {
    console.error('Create mata pelajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan mata pelajaran',
    });
  }
};

// Update mata pelajaran
export const updateMataPelajaran = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      sks,
      keterangan,
      jurusanId,
      semester,
      tingkatKelas,
    } = req.body;

    const mataPelajaran = await MataPelajaran.findOne({ id });
    if (!mataPelajaran) {
      return res.status(404).json({
        success: false,
        message: 'Mata pelajaran tidak ditemukan',
      });
    }

    // Validation
    if (keterangan === 'jurusan' && !jurusanId) {
      return res.status(400).json({
        success: false,
        message: 'Jurusan wajib dipilih untuk mata pelajaran jurusan',
      });
    }

    if (tingkatKelas && (!Array.isArray(tingkatKelas) || tingkatKelas.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Pilih minimal satu tingkat kelas',
      });
    }

    // Check if code already exists (excluding current)
    if (code && code !== mataPelajaran.code) {
      const existingCode = await MataPelajaran.findOne({ code });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'Kode mata pelajaran sudah terdaftar',
        });
      }
    }

    // Update mata pelajaran data
    const updateData = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code.toUpperCase();
    if (sks) updateData.sks = sks;
    if (keterangan) updateData.keterangan = keterangan;
    if (keterangan === 'jurusan') {
      updateData.jurusanId = jurusanId;
    } else if (keterangan === 'umum') {
      updateData.jurusanId = undefined;
    }
    if (semester) updateData.semester = semester;
    if (tingkatKelas) updateData.tingkatKelas = tingkatKelas.sort();

    await MataPelajaran.updateOne({ id }, updateData);

    const updatedMataPelajaran = await MataPelajaran.findOne({ id });

    return res.json({
      success: true,
      message: 'Mata pelajaran berhasil diperbarui',
      mataPelajaran: updatedMataPelajaran.toObject(),
    });
  } catch (error) {
    console.error('Update mata pelajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui mata pelajaran',
    });
  }
};

// Delete mata pelajaran
export const deleteMataPelajaran = async (req, res) => {
  try {
    const { id } = req.params;

    const mataPelajaran = await MataPelajaran.findOne({ id });
    if (!mataPelajaran) {
      return res.status(404).json({
        success: false,
        message: 'Mata pelajaran tidak ditemukan',
      });
    }

    await MataPelajaran.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Mata pelajaran berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete mata pelajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus mata pelajaran',
    });
  }
};

