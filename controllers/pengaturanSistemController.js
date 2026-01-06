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

export const updatePengaturanSistem = async (req, res) => {
  try {
    const { enableEarlyDeparture } = req.body;

    let pengaturan = await PengaturanSistem.findOne({ id: 'pengaturan-sistem' });
    
    if (!pengaturan) {
      // Create if not exists
      pengaturan = new PengaturanSistem({
        id: 'pengaturan-sistem',
        enableEarlyDeparture: enableEarlyDeparture !== undefined ? enableEarlyDeparture : false,
      });
    } else {
      // Update existing
      if (enableEarlyDeparture !== undefined) {
        pengaturan.enableEarlyDeparture = enableEarlyDeparture;
      }
      pengaturan.updatedAt = new Date().toISOString();
    }

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

