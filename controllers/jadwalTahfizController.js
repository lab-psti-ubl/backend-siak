import JadwalTahfiz from '../models/JadwalTahfiz.js';

// Ambil semua jadwal tahfiz (opsional filter kelasId/hari)
export const getAllJadwalTahfiz = async (req, res) => {
  try {
    const { kelasId, hari } = req.query;

    const query = {};
    if (kelasId) query.kelasId = kelasId;
    if (hari) query.hari = hari;

    const jadwalTahfiz = await JadwalTahfiz.find(query).sort({ hari: 1, jamMulai: 1 });

    return res.json({
      success: true,
      jadwalTahfiz: jadwalTahfiz.map((j) => j.toObject()),
      count: jadwalTahfiz.length,
    });
  } catch (error) {
    console.error('Get all jadwal tahfiz error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data jadwal tahfiz',
    });
  }
};

// Ambil jadwal tahfiz berdasarkan ID
export const getJadwalTahfizById = async (req, res) => {
  try {
    const { id } = req.params;
    const jadwalTahfiz = await JadwalTahfiz.findOne({ id });

    if (!jadwalTahfiz) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tahfiz tidak ditemukan',
      });
    }

    return res.json({
      success: true,
      jadwalTahfiz: jadwalTahfiz.toObject(),
    });
  } catch (error) {
    console.error('Get jadwal tahfiz by id error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data jadwal tahfiz',
    });
  }
};

// Tambah jadwal tahfiz baru
export const createJadwalTahfiz = async (req, res) => {
  try {
    const { kelasId, hari, jamMulai, jamSelesai } = req.body;

    if (!kelasId || !hari || !jamMulai || !jamSelesai) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi (kelas, hari, jam mulai, jam selesai)',
      });
    }

    if (jamMulai >= jamSelesai) {
      return res.status(400).json({
        success: false,
        message: 'Jam mulai harus lebih awal dari jam selesai',
      });
    }

    // Cek bentrok jadwal untuk kelas dan hari yang sama
    const existing = await JadwalTahfiz.find({ kelasId, hari });
    const hasOverlap = existing.some((jadwal) => {
      const start = jadwal.jamMulai;
      const end = jadwal.jamSelesai;
      return jamMulai < end && jamSelesai > start;
    });

    if (hasOverlap) {
      return res.status(400).json({
        success: false,
        message: 'Jadwal bentrok: kelas sudah memiliki jadwal pada rentang waktu tersebut',
      });
    }

    const now = new Date().toISOString();
    const newJadwal = new JadwalTahfiz({
      id: `jadwal-tahfiz-${Date.now()}`,
      kelasId,
      hari,
      jamMulai,
      jamSelesai,
      createdAt: now,
      updatedAt: now,
    });

    await newJadwal.save();

    return res.json({
      success: true,
      message: 'Jadwal tahfiz berhasil ditambahkan',
      jadwalTahfiz: newJadwal.toObject(),
    });
  } catch (error) {
    console.error('Create jadwal tahfiz error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan jadwal tahfiz',
    });
  }
};

// Perbarui jadwal tahfiz
export const updateJadwalTahfiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { kelasId, hari, jamMulai, jamSelesai } = req.body;

    const jadwalTahfiz = await JadwalTahfiz.findOne({ id });
    if (!jadwalTahfiz) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tahfiz tidak ditemukan',
      });
    }

    if (jamMulai && jamSelesai && jamMulai >= jamSelesai) {
      return res.status(400).json({
        success: false,
        message: 'Jam mulai harus lebih awal dari jam selesai',
      });
    }

    const newKelasId = kelasId || jadwalTahfiz.kelasId;
    const newHari = hari || jadwalTahfiz.hari;
    const newJamMulai = jamMulai || jadwalTahfiz.jamMulai;
    const newJamSelesai = jamSelesai || jadwalTahfiz.jamSelesai;

    // Cek bentrok (exclude jadwal ini)
    const existing = await JadwalTahfiz.find({
      kelasId: newKelasId,
      hari: newHari,
      id: { $ne: id },
    });
    const hasOverlap = existing.some(
      (item) => newJamMulai < item.jamSelesai && newJamSelesai > item.jamMulai
    );

    if (hasOverlap) {
      return res.status(400).json({
        success: false,
        message: 'Jadwal bentrok: kelas sudah memiliki jadwal pada rentang waktu tersebut',
      });
    }

    if (kelasId !== undefined) jadwalTahfiz.kelasId = kelasId;
    if (hari !== undefined) jadwalTahfiz.hari = hari;
    if (jamMulai !== undefined) jadwalTahfiz.jamMulai = jamMulai;
    if (jamSelesai !== undefined) jadwalTahfiz.jamSelesai = jamSelesai;
    jadwalTahfiz.updatedAt = new Date().toISOString();

    await jadwalTahfiz.save();

    return res.json({
      success: true,
      message: 'Jadwal tahfiz berhasil diperbarui',
      jadwalTahfiz: jadwalTahfiz.toObject(),
    });
  } catch (error) {
    console.error('Update jadwal tahfiz error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui jadwal tahfiz',
    });
  }
};

// Hapus jadwal tahfiz
export const deleteJadwalTahfiz = async (req, res) => {
  try {
    const { id } = req.params;

    const jadwalTahfiz = await JadwalTahfiz.findOne({ id });
    if (!jadwalTahfiz) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tahfiz tidak ditemukan',
      });
    }

    await JadwalTahfiz.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Jadwal tahfiz berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete jadwal tahfiz error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus jadwal tahfiz',
    });
  }
};

