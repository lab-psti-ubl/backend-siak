import PengaturanGrade from '../models/PengaturanGrade.js';

// Get all grade
export const getAllGrade = async (req, res) => {
  try {
    let grades = await PengaturanGrade.find().sort({ minNilai: 1 });
    
    // If no grade exists, create default
    if (grades.length === 0) {
      const defaultGrades = [
        { id: '1', grade: 'A', minNilai: 85, maxNilai: 100, deskripsi: 'Sangat Baik', isDefault: true, createdAt: new Date().toISOString() },
        { id: '2', grade: 'B', minNilai: 70, maxNilai: 84, deskripsi: 'Baik', isDefault: true, createdAt: new Date().toISOString() },
        { id: '3', grade: 'C', minNilai: 55, maxNilai: 69, deskripsi: 'Cukup', isDefault: true, createdAt: new Date().toISOString() },
        { id: '4', grade: 'D', minNilai: 40, maxNilai: 54, deskripsi: 'Kurang', isDefault: true, createdAt: new Date().toISOString() },
        { id: '5', grade: 'E', minNilai: 0, maxNilai: 39, deskripsi: 'Sangat Kurang', isDefault: true, createdAt: new Date().toISOString() },
      ];
      await PengaturanGrade.insertMany(defaultGrades);
      grades = await PengaturanGrade.find().sort({ minNilai: 1 });
    }
    
    return res.json({
      success: true,
      grades: grades.map(g => g.toObject()),
    });
  } catch (error) {
    console.error('Get all grade error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data grade',
    });
  }
};

// Get single grade by ID
export const getGradeById = async (req, res) => {
  try {
    const { id } = req.params;
    const grade = await PengaturanGrade.findOne({ id });
    
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade tidak ditemukan',
      });
    }
    
    return res.json({
      success: true,
      grade: grade.toObject(),
    });
  } catch (error) {
    console.error('Get grade by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data grade',
    });
  }
};

// Create new grade
export const createGrade = async (req, res) => {
  try {
    const { grade, minNilai, maxNilai, deskripsi, isDefault } = req.body;

    // Validation
    if (!grade || minNilai === undefined || maxNilai === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Grade, minNilai, dan maxNilai wajib diisi',
      });
    }

    if (minNilai < 0 || minNilai > 100 || maxNilai < 0 || maxNilai > 100) {
      return res.status(400).json({
        success: false,
        message: 'Min dan max nilai harus antara 0-100',
      });
    }

    if (minNilai > maxNilai) {
      return res.status(400).json({
        success: false,
        message: 'Min nilai tidak boleh lebih besar dari max nilai',
      });
    }

    const newGrade = new PengaturanGrade({
      id: `grade-${Date.now()}`,
      grade,
      minNilai,
      maxNilai,
      deskripsi,
      isDefault: isDefault || false,
      createdAt: new Date().toISOString(),
    });

    await newGrade.save();

    return res.json({
      success: true,
      message: 'Grade berhasil dibuat',
      grade: newGrade.toObject(),
    });
  } catch (error) {
    console.error('Create grade error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat grade',
    });
  }
};

// Update grade
export const updateGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, minNilai, maxNilai, deskripsi } = req.body;

    const gradeData = await PengaturanGrade.findOne({ id });
    
    if (!gradeData) {
      return res.status(404).json({
        success: false,
        message: 'Grade tidak ditemukan',
      });
    }

    // Validation
    if (minNilai !== undefined && maxNilai !== undefined) {
      if (minNilai > maxNilai) {
        return res.status(400).json({
          success: false,
          message: 'Min nilai tidak boleh lebih besar dari max nilai',
        });
      }
    }

    // Update fields
    if (grade !== undefined) gradeData.grade = grade;
    if (minNilai !== undefined) gradeData.minNilai = minNilai;
    if (maxNilai !== undefined) gradeData.maxNilai = maxNilai;
    if (deskripsi !== undefined) gradeData.deskripsi = deskripsi;

    await gradeData.save();

    return res.json({
      success: true,
      message: 'Grade berhasil diperbarui',
      grade: gradeData.toObject(),
    });
  } catch (error) {
    console.error('Update grade error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui grade',
    });
  }
};

// Delete grade
export const deleteGrade = async (req, res) => {
  try {
    const { id } = req.params;
    
    const grade = await PengaturanGrade.findOne({ id });
    
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade tidak ditemukan',
      });
    }

    // Don't allow deleting default grades
    if (grade.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Grade bawaan tidak dapat dihapus',
      });
    }

    await PengaturanGrade.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Grade berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete grade error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus grade',
    });
  }
};

// Bulk update grade (for saving all at once)
export const updateAllGrade = async (req, res) => {
  try {
    const { grades } = req.body;

    if (!Array.isArray(grades)) {
      return res.status(400).json({
        success: false,
        message: 'grades harus berupa array',
      });
    }

    // Validate grade ranges
    const sortedGrades = [...grades].sort((a, b) => a.minNilai - b.minNilai);
    
    // Check for overlaps
    for (let i = 0; i < sortedGrades.length - 1; i++) {
      const current = sortedGrades[i];
      const next = sortedGrades[i + 1];
      if (current.maxNilai >= next.minNilai) {
        return res.status(400).json({
          success: false,
          message: `Range grade ${current.grade} dan ${next.grade} tumpang tindih`,
        });
      }
    }

    // Check if starts from 0 and ends at 100
    if (sortedGrades.length > 0) {
      const first = sortedGrades[0];
      const last = sortedGrades[sortedGrades.length - 1];
      if (first.minNilai > 0) {
        return res.status(400).json({
          success: false,
          message: `Grade terendah harus dimulai dari nilai 0`,
        });
      }
      if (last.maxNilai < 100) {
        return res.status(400).json({
          success: false,
          message: `Grade tertinggi harus mencapai nilai 100`,
        });
      }
    }

    // Delete all existing
    await PengaturanGrade.deleteMany({});

    // Create new ones
    const newGrades = grades.map(g => ({
      id: g.id || `grade-${Date.now()}-${Math.random()}`,
      grade: g.grade,
      minNilai: g.minNilai,
      maxNilai: g.maxNilai,
      deskripsi: g.deskripsi,
      isDefault: g.isDefault || false,
      createdAt: g.createdAt || new Date().toISOString(),
    }));

    await PengaturanGrade.insertMany(newGrades);

    return res.json({
      success: true,
      message: 'Grade berhasil disimpan',
      grades: newGrades,
    });
  } catch (error) {
    console.error('Update all grade error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menyimpan grade',
    });
  }
};


