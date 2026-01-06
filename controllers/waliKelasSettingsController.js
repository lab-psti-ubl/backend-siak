import WaliKelasSettings from '../models/WaliKelasSettings.js';

export const getWaliKelasSettings = async (req, res) => {
  try {
    let settings = await WaliKelasSettings.findOne();
    
    // If no settings exist, create default
    if (!settings) {
      settings = new WaliKelasSettings({
        id: 'wali-kelas-settings-1',
        system: 'otomatis',
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      await settings.save();
    }
    
    return res.json({
      success: true,
      settings: settings.toObject(),
    });
  } catch (error) {
    console.error('Error getting wali kelas settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil pengaturan wali kelas',
      error: error.message,
    });
  }
};

export const saveWaliKelasSettings = async (req, res) => {
  try {
    const { system } = req.body;

    if (!system || !['otomatis', 'tetap', 'hapus'].includes(system)) {
      return res.status(400).json({
        success: false,
        message: 'Sistem harus salah satu dari: otomatis, tetap, hapus',
      });
    }

    let settings = await WaliKelasSettings.findOne();
    
    if (settings) {
      // Update existing
      settings.system = system;
      settings.lastUpdated = new Date().toISOString();
      await settings.save();
    } else {
      // Create new
      settings = new WaliKelasSettings({
        id: 'wali-kelas-settings-1',
        system,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      await settings.save();
    }

    return res.json({
      success: true,
      message: 'Pengaturan wali kelas berhasil disimpan',
      settings: settings.toObject(),
    });
  } catch (error) {
    console.error('Error saving wali kelas settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan pengaturan wali kelas',
      error: error.message,
    });
  }
};

