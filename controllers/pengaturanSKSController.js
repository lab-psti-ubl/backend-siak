import PengaturanSKS from '../models/PengaturanSKS.js';

// Get all pengaturan SKS
export const getAllPengaturanSKS = async (req, res) => {
  try {
    let pengaturanSKS = await PengaturanSKS.find().sort({ createdAt: -1 });
    
    // If no pengaturan exists, create default
    if (pengaturanSKS.length === 0) {
      const defaultPengaturan = new PengaturanSKS({
        id: 'pengaturan-sks-1',
        durasiPerSKS: 45,
        istirahatAntarSKS: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      await defaultPengaturan.save();
      pengaturanSKS = [defaultPengaturan];
    }
    
    return res.json({
      success: true,
      pengaturanSKS: pengaturanSKS.map(p => p.toObject()),
    });
  } catch (error) {
    console.error('Get all pengaturan SKS error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data pengaturan SKS',
    });
  }
};

// Get active pengaturan SKS
export const getActivePengaturanSKS = async (req, res) => {
  try {
    let pengaturanSKS = await PengaturanSKS.findOne({ isActive: true });
    
    // If no active pengaturan exists, create default
    if (!pengaturanSKS) {
      const allPengaturan = await PengaturanSKS.find();
      if (allPengaturan.length === 0) {
        // No pengaturan at all, create default
        pengaturanSKS = new PengaturanSKS({
          id: 'pengaturan-sks-1',
          durasiPerSKS: 45,
          istirahatAntarSKS: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
        });
        await pengaturanSKS.save();
      } else {
        // Has pengaturan but none is active, activate the first one
        pengaturanSKS = allPengaturan[0];
        pengaturanSKS.isActive = true;
        await pengaturanSKS.save();
      }
    }
    
    return res.json({
      success: true,
      pengaturanSKS: pengaturanSKS ? pengaturanSKS.toObject() : null,
    });
  } catch (error) {
    console.error('Get active pengaturan SKS error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil pengaturan SKS aktif',
    });
  }
};

// Get single pengaturan SKS by ID
export const getPengaturanSKSById = async (req, res) => {
  try {
    const { id } = req.params;
    const pengaturanSKS = await PengaturanSKS.findOne({ id });
    
    if (!pengaturanSKS) {
      return res.status(404).json({
        success: false,
        message: 'Pengaturan SKS tidak ditemukan',
      });
    }
    
    return res.json({
      success: true,
      pengaturanSKS: pengaturanSKS.toObject(),
    });
  } catch (error) {
    console.error('Get pengaturan SKS by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data pengaturan SKS',
    });
  }
};

// Create or update pengaturan SKS (single record only)
export const createPengaturanSKS = async (req, res) => {
  try {
    const { durasiPerSKS, istirahatAntarSKS, isActive } = req.body;

    // Validation
    if (durasiPerSKS === undefined || istirahatAntarSKS === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi',
      });
    }

    // Check if pengaturan already exists
    let pengaturanSKS = await PengaturanSKS.findOne();

    if (pengaturanSKS) {
      // Update existing
      pengaturanSKS.durasiPerSKS = durasiPerSKS;
      pengaturanSKS.istirahatAntarSKS = istirahatAntarSKS;
      pengaturanSKS.isActive = isActive !== undefined ? isActive : true;

      await pengaturanSKS.save();

      return res.json({
        success: true,
        message: 'Pengaturan SKS berhasil diperbarui',
        pengaturanSKS: pengaturanSKS.toObject(),
      });
    } else {
      // Create new (only one record allowed)
      const newPengaturan = new PengaturanSKS({
        id: 'pengaturan-sks-1',
        durasiPerSKS,
        istirahatAntarSKS,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date().toISOString(),
      });

      await newPengaturan.save();

      return res.json({
        success: true,
        message: 'Pengaturan SKS berhasil dibuat',
        pengaturanSKS: newPengaturan.toObject(),
      });
    }
  } catch (error) {
    console.error('Create pengaturan SKS error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat pengaturan SKS',
    });
  }
};

// Update pengaturan SKS (single record only)
export const updatePengaturanSKS = async (req, res) => {
  try {
    const { id } = req.params;
    const { durasiPerSKS, istirahatAntarSKS, isActive } = req.body;

    let pengaturanSKS = await PengaturanSKS.findOne({ id });
    
    // If not found by id, get the single record
    if (!pengaturanSKS) {
      pengaturanSKS = await PengaturanSKS.findOne();
    }

    if (!pengaturanSKS) {
      return res.status(404).json({
        success: false,
        message: 'Pengaturan SKS tidak ditemukan',
      });
    }

    // Update fields
    if (durasiPerSKS !== undefined) pengaturanSKS.durasiPerSKS = durasiPerSKS;
    if (istirahatAntarSKS !== undefined) pengaturanSKS.istirahatAntarSKS = istirahatAntarSKS;
    if (isActive !== undefined) pengaturanSKS.isActive = isActive;

    await pengaturanSKS.save();

    return res.json({
      success: true,
      message: 'Pengaturan SKS berhasil diperbarui',
      pengaturanSKS: pengaturanSKS.toObject(),
    });
  } catch (error) {
    console.error('Update pengaturan SKS error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui pengaturan SKS',
    });
  }
};

// Delete pengaturan SKS
export const deletePengaturanSKS = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pengaturanSKS = await PengaturanSKS.findOne({ id });
    
    if (!pengaturanSKS) {
      return res.status(404).json({
        success: false,
        message: 'Pengaturan SKS tidak ditemukan',
      });
    }

    await PengaturanSKS.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Pengaturan SKS berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete pengaturan SKS error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus pengaturan SKS',
    });
  }
};

