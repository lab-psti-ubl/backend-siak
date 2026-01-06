import PengaturanIstirahat from '../models/PengaturanIstirahat.js';

// Get all pengaturan istirahat
export const getAllPengaturanIstirahat = async (req, res) => {
  try {
    let pengaturanIstirahat = await PengaturanIstirahat.find().sort({ createdAt: -1 });
    
    // If no pengaturan exists, create default
    if (pengaturanIstirahat.length === 0) {
      const defaultPengaturan = new PengaturanIstirahat({
        id: 'pengaturan-istirahat-1',
        jamMulai: '12:00',
        jamSelesai: '13:00',
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      await defaultPengaturan.save();
      pengaturanIstirahat = [defaultPengaturan];
    }
    
    return res.json({
      success: true,
      pengaturanIstirahat: pengaturanIstirahat.map(p => p.toObject()),
    });
  } catch (error) {
    console.error('Get all pengaturan istirahat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data pengaturan istirahat',
    });
  }
};

// Get active pengaturan istirahat
export const getActivePengaturanIstirahat = async (req, res) => {
  try {
    let pengaturanIstirahat = await PengaturanIstirahat.findOne({ isActive: true });
    
    // If no active pengaturan exists, create default
    if (!pengaturanIstirahat) {
      const allPengaturan = await PengaturanIstirahat.find();
      if (allPengaturan.length === 0) {
        // No pengaturan at all, create default
        pengaturanIstirahat = new PengaturanIstirahat({
          id: 'pengaturan-istirahat-1',
          jamMulai: '12:00',
          jamSelesai: '13:00',
          isActive: true,
          createdAt: new Date().toISOString(),
        });
        await pengaturanIstirahat.save();
      } else {
        // Has pengaturan but none is active, activate the first one
        pengaturanIstirahat = allPengaturan[0];
        pengaturanIstirahat.isActive = true;
        await pengaturanIstirahat.save();
      }
    }
    
    return res.json({
      success: true,
      pengaturanIstirahat: pengaturanIstirahat ? pengaturanIstirahat.toObject() : null,
    });
  } catch (error) {
    console.error('Get active pengaturan istirahat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil pengaturan istirahat aktif',
    });
  }
};

// Get single pengaturan istirahat by ID
export const getPengaturanIstirahatById = async (req, res) => {
  try {
    const { id } = req.params;
    const pengaturanIstirahat = await PengaturanIstirahat.findOne({ id });
    
    if (!pengaturanIstirahat) {
      return res.status(404).json({
        success: false,
        message: 'Pengaturan istirahat tidak ditemukan',
      });
    }
    
    return res.json({
      success: true,
      pengaturanIstirahat: pengaturanIstirahat.toObject(),
    });
  } catch (error) {
    console.error('Get pengaturan istirahat by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data pengaturan istirahat',
    });
  }
};

// Create or update pengaturan istirahat (single record only)
export const createPengaturanIstirahat = async (req, res) => {
  try {
    const { jamMulai, jamSelesai, isActive } = req.body;

    // Validation
    if (!jamMulai || !jamSelesai) {
      return res.status(400).json({
        success: false,
        message: 'Jam mulai dan jam selesai wajib diisi',
      });
    }

    // Check if pengaturan already exists
    let pengaturanIstirahat = await PengaturanIstirahat.findOne();

    if (pengaturanIstirahat) {
      // Update existing
      pengaturanIstirahat.jamMulai = jamMulai;
      pengaturanIstirahat.jamSelesai = jamSelesai;
      pengaturanIstirahat.isActive = isActive !== undefined ? isActive : true;

      await pengaturanIstirahat.save();

      return res.json({
        success: true,
        message: 'Pengaturan istirahat berhasil diperbarui',
        pengaturanIstirahat: pengaturanIstirahat.toObject(),
      });
    } else {
      // Create new (only one record allowed)
      const newPengaturan = new PengaturanIstirahat({
        id: 'pengaturan-istirahat-1',
        jamMulai,
        jamSelesai,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date().toISOString(),
      });

      await newPengaturan.save();

      return res.json({
        success: true,
        message: 'Pengaturan istirahat berhasil dibuat',
        pengaturanIstirahat: newPengaturan.toObject(),
      });
    }
  } catch (error) {
    console.error('Create pengaturan istirahat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat pengaturan istirahat',
    });
  }
};

// Update pengaturan istirahat (single record only)
export const updatePengaturanIstirahat = async (req, res) => {
  try {
    const { id } = req.params;
    const { jamMulai, jamSelesai, isActive } = req.body;

    let pengaturanIstirahat = await PengaturanIstirahat.findOne({ id });
    
    // If not found by id, get the single record
    if (!pengaturanIstirahat) {
      pengaturanIstirahat = await PengaturanIstirahat.findOne();
    }

    if (!pengaturanIstirahat) {
      return res.status(404).json({
        success: false,
        message: 'Pengaturan istirahat tidak ditemukan',
      });
    }

    // Update fields
    if (jamMulai !== undefined) pengaturanIstirahat.jamMulai = jamMulai;
    if (jamSelesai !== undefined) pengaturanIstirahat.jamSelesai = jamSelesai;
    if (isActive !== undefined) pengaturanIstirahat.isActive = isActive;

    await pengaturanIstirahat.save();

    return res.json({
      success: true,
      message: 'Pengaturan istirahat berhasil diperbarui',
      pengaturanIstirahat: pengaturanIstirahat.toObject(),
    });
  } catch (error) {
    console.error('Update pengaturan istirahat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui pengaturan istirahat',
    });
  }
};

// Delete pengaturan istirahat
export const deletePengaturanIstirahat = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pengaturanIstirahat = await PengaturanIstirahat.findOne({ id });
    
    if (!pengaturanIstirahat) {
      return res.status(404).json({
        success: false,
        message: 'Pengaturan istirahat tidak ditemukan',
      });
    }

    await PengaturanIstirahat.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Pengaturan istirahat berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete pengaturan istirahat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus pengaturan istirahat',
    });
  }
};

