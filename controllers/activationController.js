import SystemActivation from '../models/SystemActivation.js';

const GST_PASSWORD = 'gst';

export const getSystemActivation = async (req, res) => {
  try {
    let activation = await SystemActivation.findOne();

    if (!activation) {
      // Initialize if doesn't exist
      activation = new SystemActivation({
        id: 'system-activation-1',
        isSystemActive: false,
        createdAt: new Date().toISOString(),
      });
      await activation.save();
    }

    return res.json({
      success: true,
      activation: activation.toObject(),
    });
  } catch (error) {
    console.error('Get system activation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil status aktivasi sistem',
    });
  }
};

export const checkSystemActive = async (req, res) => {
  try {
    const activation = await SystemActivation.findOne();
    const isActive = activation ? activation.isSystemActive : false;

    return res.json({
      success: true,
      isSystemActive: isActive,
    });
  } catch (error) {
    console.error('Check system active error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memeriksa status aktivasi sistem',
    });
  }
};

export const activateSystem = async (req, res) => {
  try {
    const { password, adminId } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password diperlukan',
      });
    }

    if (password !== GST_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Sandi GST salah. Silakan coba lagi.',
      });
    }

    let activation = await SystemActivation.findOne();

    if (!activation) {
      activation = new SystemActivation({
        id: 'system-activation-1',
        isSystemActive: false,
        createdAt: new Date().toISOString(),
      });
    }

    activation.isSystemActive = true;
    activation.activatedAt = new Date().toISOString();
    activation.activatedBy = adminId || 'admin';

    await activation.save();

    return res.json({
      success: true,
      message: 'Sistem berhasil diaktifkan!',
      activation: activation.toObject(),
    });
  } catch (error) {
    console.error('Activate system error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengaktifkan sistem',
    });
  }
};

export const initializeSystemActivation = async (req, res) => {
  try {
    let activation = await SystemActivation.findOne();

    if (!activation) {
      activation = new SystemActivation({
        id: 'system-activation-1',
        isSystemActive: false,
        createdAt: new Date().toISOString(),
      });
      await activation.save();
    }

    return res.json({
      success: true,
      activation: activation.toObject(),
    });
  } catch (error) {
    console.error('Initialize system activation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menginisialisasi aktivasi sistem',
    });
  }
};

