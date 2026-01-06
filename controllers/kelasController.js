import Kelas from '../models/Kelas.js';
import Guru from '../models/Guru.js';
import Murid from '../models/Murid.js';
import Jurusan from '../models/Jurusan.js';
import { ensureRiwayatKelasWali } from '../utils/riwayatWaliKelasUtils.js';

// Get all kelas
export const getAllKelas = async (req, res) => {
  try {
    const { jurusanId, tingkat } = req.query;
    
    const query = {};
    if (jurusanId) query.jurusanId = jurusanId;
    if (tingkat) query.tingkat = parseInt(tingkat);
    
    const kelasList = await Kelas.find(query).sort({ tingkat: 1, name: 1 });
    
    return res.json({
      success: true,
      kelas: kelasList.map(k => k.toObject()),
      count: kelasList.length,
    });
  } catch (error) {
    console.error('Get all kelas error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data kelas',
    });
  }
};

// Get single kelas by ID
export const getKelasById = async (req, res) => {
  try {
    const { id } = req.params;
    const kelas = await Kelas.findOne({ id });
    
    if (!kelas) {
      return res.status(404).json({
        success: false,
        message: 'Kelas tidak ditemukan',
      });
    }
    
    return res.json({
      success: true,
      kelas: kelas.toObject(),
    });
  } catch (error) {
    console.error('Get kelas by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data kelas',
    });
  }
};

// Create new kelas
export const createKelas = async (req, res) => {
  try {
    const { name, tingkat, jurusanId, waliKelasId } = req.body;

    // Validation
    if (!name || !tingkat) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan tingkat kelas wajib diisi',
      });
    }

    // Check if name already exists
    const existingKelas = await Kelas.findOne({ name });
    if (existingKelas) {
      return res.status(400).json({
        success: false,
        message: 'Nama kelas sudah terdaftar',
      });
    }

    // Validate jurusan if provided
    if (jurusanId) {
      const jurusan = await Jurusan.findOne({ id: jurusanId });
      if (!jurusan) {
        return res.status(400).json({
          success: false,
          message: 'Jurusan tidak ditemukan',
        });
      }
    }

    // Validate wali kelas if provided
    if (waliKelasId) {
      const waliKelas = await Guru.findOne({ id: waliKelasId });
      if (!waliKelas) {
        return res.status(400).json({
          success: false,
          message: 'Guru wali kelas tidak ditemukan',
        });
      }
    }

    // Create new kelas
    const newKelas = new Kelas({
      id: `kelas${Date.now()}`,
      name,
      tingkat,
      jurusanId: jurusanId || undefined,
      waliKelasId: waliKelasId || undefined,
      createdAt: new Date().toISOString(),
    });

    await newKelas.save();

    // Update guru if wali kelas
    if (waliKelasId) {
      await Guru.updateOne(
        { id: waliKelasId },
        {
          isWaliKelas: true,
          kelasWali: newKelas.id,
        }
      );
      
      // Automatically add to riwayatKelasWali
      await ensureRiwayatKelasWali(waliKelasId, newKelas.id);
    }

    return res.json({
      success: true,
      message: 'Kelas berhasil ditambahkan',
      kelas: newKelas.toObject(),
    });
  } catch (error) {
    console.error('Create kelas error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan kelas',
    });
  }
};

// Update kelas
export const updateKelas = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, tingkat, jurusanId, waliKelasId } = req.body;

    const kelas = await Kelas.findOne({ id });
    if (!kelas) {
      return res.status(404).json({
        success: false,
        message: 'Kelas tidak ditemukan',
      });
    }

    // Check if name already exists (excluding current kelas)
    if (name && name !== kelas.name) {
      const existingKelas = await Kelas.findOne({ name });
      if (existingKelas) {
        return res.status(400).json({
          success: false,
          message: 'Nama kelas sudah terdaftar',
        });
      }
    }

    // Validate jurusan if provided
    if (jurusanId) {
      const jurusan = await Jurusan.findOne({ id: jurusanId });
      if (!jurusan) {
        return res.status(400).json({
          success: false,
          message: 'Jurusan tidak ditemukan',
        });
      }
    }

    // Handle wali kelas change
    const oldWaliKelasId = kelas.waliKelasId;
    
    // Remove old wali kelas assignment
    if (oldWaliKelasId && oldWaliKelasId !== waliKelasId) {
      await Guru.updateOne(
        { id: oldWaliKelasId },
        {
          isWaliKelas: false,
          $unset: { kelasWali: '' },
        }
      );
    }

    // Set new wali kelas
    if (waliKelasId) {
      const waliKelas = await Guru.findOne({ id: waliKelasId });
      if (!waliKelas) {
        return res.status(400).json({
          success: false,
          message: 'Guru wali kelas tidak ditemukan',
        });
      }
      
      await Guru.updateOne(
        { id: waliKelasId },
        {
          isWaliKelas: true,
          kelasWali: id,
        }
      );
      
      // Automatically add to riwayatKelasWali
      await ensureRiwayatKelasWali(waliKelasId, id);
    } else if (oldWaliKelasId) {
      // Remove wali kelas if not provided
      await Guru.updateOne(
        { id: oldWaliKelasId },
        {
          isWaliKelas: false,
          $unset: { kelasWali: '' },
        }
      );
    }

    // Update kelas data
    const updateData = {};
    if (name) updateData.name = name;
    if (tingkat) updateData.tingkat = tingkat;
    if (jurusanId !== undefined) updateData.jurusanId = jurusanId;
    if (waliKelasId !== undefined) updateData.waliKelasId = waliKelasId;

    await Kelas.updateOne({ id }, updateData);

    const updatedKelas = await Kelas.findOne({ id });

    return res.json({
      success: true,
      message: 'Kelas berhasil diperbarui',
      kelas: updatedKelas.toObject(),
    });
  } catch (error) {
    console.error('Update kelas error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui kelas',
    });
  }
};

// Delete kelas
export const deleteKelas = async (req, res) => {
  try {
    const { id } = req.params;

    const kelas = await Kelas.findOne({ id });
    if (!kelas) {
      return res.status(404).json({
        success: false,
        message: 'Kelas tidak ditemukan',
      });
    }

    // Check if kelas has murid
    const muridCount = await Murid.countDocuments({ kelasId: id, isActive: { $ne: false } });
    if (muridCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Kelas "${kelas.name}" masih memiliki ${muridCount} murid aktif. Pindahkan semua murid terlebih dahulu sebelum menghapus kelas.`,
      });
    }

    // Remove wali kelas assignment if exists
    if (kelas.waliKelasId) {
      await Guru.updateOne(
        { id: kelas.waliKelasId },
        {
          isWaliKelas: false,
          $unset: { kelasWali: '' },
        }
      );
    }

    await Kelas.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Kelas berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete kelas error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus kelas',
    });
  }
};

// Get kelas stats (murid count)
export const getKelasStats = async (req, res) => {
  try {
    const { id } = req.params;

    const muridCount = await Murid.countDocuments({
      kelasId: id,
      isActive: { $ne: false },
    });

    return res.json({
      success: true,
      stats: {
        muridCount,
      },
    });
  } catch (error) {
    console.error('Get kelas stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik kelas',
    });
  }
};

