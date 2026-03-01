import mongoose from 'mongoose';
import PengaturanSistem from '../models/PengaturanSistem.js';
import SystemActivation from '../models/SystemActivation.js';
import { hashPassword, comparePassword, isPasswordHashed } from '../utils/passwordUtils.js';

export const getPengaturanSistem = async (req, res) => {
  try {
    const pengaturan = await PengaturanSistem.getSettings();
    if (!pengaturan) {
      return res.json({
        success: true,
        pengaturan: null,
      });
    }
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

// Hash default untuk kode aktivasi awal (berpasangan dengan sandi 'gst')
const DEFAULT_ACTIVATION_CODE_HASH = '$2a$10$WXO7BLwVGiq6kQzmGa4heeHhm4B0GQbke1Vl8L4pUWne71jVdw6lq';

export const updatePengaturanSistem = async (req, res) => {
  try {
    const {
      enableEarlyDeparture,
      language,
      systemType,
      activationPassword,
      isInitialSetup,
      footerCompanyName,
    } = req.body;

    // Get existing settings (may be null if not exists)
    let pengaturan = await PengaturanSistem.getSettings();
    
    // If no settings exist, create new one
    if (!pengaturan) {
      pengaturan = new PengaturanSistem({
        id: new mongoose.Types.ObjectId().toString(),
        enableEarlyDeparture: false,
        language: 'id',
        systemType: systemType || 'sekolah_umum_tahfiz',
        footerCompanyName: footerCompanyName || 'iSchola - Garnusa Studio Technologi',
      });
    }
    
    // If systemType is being changed, verify activation password (gunakan kode dari SystemActivation)
    if (systemType !== undefined && ['sekolah_umum', 'sekolah_umum_tahfiz', 'tahfiz'].includes(systemType)) {
      if (pengaturan.systemType !== systemType) {
        const isInitialSetupFlow = isInitialSetup === true || !pengaturan.systemType;
        
        if (!isInitialSetupFlow) {
          if (!activationPassword) {
            return res.status(400).json({
              success: false,
              message: 'Sandi aktivasi diperlukan untuk memindahkan sistem',
            });
          }

          const activation = await SystemActivation.findOne();
          let isValidActivationPassword = false;

          if (activation && activation.activationCode) {
            if (isPasswordHashed(activation.activationCode)) {
              isValidActivationPassword = await comparePassword(
                activationPassword,
                activation.activationCode
              );
            } else {
              const expectedCode = activation.activationCode;
              isValidActivationPassword = activationPassword === expectedCode;
              if (isValidActivationPassword) {
                const hashedCode = await hashPassword(expectedCode);
                activation.activationCode = hashedCode;
                await activation.save();
              }
            }
          } else {
            // Fallback ke hash default jika belum ada data aktivasi
            isValidActivationPassword = await comparePassword(
              activationPassword,
              DEFAULT_ACTIVATION_CODE_HASH
            );
          }

          if (!isValidActivationPassword) {
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
    if (typeof footerCompanyName === 'string') {
      pengaturan.footerCompanyName = footerCompanyName.trim() || 'iSchola - Garnusa Studio Technologi';
    }
    if (typeof req.body.cbtEnabled === 'boolean') {
      pengaturan.cbtEnabled = req.body.cbtEnabled;
    }
    if (typeof req.body.spmbEnabled === 'boolean') {
      pengaturan.spmbEnabled = req.body.spmbEnabled;
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
    if (!pengaturan) {
      return res.json({
        success: true,
        enableEarlyDeparture: false,
      });
    }
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
    if (!pengaturan) {
      return res.json({
        success: true,
        language: 'id',
      });
    }
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
    // Return null if no settings exist (for initial setup)
    if (!pengaturan) {
      return res.json({
        success: true,
        systemType: null,
      });
    }
    return res.json({
      success: true,
      systemType: pengaturan.systemType || null,
    });
  } catch (error) {
    console.error('Error getting system type:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil tipe sistem',
      error: error.message,
      systemType: null, // Return null on error to trigger setup
    });
  }
};

// Public endpoint: hanya untuk ambil nama perusahaan di footer
export const getFooterSettingsPublic = async (req, res) => {
  try {
    const pengaturan = await PengaturanSistem.getSettings();
    const footerCompanyName = pengaturan?.footerCompanyName || 'iSchola - Garnusa Studio Technologi';
    return res.json({
      success: true,
      footerCompanyName,
    });
  } catch (error) {
    console.error('Error getting footer settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil pengaturan footer',
      footerCompanyName: 'iSchola - Garnusa Studio Technologi',
    });
  }
};

// Public endpoint: hanya untuk mengubah nama perusahaan di footer
export const updateFooterCompanyNamePublic = async (req, res) => {
  try {
    const { footerCompanyName } = req.body;

    if (!footerCompanyName || typeof footerCompanyName !== 'string' || !footerCompanyName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nama perusahaan footer tidak boleh kosong',
      });
    }

    let pengaturan = await PengaturanSistem.getSettings();
    if (!pengaturan) {
      pengaturan = new PengaturanSistem({
        id: new mongoose.Types.ObjectId().toString(),
        enableEarlyDeparture: false,
        language: 'id',
        systemType: 'sekolah_umum_tahfiz',
        footerCompanyName: footerCompanyName.trim(),
      });
    } else {
      pengaturan.footerCompanyName = footerCompanyName.trim();
      pengaturan.updatedAt = new Date().toISOString();
    }

    await pengaturan.save();

    return res.json({
      success: true,
      message: 'Pengaturan footer berhasil diperbarui',
      footerCompanyName: pengaturan.footerCompanyName,
    });
  } catch (error) {
    console.error('Error updating footer settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui pengaturan footer',
    });
  }
};

// Public endpoint: ambil pengaturan CBT & SPMB (tanpa auth, seperti footer)
export const getCbtSpmbSettingsPublic = async (req, res) => {
  try {
    const pengaturan = await PengaturanSistem.getSettings();
    const cbtEnabled = pengaturan?.cbtEnabled !== false;
    const spmbEnabled = pengaturan?.spmbEnabled !== false;
    return res.json({
      success: true,
      cbtEnabled,
      spmbEnabled,
    });
  } catch (error) {
    console.error('Error getting CBT/SPMB settings:', error);
    return res.json({
      success: true,
      cbtEnabled: true,
      spmbEnabled: true,
    });
  }
};

// Public endpoint: ubah pengaturan CBT & SPMB (tanpa auth, seperti footer)
export const updateCbtSpmbSettingsPublic = async (req, res) => {
  try {
    const { cbtEnabled, spmbEnabled } = req.body;

    let pengaturan = await PengaturanSistem.getSettings();
    if (!pengaturan) {
      pengaturan = new PengaturanSistem({
        id: new mongoose.Types.ObjectId().toString(),
        enableEarlyDeparture: false,
        language: 'id',
        systemType: 'sekolah_umum_tahfiz',
        footerCompanyName: 'iSchola - Garnusa Studio Technologi',
        cbtEnabled: true,
        spmbEnabled: true,
      });
    }

    if (typeof cbtEnabled === 'boolean') {
      pengaturan.cbtEnabled = cbtEnabled;
    }
    if (typeof spmbEnabled === 'boolean') {
      pengaturan.spmbEnabled = spmbEnabled;
    }
    pengaturan.updatedAt = new Date().toISOString();

    await pengaturan.save();

    return res.json({
      success: true,
      message: 'Pengaturan CBT/SPMB berhasil diperbarui',
      cbtEnabled: pengaturan.cbtEnabled,
      spmbEnabled: pengaturan.spmbEnabled,
    });
  } catch (error) {
    console.error('Error updating CBT/SPMB settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui pengaturan CBT/SPMB',
    });
  }
};

