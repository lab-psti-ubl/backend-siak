import CBTUjian from '../models/CBTUjian.js';
import CBTKelas from '../models/CBTKelas.js';

// GET /api/cbt-ujian
export const getAllCBTUjian = async (req, res) => {
  try {
    const { guruId, cbtKelasId, kelasId, tahunAjaran, semester } = req.query;

    const filter = {};
    if (guruId) filter.guruId = guruId;
    if (cbtKelasId) filter.cbtKelasId = cbtKelasId;
    if (kelasId) filter.kelasId = kelasId;
    if (tahunAjaran) filter.tahunAjaran = tahunAjaran;
    if (semester) filter.semester = parseInt(semester, 10);

    const list = await CBTUjian.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: list.map((u) => u.toObject()),
      count: list.length,
    });
  } catch (error) {
    console.error('Error getting CBT ujian:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data ujian CBT',
      error: error.message,
    });
  }
};

// GET /api/cbt-ujian/:id
export const getCBTUjianById = async (req, res) => {
  try {
    const { id } = req.params;
    const ujian = await CBTUjian.findOne({ id });
    if (!ujian) {
      return res.status(404).json({
        success: false,
        message: 'Ujian CBT tidak ditemukan',
      });
    }

    return res.json({
      success: true,
      data: ujian.toObject(),
    });
  } catch (error) {
    console.error('Error getting CBT ujian by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data ujian CBT',
      error: error.message,
    });
  }
};

// POST /api/cbt-ujian
export const createCBTUjian = async (req, res) => {
  try {
    const {
      guruId,
      cbtKelasId,
      kelasId,
      mataPelajaranId,
      bankSoalId,
      bankSoalJudul,
      kategoriId,
      kategoriNama,
      kategoriHasNilai,
      kategoriKe,
      judulUjian,
      tanggalMulai,
      jamMulai,
      tanggalSelesai,
      jamSelesai,
      durasiMenit,
      acakSoal,
      tunjukanHasilNilai,
    } = req.body;

    if (
      !guruId ||
      !cbtKelasId ||
      !kelasId ||
      !mataPelajaranId ||
      !bankSoalId ||
      !bankSoalJudul ||
      !kategoriId ||
      !kategoriNama ||
      !judulUjian ||
      !tanggalMulai ||
      !jamMulai ||
      !tanggalSelesai ||
      !jamSelesai ||
      !durasiMenit
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Guru, kelas CBT, kelas, mata pelajaran, bank soal, kategori, judul ujian, waktu mulai/selesai, dan durasi ujian wajib diisi',
      });
    }

    // Pastikan CBTKelas yang dirujuk valid (kombinasi tingkat + mapel + tahun ajaran + semester)
    const cbtKelas = await CBTKelas.findOne({ id: cbtKelasId });
    if (!cbtKelas) {
      return res.status(400).json({
        success: false,
        message: 'Kelas CBT yang dipilih tidak ditemukan. Tambahkan dulu di menu Bank Soal CBT.',
      });
    }

    const now = new Date().toISOString();

    const ujian = new CBTUjian({
      id: `cbt-ujian-${Date.now()}`,
      guruId,
      cbtKelasId,
      kelasId,
      mataPelajaranId,
      bankSoalId,
      bankSoalJudul,
      kategoriId,
      kategoriNama,
      kategoriHasNilai: !!kategoriHasNilai,
      kategoriKe: kategoriHasNilai ? kategoriKe ?? null : null,
      judulUjian,
      tahunAjaran: cbtKelas.tahunAjaran,
      semester: cbtKelas.semester,
      tanggalMulai,
      jamMulai,
      tanggalSelesai,
      jamSelesai,
      durasiMenit,
      acakSoal: !!acakSoal,
      tunjukanHasilNilai: !!tunjukanHasilNilai,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    });

    await ujian.save();

    return res.json({
      success: true,
      message: 'Ujian CBT berhasil dibuat',
      data: ujian.toObject(),
    });
  } catch (error) {
    console.error('Error creating CBT ujian:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat ujian CBT',
      error: error.message,
    });
  }
};

// PUT /api/cbt-ujian/:id
export const updateCBTUjian = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const ujian = await CBTUjian.findOne({ id });
    if (!ujian) {
      return res.status(404).json({
        success: false,
        message: 'Ujian CBT tidak ditemukan',
      });
    }

    const updatableFields = [
      'kelasId',
      'mataPelajaranId',
      'bankSoalId',
      'bankSoalJudul',
      'kategoriId',
      'kategoriNama',
      'kategoriHasNilai',
      'kategoriKe',
      'judulUjian',
      'tanggalMulai',
      'jamMulai',
      'tanggalSelesai',
      'jamSelesai',
      'durasiMenit',
      'acakSoal',
      'tunjukanHasilNilai',
      'isPublished',
    ];

    updatableFields.forEach((field) => {
      if (updates[field] !== undefined) {
        ujian[field] = updates[field];
      }
    });

    ujian.updatedAt = new Date().toISOString();
    await ujian.save();

    return res.json({
      success: true,
      message: 'Ujian CBT berhasil diperbarui',
      data: ujian.toObject(),
    });
  } catch (error) {
    console.error('Error updating CBT ujian:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui ujian CBT',
      error: error.message,
    });
  }
};

// DELETE /api/cbt-ujian/:id
export const deleteCBTUjian = async (req, res) => {
  try {
    const { id } = req.params;

    const ujian = await CBTUjian.findOne({ id });
    if (!ujian) {
      return res.status(404).json({
        success: false,
        message: 'Ujian CBT tidak ditemukan',
      });
    }

    await CBTUjian.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Ujian CBT berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting CBT ujian:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus ujian CBT',
      error: error.message,
    });
  }
};

