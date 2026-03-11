import TahunAjaran from '../models/TahunAjaran.js';

const isValidDateString = (value) => {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

const validateTanggalRange = (tanggalMulai, tanggalSelesai) => {
  if (!isValidDateString(tanggalMulai) || !isValidDateString(tanggalSelesai)) {
    return {
      ok: false,
      message: 'Tanggal mulai dan tanggal selesai wajib diisi dan harus valid',
    };
  }
  if (tanggalMulai >= tanggalSelesai) {
    return {
      ok: false,
      message: 'Tanggal selesai harus lebih besar dari tanggal mulai',
    };
  }
  return { ok: true };
};

// Get all tahun ajaran
export const getAllTahunAjaran = async (req, res) => {
  try {
    const tahunAjaran = await TahunAjaran.find().sort({ tahun: -1, semester: -1 });
    
    return res.json({
      success: true,
      tahunAjaran: tahunAjaran.map(ta => ta.toObject()),
      count: tahunAjaran.length,
    });
  } catch (error) {
    console.error('Get all tahun ajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data tahun ajaran',
    });
  }
};

// Get single tahun ajaran by ID
export const getTahunAjaranById = async (req, res) => {
  try {
    const { id } = req.params;
    const tahunAjaran = await TahunAjaran.findOne({ id });
    
    if (!tahunAjaran) {
      return res.status(404).json({
        success: false,
        message: 'Tahun ajaran tidak ditemukan',
      });
    }
    
    return res.json({
      success: true,
      tahunAjaran: tahunAjaran.toObject(),
    });
  } catch (error) {
    console.error('Get tahun ajaran by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data tahun ajaran',
    });
  }
};

// Get active tahun ajaran
export const getActiveTahunAjaran = async (req, res) => {
  try {
    const tahunAjaran = await TahunAjaran.findOne({ isActive: true });
    
    return res.json({
      success: true,
      tahunAjaran: tahunAjaran ? tahunAjaran.toObject() : null,
    });
  } catch (error) {
    console.error('Get active tahun ajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data tahun ajaran aktif',
    });
  }
};

// Create new tahun ajaran
export const createTahunAjaran = async (req, res) => {
  try {
    const {
      tahun,
      semester,
      isActive,
      tanggalMulai,
      tanggalSelesai,
      isAutoCreated,
    } = req.body;

    // Validation
    if (!tahun || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Tahun dan semester wajib diisi',
      });
    }

    if (semester !== 1 && semester !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Semester harus 1 atau 2',
      });
    }

    // Jika isAutoCreated = true, tanggalMulai dan tanggalSelesai boleh kosong (akan diisi manual)
    // Jika isAutoCreated = false atau tidak ada, tanggalMulai dan tanggalSelesai wajib diisi
    if (!isAutoCreated) {
      if (!tanggalMulai || !tanggalSelesai) {
        return res.status(400).json({
          success: false,
          message: 'Tanggal mulai dan tanggal selesai wajib diisi',
        });
      }

      if (tanggalMulai >= tanggalSelesai) {
        return res.status(400).json({
          success: false,
          message: 'Tanggal selesai harus lebih besar dari tanggal mulai',
        });
      }
    } else {
      // Untuk tahun ajaran yang dibuat otomatis, tanggal boleh kosong
      // Validasi tanggal hanya jika keduanya diisi
      if (tanggalMulai && tanggalSelesai && tanggalMulai >= tanggalSelesai) {
        return res.status(400).json({
          success: false,
          message: 'Tanggal selesai harus lebih besar dari tanggal mulai',
        });
      }
    }

    // Check if tahun and semester combination already exists
    const existingTahunAjaran = await TahunAjaran.findOne({ tahun, semester });
    if (existingTahunAjaran) {
      return res.status(400).json({
        success: false,
        message: 'Tahun ajaran dan semester yang sama sudah terdaftar',
      });
    }

    // If setting as active, deactivate all other tahun ajaran
    if (isActive) {
      await TahunAjaran.updateMany({ isActive: true }, { isActive: false });
    }

    // Create new tahun ajaran
    const newTahunAjaran = new TahunAjaran({
      id: `ta${Date.now()}`,
      tahun,
      semester,
      isActive: isActive || false,
      tanggalMulai,
      tanggalSelesai,
      isAutoCreated: isAutoCreated || false,
    });

    await newTahunAjaran.save();

    return res.json({
      success: true,
      message: 'Tahun ajaran berhasil ditambahkan',
      tahunAjaran: newTahunAjaran.toObject(),
    });
  } catch (error) {
    console.error('Create tahun ajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan tahun ajaran',
    });
  }
};

// Update tahun ajaran
export const updateTahunAjaran = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tahun,
      semester,
      isActive,
      tanggalMulai,
      tanggalSelesai,
    } = req.body;

    const tahunAjaran = await TahunAjaran.findOne({ id });
    if (!tahunAjaran) {
      return res.status(404).json({
        success: false,
        message: 'Tahun ajaran tidak ditemukan',
      });
    }

    // Jika mau mengaktifkan, tanggal wajib ada & valid (boleh dikirim di request atau sudah tersimpan di DB)
    if (isActive === true) {
      const mergedTanggalMulai = tanggalMulai ?? tahunAjaran.tanggalMulai;
      const mergedTanggalSelesai = tanggalSelesai ?? tahunAjaran.tanggalSelesai;
      const v = validateTanggalRange(mergedTanggalMulai, mergedTanggalSelesai);
      if (!v.ok) {
        return res.status(400).json({
          success: false,
          message: v.message,
        });
      }
    } else {
      // Validation untuk update tanggal (jika keduanya diisi)
      if (tanggalMulai && tanggalSelesai && tanggalMulai >= tanggalSelesai) {
        return res.status(400).json({
          success: false,
          message: 'Tanggal selesai harus lebih besar dari tanggal mulai',
        });
      }
    }

    // Check if tahun and semester combination already exists (excluding current)
    if (tahun && semester) {
      const existingTahunAjaran = await TahunAjaran.findOne({
        tahun,
        semester,
        id: { $ne: id },
      });
      if (existingTahunAjaran) {
        return res.status(400).json({
          success: false,
          message: 'Tahun ajaran dan semester yang sama sudah terdaftar',
        });
      }
    }

    // If setting as active, deactivate all other tahun ajaran
    if (isActive && !tahunAjaran.isActive) {
      await TahunAjaran.updateMany(
        { isActive: true, id: { $ne: id } },
        { isActive: false }
      );
    }

    // Update tahun ajaran data
    const updateData = {};
    if (tahun) updateData.tahun = tahun;
    if (semester) updateData.semester = semester;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (tanggalMulai) updateData.tanggalMulai = tanggalMulai;
    if (tanggalSelesai) updateData.tanggalSelesai = tanggalSelesai;

    await TahunAjaran.updateOne({ id }, updateData);

    const updatedTahunAjaran = await TahunAjaran.findOne({ id });

    return res.json({
      success: true,
      message: 'Tahun ajaran berhasil diperbarui',
      tahunAjaran: updatedTahunAjaran.toObject(),
    });
  } catch (error) {
    console.error('Update tahun ajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui tahun ajaran',
    });
  }
};

// Activate tahun ajaran
export const activateTahunAjaran = async (req, res) => {
  try {
    const { id } = req.params;

    const tahunAjaran = await TahunAjaran.findOne({ id });
    if (!tahunAjaran) {
      return res.status(404).json({
        success: false,
        message: 'Tahun ajaran tidak ditemukan',
      });
    }

    // Wajib punya tanggal valid saat aktivasi
    const v = validateTanggalRange(tahunAjaran.tanggalMulai, tahunAjaran.tanggalSelesai);
    if (!v.ok) {
      return res.status(400).json({
        success: false,
        message: `${v.message}. Silakan edit tahun ajaran dan isi tanggal mulai & tanggal selesai terlebih dahulu.`,
      });
    }

    // Deactivate all other tahun ajaran
    await TahunAjaran.updateMany(
      { isActive: true, id: { $ne: id } },
      { isActive: false }
    );

    // Activate this tahun ajaran
    await TahunAjaran.updateOne({ id }, { isActive: true });

    const updatedTahunAjaran = await TahunAjaran.findOne({ id });

    return res.json({
      success: true,
      message: 'Tahun ajaran berhasil diaktifkan',
      tahunAjaran: updatedTahunAjaran.toObject(),
    });
  } catch (error) {
    console.error('Activate tahun ajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengaktifkan tahun ajaran',
    });
  }
};

// Delete tahun ajaran
export const deleteTahunAjaran = async (req, res) => {
  try {
    const { id } = req.params;

    const tahunAjaran = await TahunAjaran.findOne({ id });
    if (!tahunAjaran) {
      return res.status(404).json({
        success: false,
        message: 'Tahun ajaran tidak ditemukan',
      });
    }

    // Check if tahun ajaran is active
    if (tahunAjaran.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus tahun ajaran yang sedang aktif. Nonaktifkan terlebih dahulu.',
      });
    }

    await TahunAjaran.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Tahun ajaran berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete tahun ajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus tahun ajaran',
    });
  }
};

