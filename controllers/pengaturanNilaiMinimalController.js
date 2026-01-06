import PengaturanNilaiMinimal from '../models/PengaturanNilaiMinimal.js';

// Get pengaturan nilai minimal (single record)
export const getPengaturanNilaiMinimal = async (req, res) => {
  try {
    let pengaturan = await PengaturanNilaiMinimal.findOne();
    
    // If not exists, create default
    if (!pengaturan) {
      pengaturan = new PengaturanNilaiMinimal({
        id: 'pengaturan-nilai-minimal-1',
        nilaiAkhirMinimal: 70,
        tingkatKehadiranMinimal: 75,
        createdAt: new Date().toISOString(),
      });
      await pengaturan.save();
    }
    
    return res.json({
      success: true,
      pengaturanNilaiMinimal: pengaturan.toObject(),
    });
  } catch (error) {
    console.error('Get pengaturan nilai minimal error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data pengaturan nilai minimal',
    });
  }
};

// Create or update pengaturan nilai minimal (single record only)
export const savePengaturanNilaiMinimal = async (req, res) => {
  try {
    const { nilaiAkhirMinimal, tingkatKehadiranMinimal } = req.body;

    // Validation
    if (nilaiAkhirMinimal === undefined || tingkatKehadiranMinimal === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nilai akhir minimal dan tingkat kehadiran minimal wajib diisi',
      });
    }

    if (nilaiAkhirMinimal < 0 || nilaiAkhirMinimal > 100) {
      return res.status(400).json({
        success: false,
        message: 'Nilai akhir minimal harus antara 0-100',
      });
    }

    if (tingkatKehadiranMinimal < 0 || tingkatKehadiranMinimal > 100) {
      return res.status(400).json({
        success: false,
        message: 'Tingkat kehadiran minimal harus antara 0-100',
      });
    }

    // Check if pengaturan already exists
    let pengaturan = await PengaturanNilaiMinimal.findOne();

    if (pengaturan) {
      // Update existing
      pengaturan.nilaiAkhirMinimal = nilaiAkhirMinimal;
      pengaturan.tingkatKehadiranMinimal = tingkatKehadiranMinimal;
      pengaturan.updatedAt = new Date().toISOString();

      await pengaturan.save();

      return res.json({
        success: true,
        message: 'Pengaturan nilai minimal berhasil diperbarui',
        pengaturanNilaiMinimal: pengaturan.toObject(),
      });
    } else {
      // Create new
      const newPengaturan = new PengaturanNilaiMinimal({
        id: 'pengaturan-nilai-minimal-1',
        nilaiAkhirMinimal,
        tingkatKehadiranMinimal,
        createdAt: new Date().toISOString(),
      });

      await newPengaturan.save();

      return res.json({
        success: true,
        message: 'Pengaturan nilai minimal berhasil dibuat',
        pengaturanNilaiMinimal: newPengaturan.toObject(),
      });
    }
  } catch (error) {
    console.error('Save pengaturan nilai minimal error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menyimpan pengaturan nilai minimal',
    });
  }
};


