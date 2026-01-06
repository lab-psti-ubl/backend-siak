import DataKepsek from '../models/DataKepsek.js';
import { hashPassword } from '../utils/passwordUtils.js';

// Get all data kepsek
export const getAllDataKepsek = async (req, res) => {
  try {
    const dataKepsek = await DataKepsek.find().sort({ createdAt: -1 });
    
    return res.json({
      success: true,
      dataKepsek: dataKepsek.map(d => d.toObject()),
    });
  } catch (error) {
    console.error('Get all data kepsek error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data kepala sekolah',
    });
  }
};

// Get single data kepsek by ID
export const getDataKepsekById = async (req, res) => {
  try {
    const { id } = req.params;
    const dataKepsek = await DataKepsek.findOne({ id });
    
    if (!dataKepsek) {
      return res.status(404).json({
        success: false,
        message: 'Data kepala sekolah tidak ditemukan',
      });
    }
    
    return res.json({
      success: true,
      dataKepsek: dataKepsek.toObject(),
    });
  } catch (error) {
    console.error('Get data kepsek by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data kepala sekolah',
    });
  }
};

// Create new data kepsek
export const createDataKepsek = async (req, res) => {
  try {
    const { nama, email, password, nip, noHP } = req.body;

    // Validation
    if (!nama || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan password wajib diisi',
      });
    }

    // Check if email already exists
    const existingKepsek = await DataKepsek.findOne({ email });
    if (existingKepsek) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar',
      });
    }

    // Hash password before saving
    const hashedPassword = await hashPassword(password);

    const newDataKepsek = new DataKepsek({
      id: `kepsek-${Date.now()}`,
      nama,
      email,
      password: hashedPassword,
      nip,
      noHP,
      createdAt: new Date().toISOString(),
    });

    await newDataKepsek.save();

    return res.json({
      success: true,
      message: 'Data kepala sekolah berhasil dibuat',
      dataKepsek: newDataKepsek.toObject(),
    });
  } catch (error) {
    console.error('Create data kepsek error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat data kepala sekolah',
    });
  }
};

// Update data kepsek
export const updateDataKepsek = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, email, password, nip, noHP } = req.body;

    const dataKepsek = await DataKepsek.findOne({ id });
    
    if (!dataKepsek) {
      return res.status(404).json({
        success: false,
        message: 'Data kepala sekolah tidak ditemukan',
      });
    }

    // Check if email is being changed and already exists
    if (email && email !== dataKepsek.email) {
      const existingKepsek = await DataKepsek.findOne({ email });
      if (existingKepsek) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar',
        });
      }
    }

    // Update fields
    if (nama !== undefined) dataKepsek.nama = nama;
    if (email !== undefined) dataKepsek.email = email;
    if (password !== undefined) {
      // Hash password before updating
      dataKepsek.password = await hashPassword(password);
    }
    if (nip !== undefined) dataKepsek.nip = nip;
    if (noHP !== undefined) dataKepsek.noHP = noHP;

    await dataKepsek.save();

    return res.json({
      success: true,
      message: 'Data kepala sekolah berhasil diperbarui',
      dataKepsek: dataKepsek.toObject(),
    });
  } catch (error) {
    console.error('Update data kepsek error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui data kepala sekolah',
    });
  }
};

// Delete data kepsek
export const deleteDataKepsek = async (req, res) => {
  try {
    const { id } = req.params;
    
    const dataKepsek = await DataKepsek.findOne({ id });
    
    if (!dataKepsek) {
      return res.status(404).json({
        success: false,
        message: 'Data kepala sekolah tidak ditemukan',
      });
    }

    await DataKepsek.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Data kepala sekolah berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete data kepsek error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus data kepala sekolah',
    });
  }
};


