import CBTBankSoal from '../models/CBTBankSoal.js';
import CBTKelas from '../models/CBTKelas.js';
import TahunAjaran from '../models/TahunAjaran.js';
import CBTSoalInputAssignment from '../models/CBTSoalInputAssignment.js';

// Helper untuk membentuk ID bank soal global (admin) berdasarkan tingkat & mapel
const getGlobalCBTBankSoalId = (tingkat, mataPelajaranId) =>
  `global-${tingkat}-${mataPelajaranId}`;

const parseGlobalCBTKelasId = (cbtKelasId) => {
  const raw = String(cbtKelasId || '');
  if (!raw.startsWith('global-')) return null;
  const rest = raw.slice('global-'.length);
  const m = rest.match(/^(\d+)-(.+)$/);
  if (!m) return null;
  const tingkat = parseInt(m[1], 10);
  const remain = m[2];
  const marker = '--jur--';
  const idx = remain.lastIndexOf(marker);
  if (idx >= 0) {
    const mataPelajaranId = remain.slice(0, idx);
    const jurusanId = remain.slice(idx + marker.length);
    return { tingkat, mataPelajaranId, jurusanId };
  }
  return { tingkat, mataPelajaranId: remain, jurusanId: '' };
};

const isUTSUASNama = (nama = '') => {
  const n = String(nama).toLowerCase().trim();
  return n === 'uts' || n === 'uas';
};

async function getActiveTAOrNull() {
  return await TahunAjaran.findOne({ isActive: true });
}

async function isGuruAssignedForGlobalInput({
  guruId,
  kategoriId,
  kategoriNama,
  mataPelajaranId,
  tingkat,
  jurusanId,
}) {
  const active = await getActiveTAOrNull();
  if (!active) return false;
  if (!isUTSUASNama(kategoriNama)) return false;

  const jur = String(jurusanId || '');
  const jurusanFilter = jur === '' ? { $in: ['', null] } : jur;

  const assignment = await CBTSoalInputAssignment.findOne({
    guruId,
    kategoriId,
    mataPelajaranId,
    tingkat,
    jurusanId: jurusanFilter,
    tahunAjaran: active.tahun,
    semester: active.semester,
  });
  return !!assignment;
}

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
    const actor = req.user;
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
      });
    }

    const { cbtKelasId, judul, kategoriId, kategoriNama, tipe, totalSoal, customKuota } = req.body;
    let { guruId } = req.body;

    if (!cbtKelasId || !guruId || !judul || !kategoriId || !kategoriNama || !tipe) {
      return res.status(400).json({
        success: false,
        message:
          'Judul, kategori, tipe soal, kelas CBT, dan guru wajib diisi untuk membuat bank soal CBT',
      });
    }

    const normalizedTotalSoal =
      totalSoal === undefined || totalSoal === null || totalSoal === ''
        ? null
        : Number(totalSoal);
    if (normalizedTotalSoal !== null && (!Number.isFinite(normalizedTotalSoal) || normalizedTotalSoal < 1)) {
      return res.status(400).json({
        success: false,
        message: 'Total soal harus berupa angka minimal 1.',
      });
    }

    const normalizedCustomKuota =
      customKuota && typeof customKuota === 'object' && !Array.isArray(customKuota) ? customKuota : {};
    if (tipe === 'custom') {
      const allowedKeys = [
        'pilihan_ganda',
        'pilihan_ganda_kompleks',
        'essay',
        'benar_salah',
        'menjodohkan',
      ];
      const entries = Object.entries(normalizedCustomKuota).filter(([k, v]) => allowedKeys.includes(k));
      if (entries.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Untuk tipe custom, pilih minimal 1 jenis soal dan isi kuotanya.',
        });
      }
      let sum = 0;
      for (const [, v] of entries) {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0) {
          return res.status(400).json({
            success: false,
            message: 'Kuota custom harus berupa angka 0 atau lebih.',
          });
        }
        sum += n;
      }
      if (normalizedTotalSoal !== null && sum > normalizedTotalSoal) {
        return res.status(400).json({
          success: false,
          message: `Total kuota custom (${sum}) tidak boleh melebihi Total Soal (${normalizedTotalSoal}).`,
        });
      }
    }

    const globalMeta = parseGlobalCBTKelasId(cbtKelasId);
    const isGlobal = !!globalMeta;

    // Authorization:
    // - Admin: tetap boleh (perilaku lama)
    // - Guru:
    //   - bank kelas biasa: hanya untuk dirinya sendiri
    //   - bank global (UTS/UAS): hanya jika ditunjuk admin untuk semester aktif
    if (actor.role === 'guru') {
      // Guru tidak boleh spoof guruId
      if (!isGlobal && guruId !== actor.id) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki akses untuk membuat bank soal untuk guru lain.',
        });
      }

      if (!isGlobal) {
        guruId = actor.id;
      } else {
        // Global bank selalu disimpan sebagai "admin" (supaya muncul di halaman admin)
        // namun hanya guru yang ditunjuk yang boleh menginput.
        if (!isUTSUASNama(kategoriNama)) {
          return res.status(403).json({
            success: false,
            message: 'Bank soal global hanya diperbolehkan untuk kategori UTS/UAS.',
          });
        }

        const allowed = await isGuruAssignedForGlobalInput({
          guruId: actor.id,
          kategoriId,
          kategoriNama,
          mataPelajaranId: globalMeta.mataPelajaranId,
          tingkat: globalMeta.tingkat,
          jurusanId: globalMeta.jurusanId,
        });
        if (!allowed) {
          return res.status(403).json({
            success: false,
            message:
              'Anda tidak ditunjuk sebagai penginput soal UTS/UAS untuk mata pelajaran dan tingkat kelas ini pada semester aktif.',
          });
        }

        guruId = 'admin';
      }
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
      totalSoal: normalizedTotalSoal,
      customKuota: tipe === 'custom' ? normalizedCustomKuota : {},
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
    const actor = req.user;
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
      });
    }

    const bank = await CBTBankSoal.findOne({ id });
    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Bank soal CBT tidak ditemukan',
      });
    }

    const globalMeta = parseGlobalCBTKelasId(bank.cbtKelasId);
    const isGlobal = !!globalMeta;

    // Authorization:
    // - Admin: boleh update apapun sesuai whitelist lama
    // - Guru:
    //   - bank kelas biasa: hanya jika bank.guruId === actor.id
    //   - bank global: hanya jika ditunjuk untuk semester aktif (kategori + mapel + tingkat)
    if (actor.role === 'guru') {
      if (!isGlobal) {
        if (bank.guruId !== actor.id) {
          return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki akses untuk memperbarui bank soal ini.',
          });
        }
      } else {
        if (!isUTSUASNama(bank.kategoriNama)) {
          return res.status(403).json({
            success: false,
            message: 'Bank soal global hanya diperbolehkan untuk kategori UTS/UAS.',
          });
        }

        const allowed = await isGuruAssignedForGlobalInput({
          guruId: actor.id,
          kategoriId: bank.kategoriId,
          kategoriNama: bank.kategoriNama,
          mataPelajaranId: globalMeta.mataPelajaranId,
          tingkat: globalMeta.tingkat,
          jurusanId: globalMeta.jurusanId,
        });
        if (!allowed) {
          return res.status(403).json({
            success: false,
            message:
              'Anda tidak ditunjuk sebagai penginput soal UTS/UAS untuk bank soal global ini pada semester aktif.',
          });
        }

        // Untuk guru, kunci field sensitif bank global (hindari bypass)
        const forbiddenFields = ['cbtKelasId', 'guruId', 'kategoriId', 'kategoriNama', 'tipe'];
        for (const f of forbiddenFields) {
          if (updates[f] !== undefined) {
            return res.status(400).json({
              success: false,
              message: `Field "${f}" tidak dapat diubah pada bank soal global.`,
            });
          }
        }
      }
    }

    const updatableFields =
      actor.role === 'admin'
        ? ['judul', 'kategoriId', 'kategoriNama', 'tipe', 'totalSoal', 'customKuota', 'soal']
        : ['judul', 'soal'];

    updatableFields.forEach((field) => {
      if (updates[field] !== undefined) bank[field] = updates[field];
    });

    // Normalisasi + validasi basic saat admin update
    if (actor.role === 'admin') {
      if (bank.totalSoal !== null && bank.totalSoal !== undefined) {
        const n = Number(bank.totalSoal);
        if (!Number.isFinite(n) || n < 1) {
          return res.status(400).json({
            success: false,
            message: 'Total soal harus berupa angka minimal 1.',
          });
        }
        bank.totalSoal = n;
      }
      if (bank.tipe !== 'custom') {
        bank.customKuota = {};
      } else {
        const kuota = bank.customKuota && typeof bank.customKuota === 'object' ? bank.customKuota : {};
        const allowedKeys = [
          'pilihan_ganda',
          'pilihan_ganda_kompleks',
          'essay',
          'benar_salah',
          'menjodohkan',
        ];
        const entries = Object.entries(kuota).filter(([k]) => allowedKeys.includes(k));
        let sum = 0;
        for (const [, v] of entries) {
          const nn = Number(v);
          if (!Number.isFinite(nn) || nn < 0) {
            return res.status(400).json({
              success: false,
              message: 'Kuota custom harus berupa angka 0 atau lebih.',
            });
          }
          sum += nn;
        }
        if (bank.totalSoal !== null && bank.totalSoal !== undefined && sum > Number(bank.totalSoal)) {
          return res.status(400).json({
            success: false,
            message: `Total kuota custom (${sum}) tidak boleh melebihi Total Soal (${bank.totalSoal}).`,
          });
        }
        bank.customKuota = kuota;
      }
    }

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
    const actor = req.user;
    if (!actor) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
      });
    }

    const bank = await CBTBankSoal.findOne({ id });
    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Bank soal CBT tidak ditemukan',
      });
    }

    const isGlobal = !!parseGlobalCBTKelasId(bank.cbtKelasId);

    if (actor.role === 'guru') {
      // Guru tidak diperbolehkan menghapus bank global (terlalu berisiko).
      if (isGlobal) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki akses untuk menghapus bank soal global.',
        });
      }
      if (bank.guruId !== actor.id) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki akses untuk menghapus bank soal ini.',
        });
      }
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

