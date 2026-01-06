import GuruMapel from '../models/GuruMapel.js';

// Get all guru mapel
export const getAllGuruMapel = async (req, res) => {
  try {
    const { guruId, mataPelajaranId, isActive } = req.query;
    
    const query = {};
    if (guruId) query.guruId = guruId;
    if (mataPelajaranId) query.mataPelajaranId = mataPelajaranId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const guruMapel = await GuruMapel.find(query).sort({ createdAt: -1 });
    
    return res.json({
      success: true,
      guruMapel: guruMapel.map(gm => gm.toObject()),
      count: guruMapel.length,
    });
  } catch (error) {
    console.error('Get all guru mapel error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data guru mapel',
    });
  }
};

// Get single guru mapel by ID
export const getGuruMapelById = async (req, res) => {
  try {
    const { id } = req.params;
    const guruMapel = await GuruMapel.findOne({ id });
    
    if (!guruMapel) {
      return res.status(404).json({
        success: false,
        message: 'Guru mapel tidak ditemukan',
      });
    }
    
    return res.json({
      success: true,
      guruMapel: guruMapel.toObject(),
    });
  } catch (error) {
    console.error('Get guru mapel by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data guru mapel',
    });
  }
};

// Get guru mapel by guru ID (active only)
export const getGuruMapelByGuruId = async (req, res) => {
  try {
    const { guruId } = req.params;
    const guruMapel = await GuruMapel.find({ guruId, isActive: true }).sort({ createdAt: -1 });
    
    return res.json({
      success: true,
      guruMapel: guruMapel.map(gm => gm.toObject()),
      count: guruMapel.length,
    });
  } catch (error) {
    console.error('Get guru mapel by guru ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data guru mapel',
    });
  }
};

// Create new guru mapel
export const createGuruMapel = async (req, res) => {
  try {
    const {
      guruId,
      mataPelajaranId,
      isActive,
    } = req.body;

    // Validation
    if (!guruId || !mataPelajaranId) {
      return res.status(400).json({
        success: false,
        message: 'Guru ID dan mata pelajaran ID wajib diisi',
      });
    }

    // Check if combination already exists and is active
    const existingGuruMapel = await GuruMapel.findOne({
      guruId,
      mataPelajaranId,
      isActive: true,
    });
    if (existingGuruMapel) {
      return res.status(400).json({
        success: false,
        message: 'Guru mapel ini sudah terdaftar dan aktif',
      });
    }

    // Create new guru mapel
    const newGuruMapel = new GuruMapel({
      id: `guru-mapel-${guruId}-${mataPelajaranId}-${Date.now()}`,
      guruId,
      mataPelajaranId,
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
    });

    await newGuruMapel.save();

    return res.json({
      success: true,
      message: 'Guru mapel berhasil ditambahkan',
      guruMapel: newGuruMapel.toObject(),
    });
  } catch (error) {
    console.error('Create guru mapel error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan guru mapel',
    });
  }
};

// Update guru mapel assignments for a guru (bulk update)
export const updateGuruMapelAssignments = async (req, res) => {
  try {
    const { guruId } = req.params;
    const { mataPelajaranIds } = req.body;

    if (!Array.isArray(mataPelajaranIds)) {
      return res.status(400).json({
        success: false,
        message: 'mataPelajaranIds harus berupa array',
      });
    }

    // Deactivate all existing guru mapel for this guru
    await GuruMapel.updateMany(
      { guruId, isActive: true },
      { isActive: false }
    );

    // Create new active guru mapel entries
    const newGuruMapelEntries = mataPelajaranIds.map(mataPelajaranId => ({
      id: `guru-mapel-${guruId}-${mataPelajaranId}-${Date.now()}`,
      guruId,
      mataPelajaranId,
      isActive: true,
      createdAt: new Date().toISOString(),
    }));

    if (newGuruMapelEntries.length > 0) {
      await GuruMapel.insertMany(newGuruMapelEntries);
    }

    // Get all active guru mapel for this guru
    const activeGuruMapel = await GuruMapel.find({ guruId, isActive: true });

    return res.json({
      success: true,
      message: 'Guru mapel berhasil diperbarui',
      guruMapel: activeGuruMapel.map(gm => gm.toObject()),
      count: activeGuruMapel.length,
    });
  } catch (error) {
    console.error('Update guru mapel assignments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui guru mapel',
    });
  }
};

// Update single guru mapel
export const updateGuruMapel = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      isActive,
    } = req.body;

    const guruMapel = await GuruMapel.findOne({ id });
    if (!guruMapel) {
      return res.status(404).json({
        success: false,
        message: 'Guru mapel tidak ditemukan',
      });
    }

    // Update guru mapel data
    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;

    await GuruMapel.updateOne({ id }, updateData);

    const updatedGuruMapel = await GuruMapel.findOne({ id });

    return res.json({
      success: true,
      message: 'Guru mapel berhasil diperbarui',
      guruMapel: updatedGuruMapel.toObject(),
    });
  } catch (error) {
    console.error('Update guru mapel error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui guru mapel',
    });
  }
};

// Delete guru mapel
export const deleteGuruMapel = async (req, res) => {
  try {
    const { id } = req.params;

    const guruMapel = await GuruMapel.findOne({ id });
    if (!guruMapel) {
      return res.status(404).json({
        success: false,
        message: 'Guru mapel tidak ditemukan',
      });
    }

    await GuruMapel.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Guru mapel berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete guru mapel error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus guru mapel',
    });
  }
};

