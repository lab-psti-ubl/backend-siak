import CBTUjianAttempt from '../models/CBTUjianAttempt.js';
import CBTUjian from '../models/CBTUjian.js';
import CBTBankSoal from '../models/CBTBankSoal.js';

// GET /api/cbt-ujian-attempts
export const getAllCBTUjianAttempt = async (req, res) => {
  try {
    const { ujianId, muridId } = req.query;

    const filter = {};
    if (ujianId) filter.ujianId = ujianId;
    if (muridId) filter.muridId = muridId;

    const list = await CBTUjianAttempt.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: list.map((a) => a.toObject()),
      count: list.length,
    });
  } catch (error) {
    console.error('Error getting CBT ujian attempts:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data attempt ujian CBT',
      error: error.message,
    });
  }
};

// POST /api/cbt-ujian-attempts/start
export const startCBTUjianAttempt = async (req, res) => {
  try {
    const { ujianId, muridId } = req.body;

    if (!ujianId || !muridId) {
      return res.status(400).json({
        success: false,
        message: 'Ujian dan murid wajib diisi untuk memulai attempt ujian CBT',
      });
    }

    // Jika attempt sudah ada, kembalikan attempt yang sama (resume)
    let attempt = await CBTUjianAttempt.findOne({ ujianId, muridId });
    if (attempt) {
      return res.json({
        success: true,
        message: 'Attempt ujian CBT ditemukan',
        data: attempt.toObject(),
      });
    }

    const ujian = await CBTUjian.findOne({ id: ujianId });
    if (!ujian) {
      return res.status(404).json({
        success: false,
        message: 'Ujian CBT tidak ditemukan',
      });
    }

    const now = new Date().toISOString();

    attempt = new CBTUjianAttempt({
      id: `cbt-attempt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ujianId: ujian.id,
      muridId,
      kelasId: ujian.kelasId,
      mataPelajaranId: ujian.mataPelajaranId,
      status: 'sedang',
      startedAt: now,
      finishedAt: null,
      durasiMenit: ujian.durasiMenit,
      skorAuto: 0,
      skorEssayManual: null,
      skorTotal: null,
      responses: [],
      createdAt: now,
      updatedAt: now,
    });

    await attempt.save();

    return res.json({
      success: true,
      message: 'Attempt ujian CBT berhasil dibuat',
      data: attempt.toObject(),
    });
  } catch (error) {
    console.error('Error starting CBT ujian attempt:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memulai attempt ujian CBT',
      error: error.message,
    });
  }
};

// PUT /api/cbt-ujian-attempts/:id
export const updateCBTUjianAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const { responses, submit } = req.body;

    const attempt = await CBTUjianAttempt.findOne({ id });
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt ujian CBT tidak ditemukan',
      });
    }

    const ujian = await CBTUjian.findOne({ id: attempt.ujianId });
    if (!ujian) {
      return res.status(404).json({
        success: false,
        message: 'Ujian CBT tidak ditemukan untuk attempt ini',
      });
    }

    if (attempt.status === 'selesai') {
      return res.status(400).json({
        success: false,
        message: 'Attempt ujian CBT sudah selesai dan tidak dapat diubah',
      });
    }

    if (Array.isArray(responses)) {
      attempt.responses = responses.map((r) => ({
        soalId: r.soalId,
        tipe: r.tipe,
        selectedOptionIds: r.selectedOptionIds || [],
        jawabanBoolean:
          typeof r.jawabanBoolean === 'boolean' ? r.jawabanBoolean : null,
        jawabanEssay: r.jawabanEssay || '',
        poinAuto: 0,
        isCorrectAuto: false,
        isCorrect: null,
      }));
    }

    // Jika belum submit, hanya simpan jawaban sementara
    if (!submit) {
      attempt.updatedAt = new Date().toISOString();
      await attempt.save();

      return res.json({
        success: true,
        message: 'Attempt ujian CBT berhasil disimpan',
        data: attempt.toObject(),
      });
    }

    // Saat submit, lakukan penilaian otomatis untuk soal non-essay

    const bankSoal = await CBTBankSoal.findOne({ id: ujian.bankSoalId });
    if (!bankSoal) {
      return res.status(404).json({
        success: false,
        message: 'Bank soal CBT untuk ujian ini tidak ditemukan',
      });
    }

    let totalAuto = 0;

    const soalMap = new Map();
    (bankSoal.soal || []).forEach((s) => {
      soalMap.set(s.id, s);
    });

    attempt.responses = attempt.responses.map((r) => {
      const soal = soalMap.get(r.soalId);
      if (!soal) return r;

      let poinAuto = 0;
      let isCorrectAuto = false;

      if (
        soal.tipe === 'pilihan_ganda' ||
        soal.tipe === 'pilihan_ganda_kompleks'
      ) {
        const kunci = Array.isArray(soal.jawabanBenar)
          ? soal.jawabanBenar
          : [];
        const jawaban = r.selectedOptionIds || [];
        if (
          kunci.length === jawaban.length &&
          kunci.every((id) => jawaban.includes(id))
        ) {
          isCorrectAuto = true;
          poinAuto = soal.poin || 0;
        }
      } else if (soal.tipe === 'benar_salah') {
        const kunci =
          typeof soal.jawabanBenar === 'boolean' ? soal.jawabanBenar : null;
        if (kunci !== null && r.jawabanBoolean === kunci) {
          isCorrectAuto = true;
          poinAuto = soal.poin || 0;
        }
      } else if (soal.tipe === 'essay') {
        // Essay dinilai manual oleh guru, biarkan poinAuto = 0
        isCorrectAuto = false;
        poinAuto = 0;
      } else {
        // Tipe lain (misal menjodohkan) belum dinilai otomatis
        isCorrectAuto = false;
        poinAuto = 0;
      }

      totalAuto += poinAuto;

      return {
        ...r.toObject ? r.toObject() : r,
        poinAuto,
        isCorrectAuto,
      };
    });

    const hasEssayInBank = (bankSoal.soal || []).some((s) => s.tipe === 'essay');

    attempt.skorAuto = totalAuto;
    // Jika ada essay, skor total menunggu penilaian manual oleh guru.
    attempt.skorTotal = hasEssayInBank ? null : totalAuto;
    attempt.status = 'selesai';
    attempt.finishedAt = new Date().toISOString();
    attempt.updatedAt = attempt.finishedAt;

    await attempt.save();

    return res.json({
      success: true,
      message: 'Attempt ujian CBT berhasil disubmit dan dinilai otomatis',
      data: attempt.toObject(),
    });
  } catch (error) {
    console.error('Error updating CBT ujian attempt:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui attempt ujian CBT',
      error: error.message,
    });
  }
};

// POST /api/cbt-ujian-attempts/reset
export const resetCBTUjianAttempt = async (req, res) => {
  try {
    const { ujianId, muridId } = req.body;

    if (!ujianId || !muridId) {
      return res.status(400).json({
        success: false,
        message: 'Ujian dan murid wajib diisi untuk reset attempt ujian CBT',
      });
    }

    const attempt = await CBTUjianAttempt.findOne({ ujianId, muridId });
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt ujian CBT tidak ditemukan untuk murid ini',
      });
    }

    const ujian = await CBTUjian.findOne({ id: ujianId });
    if (!ujian) {
      return res.status(404).json({
        success: false,
        message: 'Ujian CBT tidak ditemukan',
      });
    }

    const end = new Date(
      `${ujian.tanggalSelesai}T${ujian.jamSelesai || '23:59'}:59`
    );
    const now = new Date();

    if (now > end) {
      return res.status(400).json({
        success: false,
        message:
          'Waktu ujian sudah berakhir. Attempt tidak dapat di-reset lagi.',
      });
    }

    const nowIso = now.toISOString();
    attempt.status = 'sedang';
    attempt.startedAt = nowIso;
    attempt.finishedAt = null;
    attempt.skorAuto = 0;
    attempt.skorEssayManual = null;
    attempt.skorTotal = null;
    attempt.responses = [];
    attempt.updatedAt = nowIso;

    await attempt.save();

    return res.json({
      success: true,
      message: 'Attempt ujian CBT berhasil di-reset. Murid dapat mengerjakan ulang.',
      data: attempt.toObject(),
    });
  } catch (error) {
    console.error('Error resetting CBT ujian attempt:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mereset attempt ujian CBT',
      error: error.message,
    });
  }
};

// POST /api/cbt-ujian-attempts/allow-edit
export const allowEditCBTUjianAttempt = async (req, res) => {
  try {
    const { ujianId, muridId } = req.body;

    if (!ujianId || !muridId) {
      return res.status(400).json({
        success: false,
        message: 'Ujian dan murid wajib diisi untuk mengizinkan edit jawaban',
      });
    }

    const attempt = await CBTUjianAttempt.findOne({ ujianId, muridId });
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt ujian CBT tidak ditemukan untuk murid ini',
      });
    }

    const ujian = await CBTUjian.findOne({ id: ujianId });
    if (!ujian) {
      return res.status(404).json({
        success: false,
        message: 'Ujian CBT tidak ditemukan',
      });
    }

    if (!attempt.startedAt) {
      return res.status(400).json({
        success: false,
        message: 'Murid belum memulai ujian, tidak perlu mengizinkan edit.',
      });
    }

    const start = new Date(attempt.startedAt).getTime();
    const end = start + attempt.durasiMenit * 60 * 1000;
    const now = Date.now();

    if (now > end) {
      return res.status(400).json({
        success: false,
        message:
          'Durasi ujian murid sudah habis. Jawaban tidak dapat diedit lagi.',
      });
    }

    attempt.status = 'sedang';
    attempt.updatedAt = new Date().toISOString();
    await attempt.save();

    return res.json({
      success: true,
      message:
        'Murid diizinkan mengedit jawaban selama durasi ujian masih berlangsung.',
      data: attempt.toObject(),
    });
  } catch (error) {
    console.error('Error allowing edit CBT ujian attempt:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengizinkan edit jawaban ujian CBT',
      error: error.message,
    });
  }
};

// POST /api/cbt-ujian-attempts/grade-essay
// Digunakan guru untuk menilai soal essay secara manual setelah ujian selesai.
export const gradeEssayCBTUjianAttempt = async (req, res) => {
  try {
    const { attemptId, hasilEssay } = req.body;

    if (!attemptId || !Array.isArray(hasilEssay)) {
      return res.status(400).json({
        success: false,
        message:
          'attemptId dan array hasilEssay wajib diisi untuk penilaian essay.',
      });
    }

    const attempt = await CBTUjianAttempt.findOne({ id: attemptId });
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt ujian CBT tidak ditemukan',
      });
    }

    if (attempt.status !== 'selesai') {
      return res.status(400).json({
        success: false,
        message:
          'Penilaian essay hanya dapat dilakukan setelah murid menyelesaikan ujian.',
      });
    }

    const ujian = await CBTUjian.findOne({ id: attempt.ujianId });
    if (!ujian) {
      return res.status(404).json({
        success: false,
        message: 'Ujian CBT tidak ditemukan untuk attempt ini',
      });
    }

    const bankSoal = await CBTBankSoal.findOne({ id: ujian.bankSoalId });
    if (!bankSoal) {
      return res.status(404).json({
        success: false,
        message: 'Bank soal CBT untuk ujian ini tidak ditemukan',
      });
    }

    // Peta soalId -> detail soal
    const soalMap = new Map();
    (bankSoal.soal || []).forEach((s) => {
      soalMap.set(s.id, s);
    });

    // Peta soalId -> isCorrect (true/false) dari guru
    const hasilMap = new Map();
    hasilEssay.forEach((h) => {
      if (!h || !h.soalId) return;
      hasilMap.set(h.soalId, !!h.isCorrect);
    });

    let totalEssay = 0;

    // Simpan status benar/salah per response essay, dan hitung total poin essay manual
    attempt.responses = (attempt.responses || []).map((r) => {
      const soal = soalMap.get(r.soalId);
      if (!soal || soal.tipe !== 'essay') return r;

      const isCorrect = hasilMap.get(r.soalId);
      if (isCorrect === true) {
        totalEssay += soal.poin || 0;
      }
      return {
        ...(r.toObject ? r.toObject() : r),
        isCorrect: typeof isCorrect === 'boolean' ? isCorrect : null,
      };
    });

    attempt.skorEssayManual = totalEssay;
    attempt.skorTotal = (attempt.skorAuto || 0) + totalEssay;
    attempt.updatedAt = new Date().toISOString();

    await attempt.save();

    return res.json({
      success: true,
      message: 'Penilaian essay berhasil disimpan.',
      data: attempt.toObject(),
    });
  } catch (error) {
    console.error('Error grading essay CBT ujian attempt:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan penilaian essay ujian CBT',
      error: error.message,
    });
  }
};

