import AlatRFID from '../models/AlatRFID.js';

export const getAllAlatRFID = async (req, res) => {
  try {
    const alatRfid = await AlatRFID.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      alatRfid: alatRfid.map(a => a.toObject()),
    });
  } catch (error) {
    console.error('Error getting alat RFID:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data alat RFID',
      error: error.message,
    });
  }
};

export const getAlatRFIDById = async (req, res) => {
  try {
    const { id } = req.params;
    const alatRfid = await AlatRFID.findOne({ id });
    if (!alatRfid) {
      return res.status(404).json({
        success: false,
        message: 'Alat RFID tidak ditemukan',
      });
    }
    return res.json({
      success: true,
      alatRfid: alatRfid.toObject(),
    });
  } catch (error) {
    console.error('Error getting alat RFID:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data alat RFID',
      error: error.message,
    });
  }
};

export const getAlatRFIDByToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Parameter token diperlukan',
      });
    }
    const alatRfid = await AlatRFID.findOne({ token });
    if (!alatRfid) {
      return res.status(404).json({
        success: false,
        message: 'Alat RFID tidak ditemukan',
      });
    }
    return res.json({
      success: true,
      alatRfid: alatRfid.toObject(),
    });
  } catch (error) {
    console.error('Error getting alat RFID by token:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data alat RFID',
      error: error.message,
    });
  }
};

const generateToken = () => {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
};

export const createAlatRFID = async (req, res) => {
  try {
    const {
      id,
      namaAlat,
      lokasi,
      token,
      status,
    } = req.body;

    if (!namaAlat || !lokasi) {
      return res.status(400).json({
        success: false,
        message: 'Nama alat dan lokasi diperlukan',
      });
    }

    const finalToken = token || generateToken();
    const finalId = id || `alat-${Date.now()}`;

    // Check if token already exists
    const existingToken = await AlatRFID.findOne({ token: finalToken });
    if (existingToken) {
      return res.status(400).json({
        success: false,
        message: 'Token sudah digunakan',
      });
    }

    // Check if id already exists
    const existingId = await AlatRFID.findOne({ id: finalId });
    if (existingId) {
      return res.status(400).json({
        success: false,
        message: 'ID alat RFID sudah ada',
      });
    }

    const newAlat = new AlatRFID({
      id: finalId,
      namaAlat,
      lokasi,
      token: finalToken,
      status: status || 'aktif',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await newAlat.save();
    return res.status(201).json({
      success: true,
      message: 'Alat RFID berhasil dibuat',
      alatRfid: newAlat.toObject(),
    });
  } catch (error) {
    console.error('Error creating alat RFID:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat alat RFID',
      error: error.message,
    });
  }
};

export const updateAlatRFID = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const alatRfid = await AlatRFID.findOne({ id });
    if (!alatRfid) {
      return res.status(404).json({
        success: false,
        message: 'Alat RFID tidak ditemukan',
      });
    }

    // Prevent changing id
    delete updateData.id;

    // If token is being updated, check if it's unique
    if (updateData.token && updateData.token !== alatRfid.token) {
      const existingToken = await AlatRFID.findOne({ token: updateData.token });
      if (existingToken) {
        return res.status(400).json({
          success: false,
          message: 'Token sudah digunakan',
        });
      }
    }

    updateData.updatedAt = new Date().toISOString();

    await AlatRFID.updateOne({ id }, updateData);
    const updatedAlat = await AlatRFID.findOne({ id });

    return res.json({
      success: true,
      message: 'Alat RFID berhasil diperbarui',
      alatRfid: updatedAlat.toObject(),
    });
  } catch (error) {
    console.error('Error updating alat RFID:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui alat RFID',
      error: error.message,
    });
  }
};

export const deleteAlatRFID = async (req, res) => {
  try {
    const { id } = req.params;
    const alatRfid = await AlatRFID.findOne({ id });
    if (!alatRfid) {
      return res.status(404).json({
        success: false,
        message: 'Alat RFID tidak ditemukan',
      });
    }

    await AlatRFID.deleteOne({ id });
    return res.json({
      success: true,
      message: 'Alat RFID berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting alat RFID:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus alat RFID',
      error: error.message,
    });
  }
};

export const toggleStatusAlatRFID = async (req, res) => {
  try {
    const { id } = req.params;
    const alatRfid = await AlatRFID.findOne({ id });
    if (!alatRfid) {
      return res.status(404).json({
        success: false,
        message: 'Alat RFID tidak ditemukan',
      });
    }

    const newStatus = alatRfid.status === 'aktif' ? 'nonaktif' : 'aktif';
    await AlatRFID.updateOne(
      { id },
      { status: newStatus, updatedAt: new Date().toISOString() }
    );

    const updatedAlat = await AlatRFID.findOne({ id });
    return res.json({
      success: true,
      message: `Alat RFID berhasil ${newStatus === 'aktif' ? 'diaktifkan' : 'dinonaktifkan'}`,
      alatRfid: updatedAlat.toObject(),
    });
  } catch (error) {
    console.error('Error toggling status alat RFID:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah status alat RFID',
      error: error.message,
    });
  }
};

