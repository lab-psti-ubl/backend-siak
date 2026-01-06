import PengaturanKomponenNilai from '../models/PengaturanKomponenNilai.js';

// Get all komponen nilai
export const getAllKomponenNilai = async (req, res) => {
  try {
    let komponenNilai = await PengaturanKomponenNilai.find().sort({ createdAt: 1 });
    
    // If no komponen nilai exists, create default
    if (komponenNilai.length === 0) {
      const defaultKomponenNilai = [
        { id: '1', nama: 'UTS', persentase: 25, isDefault: true, hasNilai: false, createdAt: new Date().toISOString() },
        { id: '2', nama: 'UAS', persentase: 25, isDefault: true, hasNilai: false, createdAt: new Date().toISOString() },
        { id: '3', nama: 'Tugas', persentase: 30, isDefault: true, hasNilai: true, createdAt: new Date().toISOString() },
        { id: '4', nama: 'Kehadiran', persentase: 20, isDefault: true, hasNilai: false, createdAt: new Date().toISOString() },
      ];
      await PengaturanKomponenNilai.insertMany(defaultKomponenNilai);
      komponenNilai = await PengaturanKomponenNilai.find().sort({ createdAt: 1 });
    }
    
    return res.json({
      success: true,
      komponenNilai: komponenNilai.map(k => k.toObject()),
    });
  } catch (error) {
    console.error('Get all komponen nilai error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data komponen nilai',
    });
  }
};

// Get single komponen nilai by ID
export const getKomponenNilaiById = async (req, res) => {
  try {
    const { id } = req.params;
    const komponenNilai = await PengaturanKomponenNilai.findOne({ id });
    
    if (!komponenNilai) {
      return res.status(404).json({
        success: false,
        message: 'Komponen nilai tidak ditemukan',
      });
    }
    
    return res.json({
      success: true,
      komponenNilai: komponenNilai.toObject(),
    });
  } catch (error) {
    console.error('Get komponen nilai by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data komponen nilai',
    });
  }
};

// Create new komponen nilai
export const createKomponenNilai = async (req, res) => {
  try {
    const { nama, persentase, isDefault, hasNilai } = req.body;

    // Validation
    if (!nama || persentase === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan persentase wajib diisi',
      });
    }

    if (persentase < 0 || persentase > 100) {
      return res.status(400).json({
        success: false,
        message: 'Persentase harus antara 0-100',
      });
    }

    // Check if nama already exists
    const existing = await PengaturanKomponenNilai.findOne({ 
      nama: { $regex: new RegExp(`^${nama}$`, 'i') } 
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Komponen dengan nama ini sudah ada',
      });
    }

    const newKomponen = new PengaturanKomponenNilai({
      id: `komponen-nilai-${Date.now()}`,
      nama,
      persentase,
      isDefault: isDefault || false,
      hasNilai: hasNilai || false,
      createdAt: new Date().toISOString(),
    });

    await newKomponen.save();

    return res.json({
      success: true,
      message: 'Komponen nilai berhasil dibuat',
      komponenNilai: newKomponen.toObject(),
    });
  } catch (error) {
    console.error('Create komponen nilai error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat komponen nilai',
    });
  }
};

// Update komponen nilai
export const updateKomponenNilai = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, persentase, hasNilai } = req.body;

    const komponenNilai = await PengaturanKomponenNilai.findOne({ id });
    
    if (!komponenNilai) {
      return res.status(404).json({
        success: false,
        message: 'Komponen nilai tidak ditemukan',
      });
    }

    // Don't allow updating default components
    if (komponenNilai.isDefault) {
      // Only allow updating persentase and hasNilai for default components
      if (nama && nama !== komponenNilai.nama) {
        return res.status(400).json({
          success: false,
          message: 'Nama komponen bawaan tidak dapat diubah',
        });
      }
    }

    // Check if nama is being changed and already exists
    if (nama && nama !== komponenNilai.nama) {
      const existing = await PengaturanKomponenNilai.findOne({ 
        nama: { $regex: new RegExp(`^${nama}$`, 'i') },
        id: { $ne: id }
      });
      
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Komponen dengan nama ini sudah ada',
        });
      }
    }

    // Update fields
    if (nama !== undefined && !komponenNilai.isDefault) komponenNilai.nama = nama;
    if (persentase !== undefined) {
      if (persentase < 0 || persentase > 100) {
        return res.status(400).json({
          success: false,
          message: 'Persentase harus antara 0-100',
        });
      }
      komponenNilai.persentase = persentase;
    }
    if (hasNilai !== undefined) komponenNilai.hasNilai = hasNilai;

    await komponenNilai.save();

    return res.json({
      success: true,
      message: 'Komponen nilai berhasil diperbarui',
      komponenNilai: komponenNilai.toObject(),
    });
  } catch (error) {
    console.error('Update komponen nilai error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui komponen nilai',
    });
  }
};

// Delete komponen nilai
export const deleteKomponenNilai = async (req, res) => {
  try {
    const { id } = req.params;
    
    const komponenNilai = await PengaturanKomponenNilai.findOne({ id });
    
    if (!komponenNilai) {
      return res.status(404).json({
        success: false,
        message: 'Komponen nilai tidak ditemukan',
      });
    }

    // Don't allow deleting default components
    if (komponenNilai.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Komponen bawaan tidak dapat dihapus',
      });
    }

    await PengaturanKomponenNilai.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Komponen nilai berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete komponen nilai error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus komponen nilai',
    });
  }
};

// Bulk update komponen nilai (for saving all at once)
export const updateAllKomponenNilai = async (req, res) => {
  try {
    const { komponenNilai } = req.body;

    if (!Array.isArray(komponenNilai)) {
      return res.status(400).json({
        success: false,
        message: 'komponenNilai harus berupa array',
      });
    }

    // Validate total persentase
    const totalPersentase = komponenNilai.reduce((sum, k) => sum + (k.persentase || 0), 0);
    if (totalPersentase !== 100) {
      return res.status(400).json({
        success: false,
        message: `Total persentase harus 100%, saat ini ${totalPersentase}%`,
      });
    }

    // Delete all existing
    await PengaturanKomponenNilai.deleteMany({});

    // Create new ones
    const newKomponen = komponenNilai.map(k => ({
      id: k.id || `komponen-nilai-${Date.now()}-${Math.random()}`,
      nama: k.nama,
      persentase: k.persentase,
      isDefault: k.isDefault || false,
      hasNilai: k.hasNilai || false,
      createdAt: k.createdAt || new Date().toISOString(),
    }));

    await PengaturanKomponenNilai.insertMany(newKomponen);

    return res.json({
      success: true,
      message: 'Komponen nilai berhasil disimpan',
      komponenNilai: newKomponen,
    });
  } catch (error) {
    console.error('Update all komponen nilai error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menyimpan komponen nilai',
    });
  }
};


