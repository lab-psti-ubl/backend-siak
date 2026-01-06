import Jurusan from '../models/Jurusan.js';
import Kelas from '../models/Kelas.js';
import Murid from '../models/Murid.js';

// Get all jurusan
export const getAllJurusan = async (req, res) => {
  try {
    const jurusanList = await Jurusan.find().sort({ name: 1 });
    
    return res.json({
      success: true,
      jurusan: jurusanList.map(j => j.toObject()),
      count: jurusanList.length,
    });
  } catch (error) {
    console.error('Get all jurusan error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data jurusan',
    });
  }
};

// Get single jurusan by ID
export const getJurusanById = async (req, res) => {
  try {
    const { id } = req.params;
    const jurusan = await Jurusan.findOne({ id });
    
    if (!jurusan) {
      return res.status(404).json({
        success: false,
        message: 'Jurusan tidak ditemukan',
      });
    }
    
    return res.json({
      success: true,
      jurusan: jurusan.toObject(),
    });
  } catch (error) {
    console.error('Get jurusan by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data jurusan',
    });
  }
};

// Create new jurusan
export const createJurusan = async (req, res) => {
  try {
    const { name, code, description, isActive } = req.body;

    // Validation
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan kode jurusan wajib diisi',
      });
    }

    // Check if code already exists
    const existingCode = await Jurusan.findOne({ code });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Kode jurusan sudah terdaftar',
      });
    }

    // If setting as active, deactivate all other jurusan
    if (isActive) {
      await Jurusan.updateMany({}, { isActive: false });
    }

    // Create new jurusan
    const newJurusan = new Jurusan({
      id: `jurusan${Date.now()}`,
      name,
      code,
      description: description || '',
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
    });

    await newJurusan.save();

    return res.json({
      success: true,
      message: 'Jurusan berhasil ditambahkan',
      jurusan: newJurusan.toObject(),
    });
  } catch (error) {
    console.error('Create jurusan error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan jurusan',
    });
  }
};

// Update jurusan
export const updateJurusan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, isActive } = req.body;

    const jurusan = await Jurusan.findOne({ id });
    if (!jurusan) {
      return res.status(404).json({
        success: false,
        message: 'Jurusan tidak ditemukan',
      });
    }

    // Check if code already exists (excluding current jurusan)
    if (code && code !== jurusan.code) {
      const existingCode = await Jurusan.findOne({ code });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'Kode jurusan sudah terdaftar',
        });
      }
    }

    // If setting as active, deactivate all other jurusan
    if (isActive && !jurusan.isActive) {
      await Jurusan.updateMany({ id: { $ne: id } }, { isActive: false });
    }

    // Update jurusan data
    const updateData = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    await Jurusan.updateOne({ id }, updateData);

    const updatedJurusan = await Jurusan.findOne({ id });

    return res.json({
      success: true,
      message: 'Jurusan berhasil diperbarui',
      jurusan: updatedJurusan.toObject(),
    });
  } catch (error) {
    console.error('Update jurusan error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui jurusan',
    });
  }
};

// Delete jurusan
export const deleteJurusan = async (req, res) => {
  try {
    const { id } = req.params;

    const jurusan = await Jurusan.findOne({ id });
    if (!jurusan) {
      return res.status(404).json({
        success: false,
        message: 'Jurusan tidak ditemukan',
      });
    }

    // Check if jurusan has kelas
    const kelasWithJurusan = await Kelas.find({ jurusanId: id });
    if (kelasWithJurusan.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Jurusan "${jurusan.name}" masih memiliki ${kelasWithJurusan.length} kelas aktif. Hapus atau pindahkan semua kelas terlebih dahulu sebelum menghapus jurusan.`,
      });
    }

    await Jurusan.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Jurusan berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete jurusan error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus jurusan',
    });
  }
};

// Get jurusan stats (kelas count, murid count)
export const getJurusanStats = async (req, res) => {
  try {
    const { id } = req.params;

    const kelasCount = await Kelas.countDocuments({ jurusanId: id });
    const kelasIds = (await Kelas.find({ jurusanId: id })).map(k => k.id);
    const muridCount = await Murid.countDocuments({
      kelasId: { $in: kelasIds },
      isActive: { $ne: false },
    });

    return res.json({
      success: true,
      stats: {
        kelasCount,
        muridCount,
      },
    });
  } catch (error) {
    console.error('Get jurusan stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik jurusan',
    });
  }
};

