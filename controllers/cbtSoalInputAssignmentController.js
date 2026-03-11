import CBTSoalInputAssignment from '../models/CBTSoalInputAssignment.js';
import TahunAjaran from '../models/TahunAjaran.js';
import PengaturanJenjangPendidikan from '../models/PengaturanJenjangPendidikan.js';

const isUTSUAS = (nama = '') => {
  const n = String(nama).toLowerCase().trim();
  return n === 'uts' || n === 'uas';
};

async function getActiveTAOrFail() {
  const active = await TahunAjaran.findOne({ isActive: true });
  return active || null;
}

async function isSMAOrSMK() {
  const jenjang = await PengaturanJenjangPendidikan.findOne();
  return jenjang?.jenjang === 'SMA/SMK';
}

// GET /api/cbt-soal-input-assignments
export const getAllCBTSoalInputAssignments = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi.',
      });
    }

    const {
      tahunAjaran,
      semester,
      guruId,
      kategoriId,
      mataPelajaranId,
      tingkat,
      jurusanId,
    } =
      req.query;

    const filter = {};

    // Guru hanya boleh melihat assignment miliknya
    if (req.user.role === 'guru') {
      filter.guruId = req.user.id;
    } else if (guruId) {
      filter.guruId = guruId;
    }

    if (tahunAjaran) filter.tahunAjaran = tahunAjaran;
    if (semester) filter.semester = parseInt(semester, 10);
    if (kategoriId) filter.kategoriId = kategoriId;
    if (mataPelajaranId) filter.mataPelajaranId = mataPelajaranId;
    if (tingkat) filter.tingkat = parseInt(tingkat, 10);
    if (jurusanId !== undefined) {
      // jurusanId kosong = "Semua Jurusan"
      if (String(jurusanId) === '') filter.jurusanId = { $in: ['', null] };
      else filter.jurusanId = jurusanId;
    }

    const list = await CBTSoalInputAssignment.find(filter).sort({
      tahunAjaran: -1,
      semester: -1,
      tingkat: 1,
      mataPelajaranId: 1,
      kategoriNama: 1,
    });

    return res.json({
      success: true,
      data: list.map((a) => a.toObject()),
      count: list.length,
    });
  } catch (error) {
    console.error('Error getting CBT soal input assignments:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data penunjukan guru penginput soal CBT',
      error: error.message,
    });
  }
};

// POST /api/cbt-soal-input-assignments
export const createCBTSoalInputAssignment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi.',
      });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Hanya admin yang dapat menunjuk guru penginput soal CBT.',
      });
    }

    const { guruId, kategoriId, kategoriNama, mataPelajaranId, tingkat, jurusanId } =
      req.body;
    if (!guruId || !kategoriId || !kategoriNama || !mataPelajaranId || !tingkat) {
      return res.status(400).json({
        success: false,
        message:
          'Guru, kategori (UTS/UAS), mata pelajaran, dan tingkat kelas wajib diisi.',
      });
    }
    if (!isUTSUAS(kategoriNama)) {
      return res.status(400).json({
        success: false,
        message: 'Penunjukan guru penginput hanya diperbolehkan untuk kategori UTS/UAS.',
      });
    }

    const active = await getActiveTAOrFail();
    if (!active) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada tahun ajaran aktif. Aktifkan tahun ajaran terlebih dahulu.',
      });
    }

    const requireJurusan = await isSMAOrSMK();
    // Untuk SMA/SMK:
    // - jurusanId kosong = berlaku untuk semua jurusan
    // - jurusanId berisi = berlaku hanya untuk jurusan tersebut
    const jurusanIdNormalized = requireJurusan ? String(jurusanId || '').trim() : '';

    const now = new Date().toISOString();
    const doc = new CBTSoalInputAssignment({
      id: `cbt-soal-input-assignment-${Date.now()}`,
      guruId,
      kategoriId,
      kategoriNama,
      mataPelajaranId,
      tingkat: parseInt(tingkat, 10),
      jurusanId: jurusanIdNormalized,
      tahunAjaran: active.tahun,
      semester: active.semester,
      createdAt: now,
      updatedAt: now,
    });

    await doc.save();

    return res.json({
      success: true,
      message: 'Guru penginput soal CBT berhasil ditunjuk untuk semester aktif.',
      data: doc.toObject(),
    });
  } catch (error) {
    // Duplicate key: unique index combination
    if (error && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          'Kombinasi kategori + mapel + tingkat + jurusan (jika ada) untuk semester aktif sudah punya guru penginput. Hapus/ubah penunjukan yang ada terlebih dahulu.',
      });
    }
    console.error('Error creating CBT soal input assignment:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menunjuk guru penginput soal CBT',
      error: error.message,
    });
  }
};

// DELETE /api/cbt-soal-input-assignments/:id
export const deleteCBTSoalInputAssignment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi.',
      });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Hanya admin yang dapat menghapus penunjukan guru penginput.',
      });
    }

    const { id } = req.params;
    const existing = await CBTSoalInputAssignment.findOne({ id });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Data penunjukan tidak ditemukan.',
      });
    }

    await CBTSoalInputAssignment.deleteOne({ id });
    return res.json({
      success: true,
      message: 'Penunjukan guru penginput berhasil dihapus.',
    });
  } catch (error) {
    console.error('Error deleting CBT soal input assignment:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus penunjukan guru penginput soal CBT',
      error: error.message,
    });
  }
};

