import CBTKelas from '../models/CBTKelas.js';

// GET /api/cbt-kelas
export const getAllCBTKelas = async (req, res) => {
  try {
    const { guruId, tingkat, mataPelajaranId, semester, tahunAjaran } = req.query;

    const filter = {};
    if (guruId) filter.guruId = guruId;
    if (tingkat) filter.tingkat = parseInt(tingkat);
    if (mataPelajaranId) filter.mataPelajaranId = mataPelajaranId;
    if (semester) filter.semester = parseInt(semester);
    if (tahunAjaran) filter.tahunAjaran = tahunAjaran;

    const cbtKelasList = await CBTKelas.find(filter).sort({
      tahunAjaran: -1,
      semester: -1,
      tingkat: 1,
    });

    return res.json({
      success: true,
      data: cbtKelasList.map((k) => k.toObject()),
      count: cbtKelasList.length,
    });
  } catch (error) {
    console.error('Error getting CBT kelas:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kelas CBT',
      error: error.message,
    });
  }
};

// POST /api/cbt-kelas
export const createCBTKelas = async (req, res) => {
  try {
    const { guruId, tingkat, mataPelajaranId, semester, tahunAjaran } = req.body;

    if (!guruId || !tingkat || !mataPelajaranId || !semester || !tahunAjaran) {
      return res.status(400).json({
        success: false,
        message: 'Guru, tingkat, mata pelajaran, semester, dan tahun ajaran wajib diisi',
      });
    }

    const numericTingkat = parseInt(tingkat);
    const numericSemester = parseInt(semester);

    const existing = await CBTKelas.findOne({
      guruId,
      tingkat: numericTingkat,
      mataPelajaranId,
      semester: numericSemester,
      tahunAjaran,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Kelas CBT untuk kombinasi ini sudah ada',
      });
    }

    const now = new Date().toISOString();
    const newCBTKelas = new CBTKelas({
      id: `cbt-kelas-${Date.now()}`,
      guruId,
      tingkat: numericTingkat,
      mataPelajaranId,
      semester: numericSemester,
      tahunAjaran,
      createdAt: now,
      updatedAt: now,
    });

    await newCBTKelas.save();

    return res.json({
      success: true,
      message: 'Kelas CBT berhasil dibuat',
      data: newCBTKelas.toObject(),
    });
  } catch (error) {
    console.error('Error creating CBT kelas:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat kelas CBT',
      error: error.message,
    });
  }
};

// PUT /api/cbt-kelas/:id
export const updateCBTKelas = async (req, res) => {
  try {
    const { id } = req.params;
    const { tingkat, mataPelajaranId, semester, tahunAjaran } = req.body;

    const cbtKelas = await CBTKelas.findOne({ id });
    if (!cbtKelas) {
      return res.status(404).json({
        success: false,
        message: 'Kelas CBT tidak ditemukan',
      });
    }

    if (tingkat !== undefined) {
      cbtKelas.tingkat = parseInt(tingkat);
    }
    if (mataPelajaranId !== undefined) {
      cbtKelas.mataPelajaranId = mataPelajaranId;
    }
    if (semester !== undefined) {
      cbtKelas.semester = parseInt(semester);
    }
    if (tahunAjaran !== undefined) {
      cbtKelas.tahunAjaran = tahunAjaran;
    }

    cbtKelas.updatedAt = new Date().toISOString();
    await cbtKelas.save();

    return res.json({
      success: true,
      message: 'Kelas CBT berhasil diperbarui',
      data: cbtKelas.toObject(),
    });
  } catch (error) {
    console.error('Error updating CBT kelas:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui kelas CBT',
      error: error.message,
    });
  }
};

// DELETE /api/cbt-kelas/:id
export const deleteCBTKelas = async (req, res) => {
  try {
    const { id } = req.params;

    const cbtKelas = await CBTKelas.findOne({ id });
    if (!cbtKelas) {
      return res.status(404).json({
        success: false,
        message: 'Kelas CBT tidak ditemukan',
      });
    }

    await CBTKelas.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Kelas CBT berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting CBT kelas:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus kelas CBT',
      error: error.message,
    });
  }
};

