import DataFaceRecognition from '../models/DataFaceRecognition.js';
import Guru from '../models/Guru.js';

/**
 * GET /api/data-face-recognition
 * Daftar status face recognition per guru.
 */
export const getListWithStatus = async (req, res) => {
  try {
    const gurus = await Guru.find().sort({ name: 1 }).lean();
    const records = await DataFaceRecognition.find().lean();
    const byGuruId = Object.fromEntries(records.map((r) => [r.guruId, r]));

    const list = gurus.map((g) => {
      const rec = byGuruId[g.id];
      const descriptors = Array.isArray(rec?.faceDescriptors) ? rec.faceDescriptors : [];
      const completed = descriptors.length > 0;
      return {
        id: g.id,
        name: g.name,
        nip: g.nip || '-',
        status: completed ? 'completed' : 'not_completed',
        registeredFacesCount: descriptors.length,
      };
    });

    return res.json({
      success: true,
      list,
      count: list.length,
    });
  } catch (error) {
    console.error('Get list face recognition error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data face recognition',
    });
  }
};

/**
 * GET /api/data-face-recognition/descriptors
 * Mengembalikan seluruh descriptor wajah guru untuk kebutuhan kiosk (face recognition).
 */
export const getAllDescriptors = async (req, res) => {
  try {
    const records = await DataFaceRecognition.find().lean();
    if (!records.length) {
      return res.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    const guruIds = records.map((r) => r.guruId);
    const gurus = await Guru.find({ id: { $in: guruIds } }).lean();
    const guruById = Object.fromEntries(gurus.map((g) => [g.id, g]));

    const data = records
      .map((rec) => {
        const guru = guruById[rec.guruId];
        if (!guru) return null;
        const faceDescriptors = Array.isArray(rec.faceDescriptors) ? rec.faceDescriptors : [];
        if (!faceDescriptors.length) return null;
        return {
          guruId: guru.id,
          name: guru.name,
          nip: guru.nip || '',
          faceDescriptors,
        };
      })
      .filter(Boolean);

    return res.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error('Get all face descriptors error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data descriptor wajah guru',
    });
  }
};

/**
 * GET /api/data-face-recognition/guru/:guruId
 * Detail face recognition untuk satu guru.
 */
export const getByGuruId = async (req, res) => {
  try {
    const { guruId } = req.params;
    const guru = await Guru.findOne({ id: guruId }).lean();
    if (!guru) {
      return res.status(404).json({
        success: false,
        message: 'Guru tidak ditemukan',
      });
    }

    const record = await DataFaceRecognition.findOne({ guruId }).lean();
    const faceDescriptors = Array.isArray(record?.faceDescriptors) ? record.faceDescriptors : [];

    return res.json({
      success: true,
      guru: {
        id: guru.id,
        name: guru.name,
        nip: guru.nip,
      },
      faceDescriptors,
      registeredFacesCount: faceDescriptors.length,
    });
  } catch (error) {
    console.error('Get face recognition by guru error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail face recognition',
    });
  }
};

/**
 * POST /api/data-face-recognition/register
 * Body: { guruId: string, faceDescriptors: string[] }
 * Menyimpan / mengupdate daftar descriptor wajah guru.
 */
export const registerFaces = async (req, res) => {
  try {
    const { guruId, faceDescriptors } = req.body;

    if (!guruId || typeof guruId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'guruId wajib dan harus string',
      });
    }

    if (!Array.isArray(faceDescriptors)) {
      return res.status(400).json({
        success: false,
        message: 'faceDescriptors wajib dan harus berupa array',
      });
    }

    // Array kosong = hapus semua data wajah
    if (faceDescriptors.length === 0) {
      const guru = await Guru.findOne({ id: guruId });
      if (!guru) {
        return res.status(404).json({
          success: false,
          message: 'Guru tidak ditemukan',
        });
      }
      await DataFaceRecognition.updateOne(
        { guruId },
        { $set: { faceDescriptors: [], updatedAt: new Date() } }
      );
      return res.json({
        success: true,
        message: 'Data wajah guru berhasil dihapus',
        guruId,
        registeredFacesCount: 0,
      });
    }

    const invalid = faceDescriptors.some((d) => typeof d !== 'string' || d.trim() === '');
    if (invalid) {
      return res.status(400).json({
        success: false,
        message: 'Setiap faceDescriptor harus berupa string base64 yang valid',
      });
    }

    const guru = await Guru.findOne({ id: guruId });
    if (!guru) {
      return res.status(404).json({
        success: false,
        message: 'Guru tidak ditemukan',
      });
    }

    await DataFaceRecognition.findOneAndUpdate(
      { guruId },
      {
        guruId,
        faceDescriptors,
        updatedAt: new Date(),
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: 'Data wajah guru berhasil disimpan',
      guruId,
      registeredFacesCount: faceDescriptors.length,
    });
  } catch (error) {
    console.error('Register faces error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal menyimpan data wajah guru',
    });
  }
};

