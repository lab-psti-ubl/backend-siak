import Guru from '../models/Guru.js';
import Kelas from '../models/Kelas.js';
import { hashPassword, comparePassword } from '../utils/passwordUtils.js';
import { ensureRiwayatKelasWali } from '../utils/riwayatWaliKelasUtils.js';
import { isEmailUnique, isRfidGuidUnique } from '../utils/validationUtils.js';

// Get all gurus
export const getAllGurus = async (req, res) => {
  try {
    const gurus = await Guru.find().sort({ name: 1 });
    
    return res.json({
      success: true,
      gurus: gurus.map(g => {
        const guruObj = g.toObject();
        guruObj.role = 'guru'; // Ensure role is set for backward compatibility
        return guruObj;
      }),
      count: gurus.length,
    });
  } catch (error) {
    console.error('Get all gurus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data guru',
    });
  }
};

// Get single guru by ID
export const getGuruById = async (req, res) => {
  try {
    const { id } = req.params;
    const guru = await Guru.findOne({ id });
    
    if (!guru) {
      return res.status(404).json({
        success: false,
        message: 'Guru tidak ditemukan',
      });
    }
    
    const guruObj = guru.toObject();
    guruObj.role = 'guru'; // Ensure role is set for backward compatibility
    
    return res.json({
      success: true,
      guru: guruObj,
    });
  } catch (error) {
    console.error('Get guru by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data guru',
    });
  }
};

// Create new guru
export const createGuru = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      nip,
      password,
      subject,
      isWaliKelas,
      kelasWali,
      isActive,
      rfidGuid,
      profileImage,
    } = req.body;

    // Validation
    if (!name || !email || !nip) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan NIP wajib diisi',
      });
    }

    // Check if email already exists across all collections
    const emailUnique = await isEmailUnique(email);
    if (!emailUnique) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar',
      });
    }

    // Check if NIP already exists
    const existingNIP = await Guru.findOne({ nip });
    if (existingNIP) {
      return res.status(400).json({
        success: false,
        message: 'NIP sudah terdaftar',
      });
    }

    // Check if RFID GUID already exists across all collections
    if (rfidGuid) {
      const rfidUnique = await isRfidGuidUnique(rfidGuid);
      if (!rfidUnique) {
        return res.status(400).json({
          success: false,
          message: 'GUID/RFID sudah terdaftar ke guru/murid lain',
        });
      }
    }

    // Hash password before saving
    const passwordToSave = password || 'abc1234';
    const hashedPassword = await hashPassword(passwordToSave);

    // Create new guru
    const newGuru = new Guru({
      id: `guru${Date.now()}`,
      name,
      email,
      phone,
      nip,
      password: hashedPassword,
      subject,
      isWaliKelas: isWaliKelas || false,
      kelasWali: isWaliKelas ? kelasWali : undefined,
      isActive: isActive !== false,
      rfidGuid: rfidGuid || undefined,
      profileImage,
      createdAt: new Date().toISOString(),
    });

    await newGuru.save();

    // Update kelas if wali kelas
    if (isWaliKelas && kelasWali) {
      await Kelas.updateOne(
        { id: kelasWali },
        { waliKelasId: newGuru.id }
      );
      
      // Automatically add to riwayatKelasWali
      await ensureRiwayatKelasWali(newGuru.id, kelasWali);
    }

    // Refresh guru data to include riwayatKelasWali
    const refreshedGuru = await Guru.findOne({ id: newGuru.id });
    const guruObj = refreshedGuru.toObject();
    guruObj.role = 'guru'; // Ensure role is set for backward compatibility

    return res.json({
      success: true,
      message: 'Guru berhasil ditambahkan',
      guru: guruObj,
    });
  } catch (error) {
    console.error('Create guru error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan guru',
    });
  }
};

// Update guru
export const updateGuru = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      nip,
      password,
      subject,
      isWaliKelas,
      kelasWali,
      isActive,
      rfidGuid,
      profileImage,
      riwayatKelasWali,
    } = req.body;

    const guru = await Guru.findOne({ id });
    if (!guru) {
      return res.status(404).json({
        success: false,
        message: 'Guru tidak ditemukan',
      });
    }

    // Check if email already exists (excluding current guru)
    if (email && email !== guru.email) {
      const emailUnique = await isEmailUnique(email, id);
      if (!emailUnique) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar',
        });
      }
    }

    // Check if NIP already exists (excluding current guru)
    if (nip && nip !== guru.nip) {
      const existingNIP = await Guru.findOne({ nip, id: { $ne: id } });
      if (existingNIP) {
        return res.status(400).json({
          success: false,
          message: 'NIP sudah terdaftar',
        });
      }
    }

    // Check if RFID GUID already exists (excluding current guru)
    // Hanya cek jika rfidGuid ada value (bukan null atau string kosong)
    const rfidGuidValue = typeof rfidGuid === 'string' ? rfidGuid.trim() : rfidGuid;
    if (rfidGuidValue && rfidGuidValue !== '' && rfidGuidValue !== guru.rfidGuid) {
      const rfidUnique = await isRfidGuidUnique(rfidGuidValue, id);
      if (!rfidUnique) {
        return res.status(400).json({
          success: false,
          message: 'GUID/RFID sudah terdaftar ke guru/murid lain',
        });
      }
    }

    // Update guru data
    const updateData = {};
    const unsetData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (nip) updateData.nip = nip;
    if (password) {
      // Hash password before updating
      updateData.password = await hashPassword(password);
    }
    if (subject !== undefined) updateData.subject = subject;
    if (isWaliKelas !== undefined) updateData.isWaliKelas = isWaliKelas;
    if (kelasWali !== undefined) updateData.kelasWali = kelasWali;
    if (isActive !== undefined) updateData.isActive = isActive;
    // Handle rfidGuid: jika null atau string kosong, gunakan $unset untuk menghapus field
    // Ini mencegah duplicate key error pada sparse unique index
    if (rfidGuid !== undefined) {
      const rfidGuidValue = typeof rfidGuid === 'string' ? rfidGuid.trim() : rfidGuid;
      if (rfidGuidValue === null || rfidGuidValue === '') {
        unsetData.rfidGuid = '';
      } else {
        updateData.rfidGuid = rfidGuidValue;
      }
    }
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (riwayatKelasWali !== undefined) updateData.riwayatKelasWali = riwayatKelasWali;

    // Handle wali kelas changes
    const oldKelasWali = guru.kelasWali;
    const newKelasWali = isWaliKelas ? kelasWali : undefined;
    
    // Remove wali from old kelas if changed or no longer wali
    if (oldKelasWali && oldKelasWali !== newKelasWali) {
      await Kelas.updateOne(
        { id: oldKelasWali },
        { $unset: { waliKelasId: '' } }
      );
    }

    // Set wali to new kelas
    if (isWaliKelas && kelasWali) {
      // First, remove this guru as wali from any other kelas (in case)
      await Kelas.updateMany(
        { waliKelasId: id, id: { $ne: kelasWali } },
        { $unset: { waliKelasId: '' } }
      );
      
      // Then set wali to the new kelas
      await Kelas.updateOne(
        { id: kelasWali },
        { waliKelasId: id }
      );
      
      // Automatically add to riwayatKelasWali if not already exists
      await ensureRiwayatKelasWali(id, kelasWali);
    }

    // Build update operation
    const updateOperation = {};
    if (Object.keys(updateData).length > 0) {
      updateOperation.$set = updateData;
    }
    if (Object.keys(unsetData).length > 0) {
      updateOperation.$unset = unsetData;
    }

    // Only perform update if there's something to update
    if (Object.keys(updateOperation).length > 0) {
      await Guru.updateOne({ id }, updateOperation);
    }

    const updatedGuru = await Guru.findOne({ id });
    const guruObj = updatedGuru.toObject();
    guruObj.role = 'guru'; // Ensure role is set for backward compatibility

    return res.json({
      success: true,
      message: 'Guru berhasil diperbarui',
      guru: guruObj,
    });
  } catch (error) {
    console.error('Update guru error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui guru',
    });
  }
};

// Delete guru
export const deleteGuru = async (req, res) => {
  try {
    const { id } = req.params;

    const guru = await Guru.findOne({ id });
    if (!guru) {
      return res.status(404).json({
        success: false,
        message: 'Guru tidak ditemukan',
      });
    }

    // Remove wali kelas assignment if exists
    if (guru.kelasWali) {
      await Kelas.updateOne(
        { id: guru.kelasWali },
        { $unset: { waliKelasId: '' } }
      );
    }

    await Guru.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Guru berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete guru error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus guru',
    });
  }
};

// Update profil guru sendiri (untuk halaman profil guru)
export const updateProfilGuru = async (req, res) => {
  try {
    const userId = req.user.id; // Dari JWT token
    const {
      name,
      email,
      phone,
      profileImage,
    } = req.body;

    const guru = await Guru.findOne({ id: userId });
    if (!guru) {
      return res.status(404).json({
        success: false,
        message: 'Guru tidak ditemukan',
      });
    }

    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan email wajib diisi',
      });
    }

    // Check if email already exists (excluding current guru)
    if (email && email !== guru.email) {
      const emailUnique = await isEmailUnique(email, userId);
      if (!emailUnique) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar',
        });
      }
    }

    // Update hanya field yang diizinkan untuk update profil sendiri
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : undefined;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    await Guru.updateOne({ id: userId }, updateData);

    const updatedGuru = await Guru.findOne({ id: userId });

    const guruObj = updatedGuru.toObject();
    guruObj.role = 'guru'; // Ensure role is set for backward compatibility

    return res.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      guru: guruObj,
    });
  } catch (error) {
    console.error('Update profil guru error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui profil',
    });
  }
};

// Change password guru
export const changePasswordGuru = async (req, res) => {
  try {
    const userId = req.user.id; // Dari JWT token
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password saat ini dan password baru wajib diisi',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password baru minimal 6 karakter',
      });
    }

    const guru = await Guru.findOne({ id: userId });
    if (!guru) {
      return res.status(404).json({
        success: false,
        message: 'Guru tidak ditemukan',
      });
    }

    // Verify current password
    // Jika password di database sudah di-hash, gunakan comparePassword
    // Jika belum (legacy), bandingkan langsung
    const isPasswordValid = await comparePassword(currentPassword, guru.password);
    
    // Fallback untuk password legacy yang belum di-hash
    if (!isPasswordValid && guru.password === currentPassword) {
      // Password match (legacy), continue
    } else if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password saat ini tidak benar',
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await Guru.updateOne(
      { id: userId },
      { password: hashedPassword }
    );

    return res.json({
      success: true,
      message: 'Password berhasil diubah',
    });
  } catch (error) {
    console.error('Change password guru error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengubah password',
    });
  }
};

