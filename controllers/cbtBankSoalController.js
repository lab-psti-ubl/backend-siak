import CBTBankSoal from '../models/CBTBankSoal.js';
import CBTKelas from '../models/CBTKelas.js';

// Helper untuk membentuk ID bank soal global (admin) berdasarkan tingkat & mapel
const getGlobalCBTBankSoalId = (tingkat, mataPelajaranId) =>
  `global-${tingkat}-${mataPelajaranId}`;

// GET /api/cbt-bank-soal
export const getAllCBTBankSoal = async (req, res) => {
  try {
    const { cbtKelasId, guruId, tipe, includeGlobal } = req.query;

    const filter = {};
    if (cbtKelasId) filter.cbtKelasId = cbtKelasId;
    if (guruId) filter.guruId = guruId;
    if (tipe) filter.tipe = tipe;

    let list = await CBTBankSoal.find(filter).sort({ createdAt: 1 });

    // Jika diminta, sertakan juga bank soal global (dibuat admin) untuk tingkat & mapel yang sama
    if (includeGlobal === '1' && cbtKelasId) {
      const cbtKelas = await CBTKelas.findOne({ id: cbtKelasId });
      if (cbtKelas) {
        const globalId = getGlobalCBTBankSoalId(
          cbtKelas.tingkat,
          cbtKelas.mataPelajaranId
        );

        const globalFilter = {};
        globalFilter.cbtKelasId = globalId;
        if (tipe) globalFilter.tipe = tipe;

        const globalList = await CBTBankSoal.find(globalFilter).sort({
          createdAt: 1,
        });

        list = [...list, ...globalList];
      }
    }

    return res.json({
      success: true,
      data: list.map((b) => b.toObject()),
      count: list.length,
    });
  } catch (error) {
    console.error('Error getting CBT bank soal:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data bank soal CBT',
      error: error.message,
    });
  }
};

// GET /api/cbt-bank-soal/:id
export const getCBTBankSoalById = async (req, res) => {
  try {
    const { id } = req.params;
    const bank = await CBTBankSoal.findOne({ id });
    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Bank soal CBT tidak ditemukan',
      });
    }

    return res.json({
      success: true,
      data: bank.toObject(),
    });
  } catch (error) {
    console.error('Error getting CBT bank soal by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data bank soal CBT',
      error: error.message,
    });
  }
};

// POST /api/cbt-bank-soal
export const createCBTBankSoal = async (req, res) => {
  try {
    const { cbtKelasId, guruId, judul, kategoriId, kategoriNama, tipe } = req.body;

    if (!cbtKelasId || !guruId || !judul || !kategoriId || !kategoriNama || !tipe) {
      return res.status(400).json({
        success: false,
        message:
          'Judul, kategori, tipe soal, kelas CBT, dan guru wajib diisi untuk membuat bank soal CBT',
      });
    }

    const now = new Date().toISOString();
    const soalInitial = Array.isArray(req.body.soal) ? req.body.soal : [];
    const bank = new CBTBankSoal({
      id: `cbt-bank-${Date.now()}`,
      cbtKelasId,
      guruId,
      judul,
      kategoriId,
      kategoriNama,
      tipe,
      soal: soalInitial,
      createdAt: now,
      updatedAt: now,
    });

    await bank.save();

    return res.json({
      success: true,
      message: 'Bank soal CBT berhasil dibuat',
      data: bank.toObject(),
    });
  } catch (error) {
    console.error('Error creating CBT bank soal:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat bank soal CBT',
      error: error.message,
    });
  }
};

// PUT /api/cbt-bank-soal/:id
export const updateCBTBankSoal = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const bank = await CBTBankSoal.findOne({ id });
    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Bank soal CBT tidak ditemukan',
      });
    }

    const updatableFields = ['judul', 'kategoriId', 'kategoriNama', 'tipe', 'soal'];
    updatableFields.forEach((field) => {
      if (updates[field] !== undefined) {
        bank[field] = updates[field];
      }
    });
    bank.updatedAt = new Date().toISOString();
    await bank.save();

    return res.json({
      success: true,
      message: 'Bank soal CBT berhasil diperbarui',
      data: bank.toObject(),
    });
  } catch (error) {
    console.error('Error updating CBT bank soal:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui bank soal CBT',
      error: error.message,
    });
  }
};

// DELETE /api/cbt-bank-soal/:id
export const deleteCBTBankSoal = async (req, res) => {
  try {
    const { id } = req.params;

    const bank = await CBTBankSoal.findOne({ id });
    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Bank soal CBT tidak ditemukan',
      });
    }

    await CBTBankSoal.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Bank soal CBT berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting CBT bank soal:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus bank soal CBT',
      error: error.message,
    });
  }
};

