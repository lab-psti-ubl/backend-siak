import PengaturanSistem from '../models/PengaturanSistem.js';

export const getPengaturanSistem = async (req, res) => {
  try {
    const pengaturan = await PengaturanSistem.getSettings();
    return res.json({
      success: true,
      pengaturan: pengaturan.toObject(),
    });
  } catch (error) {
    console.error('Error getting pengaturan sistem:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil pengaturan sistem',
      error: error.message,
    });
  }
};

const GST_PASSWORD = 'gst';

export const updatePengaturanSistem = async (req, res) => {
  try {
    const { enableEarlyDeparture, language, systemType, activationPassword, isInitialSetup } = req.body;

    // Get or create settings (will use getSettings which ensures only one document exists)
    let pengaturan = await PengaturanSistem.getSettings();
    
    // If systemType is being changed, verify activation password
    if (systemType !== undefined && ['sekolah_umum', 'sekolah_umum_tahfiz', 'tahfiz'].includes(systemType)) {
      // Check if system type is actually changing
      if (pengaturan.systemType !== systemType) {
        // Skip password requirement if this is initial setup (first time setting system type)
        // Also skip if current systemType is still the default value (initial setup)
        const isDefaultValue = pengaturan.systemType === 'sekolah_umum_tahfiz';
        const isInitialSetupFlow = isInitialSetup === true || isDefaultValue;
        
        if (!isInitialSetupFlow) {
          // Require activation password for system type change (not initial setup)
          if (!activationPassword) {
            return res.status(400).json({
              success: false,
              message: 'Sandi aktivasi diperlukan untuk memindahkan sistem',
            });
          }

          // Verify activation password
          if (activationPassword !== GST_PASSWORD) {
            return res.status(401).json({
              success: false,
              message: 'Sandi aktivasi salah. Silakan coba lagi.',
            });
          }
        }
      }
    }
    
    // Update existing
    if (enableEarlyDeparture !== undefined) {
      pengaturan.enableEarlyDeparture = enableEarlyDeparture;
    }
    if (language !== undefined && ['id', 'ms'].includes(language)) {
      pengaturan.language = language;
    }
    if (systemType !== undefined && ['sekolah_umum', 'sekolah_umum_tahfiz', 'tahfiz'].includes(systemType)) {
      pengaturan.systemType = systemType;
    }
    pengaturan.updatedAt = new Date().toISOString();

    await pengaturan.save();

    return res.json({
      success: true,
      message: 'Pengaturan sistem berhasil diperbarui',
      pengaturan: pengaturan.toObject(),
    });
  } catch (error) {
    console.error('Error updating pengaturan sistem:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui pengaturan sistem',
      error: error.message,
    });
  }
};

export const getEnableEarlyDeparture = async (req, res) => {
  try {
    const pengaturan = await PengaturanSistem.getSettings();
    return res.json({
      success: true,
      enableEarlyDeparture: pengaturan.enableEarlyDeparture,
    });
  } catch (error) {
    console.error('Error getting enableEarlyDeparture:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil pengaturan pulang cepat',
      error: error.message,
      enableEarlyDeparture: false, // Default value
    });
  }
};

export const getLanguage = async (req, res) => {
  try {
    const pengaturan = await PengaturanSistem.getSettings();
    return res.json({
      success: true,
      language: pengaturan.language || 'id',
    });
  } catch (error) {
    console.error('Error getting language:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil pengaturan bahasa',
      error: error.message,
      language: 'id', // Default value
    });
  }
};

export const getSystemType = async (req, res) => {
  try {
    const pengaturan = await PengaturanSistem.getSettings();
    return res.json({
      success: true,
      systemType: pengaturan.systemType || 'sekolah_umum_tahfiz',
    });
  } catch (error) {
    console.error('Error getting system type:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil tipe sistem',
      error: error.message,
      systemType: 'sekolah_umum_tahfiz', // Default value
    });
  }
};

