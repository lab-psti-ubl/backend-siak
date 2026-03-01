import Murid from '../models/Murid.js';
import Kelas from '../models/Kelas.js';
import { hashPassword, comparePassword } from '../utils/passwordUtils.js';
import { isEmailUnique, isRfidGuidUnique } from '../utils/validationUtils.js';

// Generate QR code data (same format as frontend - just returns NISN as string)
const generateQRCodeData = (id, nisn, name, kelasId) => {
  // Frontend format: just returns NISN as string
  return (nisn || '').trim();
};

// Get all murid
export const getAllMurid = async (req, res) => {
  try {
    const { kelasId, search, status } = req.query;
    
    const query = {};
    if (kelasId) query.kelasId = kelasId;
    if (status === 'active') query.isActive = { $ne: false };
    if (status === 'inactive') query.isActive = false;
    
    let muridList = await Murid.find(query).sort({ name: 1 });
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      muridList = muridList.filter(m => 
        m.name.toLowerCase().includes(searchLower) ||
        m.email.toLowerCase().includes(searchLower) ||
        (m.nisn && m.nisn.toLowerCase().includes(searchLower))
      );
    }
    
    return res.json({
      success: true,
      murid: muridList.map(m => {
        const muridObj = m.toObject();
        muridObj.role = 'murid'; // Ensure role is set for backward compatibility
        return muridObj;
      }),
      count: muridList.length,
    });
  } catch (error) {
    console.error('Get all murid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data murid',
    });
  }
};

// Get single murid by ID
export const getMuridById = async (req, res) => {
  try {
    const { id } = req.params;
    const murid = await Murid.findOne({ id });
    
    if (!murid) {
      return res.status(404).json({
        success: false,
        message: 'Murid tidak ditemukan',
      });
    }
    
    const muridObj = murid.toObject();
    muridObj.role = 'murid'; // Ensure role is set for backward compatibility
    
    return res.json({
      success: true,
      murid: muridObj,
    });
  } catch (error) {
    console.error('Get murid by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data murid',
    });
  }
};

// Create new murid
export const createMurid = async (req, res) => {
  try {
    const {
      name,
      email,
      nisn,
      password,
      kelasId,
      whatsappOrtu,
      rfidGuid,
      profileImage,
    } = req.body;

    // Validation
    if (!name || !email || !nisn || !kelasId) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, NISN, dan kelas wajib diisi',
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

    // Check if NISN already exists
    const existingNISN = await Murid.findOne({ nisn });
    if (existingNISN) {
      return res.status(400).json({
        success: false,
        message: 'NISN sudah terdaftar',
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

    // Validate kelas exists
    const kelas = await Kelas.findOne({ id: kelasId });
    if (!kelas) {
      return res.status(400).json({
        success: false,
        message: 'Kelas tidak ditemukan',
      });
    }

    // Generate QR code
    const newId = `murid${Date.now()}`;
    const qrCode = generateQRCodeData(newId, nisn, name, kelasId);

    // Hash password before saving
    const passwordToSave = password || 'cerdasdanreligius';
    const hashedPassword = await hashPassword(passwordToSave);

    // Create new murid
    const newMurid = new Murid({
      id: newId,
      name,
      email,
      nisn,
      password: hashedPassword,
      kelasId,
      qrCode,
      whatsappOrtu: whatsappOrtu || undefined,
      isActive: true,
      rfidGuid: rfidGuid || undefined,
      profileImage,
      createdAt: new Date().toISOString(),
    });

    await newMurid.save();

    const muridObj = newMurid.toObject();
    muridObj.role = 'murid'; // Ensure role is set for backward compatibility

    return res.json({
      success: true,
      message: 'Murid berhasil ditambahkan',
      murid: muridObj,
    });
  } catch (error) {
    console.error('Create murid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan murid',
    });
  }
};

// Update murid
export const updateMurid = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      nisn,
      password,
      currentPassword,
      kelasId,
      whatsappOrtu,
      rfidGuid,
      profileImage,
      isActive,
    } = req.body;

    const murid = await Murid.findOne({ id });
    if (!murid) {
      return res.status(404).json({
        success: false,
        message: 'Murid tidak ditemukan',
      });
    }

    // Check if email already exists (excluding current murid)
    if (email && email !== murid.email) {
      const emailUnique = await isEmailUnique(email, id);
      if (!emailUnique) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar',
        });
      }
    }

    // Check if NISN already exists (excluding current murid)
    if (nisn && nisn !== murid.nisn) {
      const existingNISN = await Murid.findOne({ nisn, id: { $ne: id } });
      if (existingNISN) {
        return res.status(400).json({
          success: false,
          message: 'NISN sudah terdaftar',
        });
      }
    }

    // Check if RFID GUID already exists (excluding current murid)
    // Hanya cek jika rfidGuid ada value (bukan null atau string kosong)
    const rfidGuidValue = typeof rfidGuid === 'string' ? rfidGuid.trim() : rfidGuid;
    if (rfidGuidValue && rfidGuidValue !== '' && rfidGuidValue !== murid.rfidGuid) {
      const rfidUnique = await isRfidGuidUnique(rfidGuidValue, id);
      if (!rfidUnique) {
        return res.status(400).json({
          success: false,
          message: 'GUID/RFID sudah terdaftar ke guru/murid lain',
        });
      }
    }

    // Validate kelas if changed
    if (kelasId && kelasId !== murid.kelasId) {
      const kelas = await Kelas.findOne({ id: kelasId });
      if (!kelas) {
        return res.status(400).json({
          success: false,
          message: 'Kelas tidak ditemukan',
        });
      }
      
      // Regenerate QR code if kelas changed
      const qrCode = generateQRCodeData(id, nisn || murid.nisn, name || murid.name, kelasId);
      req.body.qrCode = qrCode;
    }

    // Update murid data
    const updateData = {};
    const unsetData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (nisn) updateData.nisn = nisn;
    
    // If password is being changed, verify current password
    if (password) {
      if (currentPassword) {
        // Verify current password
        const isPasswordValid = await comparePassword(currentPassword, murid.password);
        if (!isPasswordValid) {
          return res.status(400).json({
            success: false,
            message: 'Password saat ini tidak benar',
          });
        }
      }
      // Hash new password before updating
      updateData.password = await hashPassword(password);
    }
    if (kelasId) updateData.kelasId = kelasId;
    if (whatsappOrtu !== undefined) updateData.whatsappOrtu = whatsappOrtu;
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
    if (isActive !== undefined) updateData.isActive = isActive;
    if (req.body.qrCode) updateData.qrCode = req.body.qrCode;

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
      await Murid.updateOne({ id }, updateOperation);
    }

    const updatedMurid = await Murid.findOne({ id });
    const muridObj = updatedMurid.toObject();
    muridObj.role = 'murid'; // Ensure role is set for backward compatibility

    return res.json({
      success: true,
      message: 'Murid berhasil diperbarui',
      murid: muridObj,
    });
  } catch (error) {
    console.error('Update murid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui murid',
    });
  }
};

// Delete murid
export const deleteMurid = async (req, res) => {
  try {
    const { id } = req.params;

    const murid = await Murid.findOne({ id });
    if (!murid) {
      return res.status(404).json({
        success: false,
        message: 'Murid tidak ditemukan',
      });
    }

    await Murid.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Murid berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete murid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus murid',
    });
  }
};

// Toggle murid status (active/inactive)
export const toggleMuridStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const murid = await Murid.findOne({ id });
    if (!murid) {
      return res.status(404).json({
        success: false,
        message: 'Murid tidak ditemukan',
      });
    }

    const newStatus = murid.isActive === false ? true : false;

    await Murid.updateOne({ id }, { isActive: newStatus });

    return res.json({
      success: true,
      message: `Murid berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
      isActive: newStatus,
    });
  } catch (error) {
    console.error('Toggle murid status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengubah status murid',
    });
  }
};

