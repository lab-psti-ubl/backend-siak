import JadwalPelajaran from '../models/JadwalPelajaran.js';

// Get all jadwal pelajaran
export const getAllJadwalPelajaran = async (req, res) => {
  try {
    const { kelasId, guruId, tahunAjaran, semester, hari } = req.query;
    
    const query = {};
    if (kelasId) query.kelasId = kelasId;
    if (guruId) query.guruId = guruId;
    if (tahunAjaran) query.tahunAjaran = tahunAjaran;
    if (semester) query.semester = parseInt(semester);
    if (hari) query.hari = hari;

    const jadwalPelajaran = await JadwalPelajaran.find(query).sort({ hari: 1, jamMulai: 1 });
    
    return res.json({
      success: true,
      jadwalPelajaran: jadwalPelajaran.map(j => j.toObject()),
      count: jadwalPelajaran.length,
    });
  } catch (error) {
    console.error('Get all jadwal pelajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data jadwal pelajaran',
    });
  }
};

// Get single jadwal pelajaran by ID
export const getJadwalPelajaranById = async (req, res) => {
  try {
    const { id } = req.params;
    const jadwalPelajaran = await JadwalPelajaran.findOne({ id });
    
    if (!jadwalPelajaran) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal pelajaran tidak ditemukan',
      });
    }
    
    return res.json({
      success: true,
      jadwalPelajaran: jadwalPelajaran.toObject(),
    });
  } catch (error) {
    console.error('Get jadwal pelajaran by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data jadwal pelajaran',
    });
  }
};

// Check for schedule conflicts
export const checkScheduleConflict = async (req, res) => {
  try {
    const {
      kelasId,
      guruId,
      hari,
      jamMulai,
      jamSelesai,
      tahunAjaran,
      semester,
      excludeId, // ID to exclude from conflict check (for updates)
    } = req.body;

    if (!kelasId || !guruId || !hari || !jamMulai || !jamSelesai || !tahunAjaran || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Semua parameter wajib diisi',
      });
    }

    const query = {
      hari,
      tahunAjaran,
      semester: parseInt(semester),
    };

    if (excludeId) {
      query.id = { $ne: excludeId };
    }

    // Find all jadwal on the same day, year, and semester
    const existingJadwal = await JadwalPelajaran.find(query);

    const conflicts = [];

    existingJadwal.forEach(jadwal => {
      const existingStart = jadwal.jamMulai;
      const existingEnd = jadwal.jamSelesai;
      
      // Check for time overlap
      const hasTimeOverlap = (jamMulai < existingEnd && jamSelesai > existingStart);
      
      if (hasTimeOverlap) {
        const isGuruConflict = jadwal.guruId === guruId;
        const isKelasConflict = jadwal.kelasId === kelasId;
        
        if (isGuruConflict || isKelasConflict) {
          conflicts.push({
            jadwalId: jadwal.id,
            type: isGuruConflict ? 'guru' : 'kelas',
            conflict: jadwal.toObject(),
          });
        }
      }
    });

    return res.json({
      success: true,
      hasConflict: conflicts.length > 0,
      conflicts,
    });
  } catch (error) {
    console.error('Check schedule conflict error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memeriksa konflik jadwal',
    });
  }
};

// Create new jadwal pelajaran
export const createJadwalPelajaran = async (req, res) => {
  try {
    const {
      kelasId,
      mataPelajaranId,
      guruId,
      hari,
      jamMulai,
      jamSelesai,
      semester,
      tahunAjaran,
    } = req.body;

    // Validation
    if (!kelasId || !mataPelajaranId || !guruId || !hari || !jamMulai || !jamSelesai || !semester || !tahunAjaran) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi',
      });
    }

    if (jamMulai >= jamSelesai) {
      return res.status(400).json({
        success: false,
        message: 'Jam mulai harus lebih awal dari jam selesai',
      });
    }

    // Check for conflicts
    const conflictQuery = {
      hari,
      tahunAjaran,
      semester: parseInt(semester),
    };

    const existingJadwal = await JadwalPelajaran.find(conflictQuery);

    for (const jadwal of existingJadwal) {
      const existingStart = jadwal.jamMulai;
      const existingEnd = jadwal.jamSelesai;
      
      const hasTimeOverlap = (jamMulai < existingEnd && jamSelesai > existingStart);
      
      if (hasTimeOverlap) {
        const isGuruConflict = jadwal.guruId === guruId;
        const isKelasConflict = jadwal.kelasId === kelasId;
        
        if (isGuruConflict || isKelasConflict) {
          return res.status(400).json({
            success: false,
            message: `Jadwal bentrok! ${isGuruConflict ? 'Guru' : 'Kelas'} sudah memiliki jadwal pada waktu yang sama`,
            conflict: jadwal.toObject(),
          });
        }
      }
    }

    // Create new jadwal pelajaran
    const newJadwalPelajaran = new JadwalPelajaran({
      id: `jadwal${Date.now()}`,
      kelasId,
      mataPelajaranId,
      guruId,
      hari,
      jamMulai,
      jamSelesai,
      semester: parseInt(semester),
      tahunAjaran,
    });

    await newJadwalPelajaran.save();

    return res.json({
      success: true,
      message: 'Jadwal pelajaran berhasil ditambahkan',
      jadwalPelajaran: newJadwalPelajaran.toObject(),
    });
  } catch (error) {
    console.error('Create jadwal pelajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan jadwal pelajaran',
    });
  }
};

// Update jadwal pelajaran
export const updateJadwalPelajaran = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      kelasId,
      mataPelajaranId,
      guruId,
      hari,
      jamMulai,
      jamSelesai,
      semester,
      tahunAjaran,
    } = req.body;

    const jadwalPelajaran = await JadwalPelajaran.findOne({ id });
    if (!jadwalPelajaran) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal pelajaran tidak ditemukan',
      });
    }

    // Validation
    if (jamMulai && jamSelesai && jamMulai >= jamSelesai) {
      return res.status(400).json({
        success: false,
        message: 'Jam mulai harus lebih awal dari jam selesai',
      });
    }

    // Check for conflicts (excluding current jadwal)
    const conflictQuery = {
      hari: hari || jadwalPelajaran.hari,
      tahunAjaran: tahunAjaran || jadwalPelajaran.tahunAjaran,
      semester: parseInt(semester || jadwalPelajaran.semester),
      id: { $ne: id },
    };

    const existingJadwal = await JadwalPelajaran.find(conflictQuery);

    const checkJamMulai = jamMulai || jadwalPelajaran.jamMulai;
    const checkJamSelesai = jamSelesai || jadwalPelajaran.jamSelesai;
    const checkGuruId = guruId || jadwalPelajaran.guruId;
    const checkKelasId = kelasId || jadwalPelajaran.kelasId;

    for (const jadwal of existingJadwal) {
      const existingStart = jadwal.jamMulai;
      const existingEnd = jadwal.jamSelesai;
      
      const hasTimeOverlap = (checkJamMulai < existingEnd && checkJamSelesai > existingStart);
      
      if (hasTimeOverlap) {
        const isGuruConflict = jadwal.guruId === checkGuruId;
        const isKelasConflict = jadwal.kelasId === checkKelasId;
        
        if (isGuruConflict || isKelasConflict) {
          return res.status(400).json({
            success: false,
            message: `Jadwal bentrok! ${isGuruConflict ? 'Guru' : 'Kelas'} sudah memiliki jadwal pada waktu yang sama`,
            conflict: jadwal.toObject(),
          });
        }
      }
    }

    // Update jadwal pelajaran data
    const updateData = {};
    if (kelasId) updateData.kelasId = kelasId;
    if (mataPelajaranId) updateData.mataPelajaranId = mataPelajaranId;
    if (guruId) updateData.guruId = guruId;
    if (hari) updateData.hari = hari;
    if (jamMulai) updateData.jamMulai = jamMulai;
    if (jamSelesai) updateData.jamSelesai = jamSelesai;
    if (semester) updateData.semester = parseInt(semester);
    if (tahunAjaran) updateData.tahunAjaran = tahunAjaran;

    await JadwalPelajaran.updateOne({ id }, updateData);

    const updatedJadwalPelajaran = await JadwalPelajaran.findOne({ id });

    return res.json({
      success: true,
      message: 'Jadwal pelajaran berhasil diperbarui',
      jadwalPelajaran: updatedJadwalPelajaran.toObject(),
    });
  } catch (error) {
    console.error('Update jadwal pelajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui jadwal pelajaran',
    });
  }
};

// Delete jadwal pelajaran
export const deleteJadwalPelajaran = async (req, res) => {
  try {
    const { id } = req.params;

    const jadwalPelajaran = await JadwalPelajaran.findOne({ id });
    if (!jadwalPelajaran) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal pelajaran tidak ditemukan',
      });
    }

    await JadwalPelajaran.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Jadwal pelajaran berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete jadwal pelajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus jadwal pelajaran',
    });
  }
};

