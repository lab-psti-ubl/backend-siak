import PengaturanAbsen from '../models/PengaturanAbsen.js';

// Get all pengaturan absen
export const getAllPengaturanAbsen = async (req, res) => {
  try {
    let pengaturanAbsen = await PengaturanAbsen.find().sort({ createdAt: -1 });
    
    // If no pengaturan exists, return empty array
    // User must create pengaturan through UI (no hardcode default)
    if (pengaturanAbsen.length === 0) {
      return res.json({
        success: true,
        pengaturanAbsen: [],
      });
    }
    
    return res.json({
      success: true,
      pengaturanAbsen: pengaturanAbsen.map(p => p.toObject()),
    });
  } catch (error) {
    console.error('Get all pengaturan absen error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data pengaturan absen',
    });
  }
};

// Get active pengaturan absen
export const getActivePengaturanAbsen = async (req, res) => {
  try {
    let pengaturanAbsen = await PengaturanAbsen.findOne({ isActive: true });
    
    // If no active pengaturan exists, try to activate first one or return null
    if (!pengaturanAbsen) {
      const allPengaturan = await PengaturanAbsen.find();
      if (allPengaturan.length > 0) {
        // Has pengaturan but none is active, activate the first one
        pengaturanAbsen = allPengaturan[0];
        pengaturanAbsen.isActive = true;
        await pengaturanAbsen.save();
      }
      // If no pengaturan at all, return null (user must create through UI)
    }
    
    return res.json({
      success: true,
      pengaturanAbsen: pengaturanAbsen ? pengaturanAbsen.toObject() : null,
    });
  } catch (error) {
    console.error('Get active pengaturan absen error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil pengaturan absen aktif',
    });
  }
};

// Get single pengaturan absen by ID
export const getPengaturanAbsenById = async (req, res) => {
  try {
    const { id } = req.params;
    const pengaturanAbsen = await PengaturanAbsen.findOne({ id });
    
    if (!pengaturanAbsen) {
      return res.status(404).json({
        success: false,
        message: 'Pengaturan absen tidak ditemukan',
      });
    }
    
    return res.json({
      success: true,
      pengaturanAbsen: pengaturanAbsen.toObject(),
    });
  } catch (error) {
    console.error('Get pengaturan absen by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data pengaturan absen',
    });
  }
};

// Create or update pengaturan absen (single record only)
export const createPengaturanAbsen = async (req, res) => {
  try {
    const { jamMasuk, toleransiMasuk, jamPulang, toleransiPulang, hariSekolah, hariKerja, isActive } = req.body;

    // Validation
    if (!jamMasuk || toleransiMasuk === undefined || !jamPulang || toleransiPulang === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi',
      });
    }

    // Validate hari sekolah and hari kerja
    if (!hariSekolah || !Array.isArray(hariSekolah) || hariSekolah.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Pilih minimal 1 hari sekolah untuk murid',
      });
    }

    if (!hariKerja || !Array.isArray(hariKerja) || hariKerja.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Pilih minimal 1 hari kerja untuk guru',
      });
    }

    // Validate hari values (0-6)
    const validDays = [0, 1, 2, 3, 4, 5, 6];
    const invalidHariSekolah = hariSekolah.some(day => !validDays.includes(day));
    const invalidHariKerja = hariKerja.some(day => !validDays.includes(day));
    
    if (invalidHariSekolah || invalidHariKerja) {
      return res.status(400).json({
        success: false,
        message: 'Nilai hari tidak valid. Gunakan 0-6 (0=Minggu, 1=Senin, ..., 6=Sabtu)',
      });
    }

    // Check if pengaturan already exists
    let pengaturanAbsen = await PengaturanAbsen.findOne();

    if (pengaturanAbsen) {
      // Update existing
      pengaturanAbsen.jamMasuk = jamMasuk;
      pengaturanAbsen.toleransiMasuk = toleransiMasuk;
      pengaturanAbsen.jamPulang = jamPulang;
      pengaturanAbsen.toleransiPulang = toleransiPulang;
      pengaturanAbsen.hariSekolah = hariSekolah; // Always update, no fallback
      pengaturanAbsen.hariKerja = hariKerja; // Always update, no fallback
      pengaturanAbsen.isActive = isActive !== undefined ? isActive : true;

      await pengaturanAbsen.save();

      return res.json({
        success: true,
        message: 'Pengaturan absen berhasil diperbarui',
        pengaturanAbsen: pengaturanAbsen.toObject(),
      });
    } else {
      // Create new (only one record allowed)
      const newPengaturan = new PengaturanAbsen({
        id: 'pengaturan-absen-1',
        jamMasuk,
        toleransiMasuk,
        jamPulang,
        toleransiPulang,
        hariSekolah: hariSekolah, // Use provided value, no fallback
        hariKerja: hariKerja, // Use provided value, no fallback
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date().toISOString(),
      });

      await newPengaturan.save();

      return res.json({
        success: true,
        message: 'Pengaturan absen berhasil dibuat',
        pengaturanAbsen: newPengaturan.toObject(),
      });
    }
  } catch (error) {
    console.error('Create pengaturan absen error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat pengaturan absen',
    });
  }
};

// Update pengaturan absen (single record only)
export const updatePengaturanAbsen = async (req, res) => {
  try {
    const { id } = req.params;
    const { jamMasuk, toleransiMasuk, jamPulang, toleransiPulang, hariSekolah, hariKerja, isActive } = req.body;

    let pengaturanAbsen = await PengaturanAbsen.findOne({ id });
    
    // If not found by id, get the single record
    if (!pengaturanAbsen) {
      pengaturanAbsen = await PengaturanAbsen.findOne();
    }

    if (!pengaturanAbsen) {
      return res.status(404).json({
        success: false,
        message: 'Pengaturan absen tidak ditemukan',
      });
    }

    // Update fields
    if (jamMasuk !== undefined) pengaturanAbsen.jamMasuk = jamMasuk;
    if (toleransiMasuk !== undefined) pengaturanAbsen.toleransiMasuk = toleransiMasuk;
    if (jamPulang !== undefined) pengaturanAbsen.jamPulang = jamPulang;
    if (toleransiPulang !== undefined) pengaturanAbsen.toleransiPulang = toleransiPulang;
    if (hariSekolah !== undefined) pengaturanAbsen.hariSekolah = hariSekolah;
    if (hariKerja !== undefined) pengaturanAbsen.hariKerja = hariKerja;
    if (isActive !== undefined) pengaturanAbsen.isActive = isActive;

    await pengaturanAbsen.save();

    return res.json({
      success: true,
      message: 'Pengaturan absen berhasil diperbarui',
      pengaturanAbsen: pengaturanAbsen.toObject(),
    });
  } catch (error) {
    console.error('Update pengaturan absen error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui pengaturan absen',
    });
  }
};

// Delete pengaturan absen (not recommended, but kept for compatibility)
export const deletePengaturanAbsen = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pengaturanAbsen = await PengaturanAbsen.findOne({ id });
    
    if (!pengaturanAbsen) {
      return res.status(404).json({
        success: false,
        message: 'Pengaturan absen tidak ditemukan',
      });
    }

    // Don't allow deletion if it's the only record - recreate default instead
    const allPengaturan = await PengaturanAbsen.find();
    if (allPengaturan.length === 1) {
      // Don't reset to default - just keep existing values
      // User should update through UI if they want to change
      pengaturanAbsen.isActive = true;
      await pengaturanAbsen.save();
      
      return res.json({
        success: true,
        message: 'Pengaturan absen direset ke default',
        pengaturanAbsen: pengaturanAbsen.toObject(),
      });
    }

    await PengaturanAbsen.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Pengaturan absen berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete pengaturan absen error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus pengaturan absen',
    });
  }
};

