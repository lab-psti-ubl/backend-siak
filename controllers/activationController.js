import SystemActivation from '../models/SystemActivation.js';
import { hashPassword, comparePassword, isPasswordHashed } from '../utils/passwordUtils.js';

// Default activation code disimpan langsung sebagai hash bcrypt
const DEFAULT_ACTIVATION_CODE_HASH = '$2a$10$WXO7BLwVGiq6kQzmGa4heeHhm4B0GQbke1Vl8L4pUWne71jVdw6lq';

async function getOrCreateActivation() {
  let activation = await SystemActivation.findOne();
  if (!activation) {
    activation = new SystemActivation({
      id: 'system-activation-1',
      isSystemActive: false,
      activationCode: DEFAULT_ACTIVATION_CODE_HASH,
      createdAt: new Date().toISOString(),
    });
    await activation.save();
  }

  if (!activation.activationCode) {
    activation.activationCode = DEFAULT_ACTIVATION_CODE_HASH;
    await activation.save();
  } else if (!isPasswordHashed(activation.activationCode)) {
    const hashedCode = await hashPassword(activation.activationCode);
    activation.activationCode = hashedCode;
    await activation.save();
  }

  return activation;
}

export const getSystemActivation = async (req, res) => {
  try {
    const activation = await getOrCreateActivation();
    const obj = activation.toObject();
    // Mask activation code for response (hanya tampilkan 1 karakter pertama + **)
    if (obj.activationCode) {
      obj.activationCodeMasked = obj.activationCode.charAt(0) + '**';
    }
    delete obj.activationCode;
    return res.json({
      success: true,
      activation: obj,
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
        message: 'Kode aktivasi diperlukan',
      });
    }

    const activation = await getOrCreateActivation();
    let isValidCode = false;

    if (activation.activationCode && isPasswordHashed(activation.activationCode)) {
      isValidCode = await comparePassword(password, activation.activationCode);
    } else {
      const expectedCode = activation.activationCode;
      isValidCode = password === expectedCode;
      if (isValidCode) {
        const hashedCode = await hashPassword(expectedCode);
        activation.activationCode = hashedCode;
        await activation.save();
      }
    }

    if (!isValidCode) {
      return res.status(401).json({
        success: false,
        message: 'Kode aktivasi salah. Silakan coba lagi.',
      });
    }

    activation.isSystemActive = true;
    activation.activatedAt = new Date().toISOString();
    activation.activatedBy = adminId || 'admin';
    await activation.save();

    const obj = activation.toObject();
    if (obj.activationCode) {
      obj.activationCodeMasked = obj.activationCode.charAt(0) + '**';
    }
    delete obj.activationCode;

    return res.json({
      success: true,
      message: 'Sistem berhasil diaktifkan!',
      activation: obj,
    });
  } catch (error) {
    console.error('Activate system error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengaktifkan sistem',
    });
  }
};

export const deactivateSystem = async (req, res) => {
  try {
    const activation = await getOrCreateActivation();
    activation.isSystemActive = false;
    activation.activatedAt = undefined;
    activation.activatedBy = undefined;
    await activation.save();

    const obj = activation.toObject();
    if (obj.activationCode) {
      obj.activationCodeMasked = obj.activationCode.charAt(0) + '**';
    }
    delete obj.activationCode;

    return res.json({
      success: true,
      message: 'Sistem berhasil dinonaktifkan.',
      activation: obj,
    });
  } catch (error) {
    console.error('Deactivate system error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menonaktifkan sistem',
    });
  }
};

export const updateActivationCode = async (req, res) => {
  try {
    const { currentCode, newCode } = req.body;

    if (!currentCode || !newCode) {
      return res.status(400).json({
        success: false,
        message: 'Kode aktivasi saat ini dan kode baru harus diisi',
      });
    }

    if (newCode.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Kode aktivasi baru minimal 3 karakter',
      });
    }

    const activation = await getOrCreateActivation();
    let isValidCode = false;

    if (activation.activationCode && isPasswordHashed(activation.activationCode)) {
      isValidCode = await comparePassword(currentCode, activation.activationCode);
    } else {
      const expectedCode = activation.activationCode;
      isValidCode = currentCode === expectedCode;
      if (isValidCode) {
        const hashedCode = await hashPassword(expectedCode);
        activation.activationCode = hashedCode;
        await activation.save();
      }
    }

    if (!isValidCode) {
      return res.status(401).json({
        success: false,
        message: 'Kode aktivasi saat ini salah.',
      });
    }

    const hashedNewCode = await hashPassword(newCode);
    activation.activationCode = hashedNewCode;
    await activation.save();

    const obj = activation.toObject();
    obj.activationCodeMasked = newCode.charAt(0) + '**';
    delete obj.activationCode;

    return res.json({
      success: true,
      message: 'Kode aktivasi berhasil diubah.',
      activation: obj,
    });
  } catch (error) {
    console.error('Update activation code error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengubah kode aktivasi',
    });
  }
};

export const initializeSystemActivation = async (req, res) => {
  try {
    const activation = await getOrCreateActivation();
    const obj = activation.toObject();
    if (obj.activationCode) {
      obj.activationCodeMasked = obj.activationCode.charAt(0) + '**';
    }
    delete obj.activationCode;
    return res.json({
      success: true,
      activation: obj,
    });
  } catch (error) {
    console.error('Initialize system activation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menginisialisasi aktivasi sistem',
    });
  }
};

