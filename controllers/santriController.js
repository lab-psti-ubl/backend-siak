import Santri from '../models/Santri.js';
import Murid from '../models/Murid.js';
import { hashPassword } from '../utils/passwordUtils.js';
import { isEmailUnique, isRfidGuidUnique } from '../utils/validationUtils.js';

// Get all santri (with populated murid data and santriData)
export const getAllSantri = async (req, res) => {
  try {
    // Get or create single santri document
    let santriDoc = await Santri.findOne({ id: 'santri-single' });
    
    if (!santriDoc) {
      // Create initial document if it doesn't exist
      santriDoc = new Santri({
        id: 'santri-single',
        muridIds: [],
        santriData: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await santriDoc.save();
    }

    // Get murid IDs from muridIds array
    const muridIdList = santriDoc.muridIds.map(item => 
      typeof item === 'string' ? item : item.id
    );
    
    // Populate murid data
    const murids = await Murid.find({ id: { $in: muridIdList } });
    
    // Create a map of muridIds with their isActive status
    const muridStatusMap = new Map();
    santriDoc.muridIds.forEach(item => {
      const id = typeof item === 'string' ? item : item.id;
      const isActive = typeof item === 'string' ? true : (item.isActive !== false);
      muridStatusMap.set(id, isActive);
    });
    
    // Combine murids and santriData
    const allSantri = [
      // Data dari collection murid (yang ada di muridIds)
      ...murids.map(m => {
        const muridObj = m.toObject();
        muridObj.role = 'murid';
        muridObj.isFromMurid = true;
        // Override isActive dengan nilai dari santri collection
        muridObj.isActive = muridStatusMap.get(m.id) !== false;
        return muridObj;
      }),
      // Data dari santriData (santri yang tidak ada di collection murid)
      ...(santriDoc.santriData || []).map(s => {
        // Pastikan semua field yang diperlukan ada
        const santriObj = {
          id: s.id || `santri-${Date.now()}`,
          name: s.name || '',
          email: s.email || '',
          password: s.password,
          avatar: s.avatar || s.profileImage || undefined,
          profileImage: s.profileImage || s.avatar || undefined,
          nisn: s.nisn || '',
          kelasId: undefined, // Santri tidak punya kelasId
          qrCode: s.qrCode || undefined,
          whatsappOrtu: s.whatsappOrtu || undefined,
          isActive: s.isActive !== false,
          rfidGuid: s.rfidGuid || undefined,
          createdAt: s.createdAt || new Date().toISOString(),
          role: 'murid',
          isFromMurid: false,
        };
        return santriObj;
      })
    ];
    
    return res.json({
      success: true,
      santri: allSantri,
      count: allSantri.length,
    });
  } catch (error) {
    console.error('Get all santri error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data santri',
    });
  }
};

// Get available murid (murid that are not yet in santri)
export const getAvailableMurid = async (req, res) => {
  try {
    // Get santri document
    let santriDoc = await Santri.findOne({ id: 'santri-single' });
    
    if (!santriDoc) {
      // If no santri document exists, return all murid
      const allMurid = await Murid.find().sort({ name: 1 });
      return res.json({
        success: true,
        murid: allMurid.map(m => {
          const muridObj = m.toObject();
          muridObj.role = 'murid';
          return muridObj;
        }),
      });
    }

    // Get murid that are not in santri
    const availableMurid = await Murid.find({
      id: { $nin: santriDoc.muridIds }
    }).sort({ name: 1 });

    return res.json({
      success: true,
      murid: availableMurid.map(m => {
        const muridObj = m.toObject();
        muridObj.role = 'murid';
        return muridObj;
      }),
    });
  } catch (error) {
    console.error('Get available murid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data murid yang tersedia',
    });
  }
};

// Add santri (either from existing murid or create new santri)
export const addSantri = async (req, res) => {
  try {
    const {
      muridId, // If provided, use existing murid
      name,
      email,
      nisn,
      password,
      whatsappOrtu,
      isActive,
      rfidGuid,
      profileImage,
    } = req.body;

    let santriDoc = await Santri.findOne({ id: 'santri-single' });
    
    if (!santriDoc) {
      santriDoc = new Santri({
        id: 'santri-single',
        muridIds: [],
        santriData: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (muridId) {
      // Use existing murid
      const existingMurid = await Murid.findOne({ id: muridId });
      if (!existingMurid) {
        return res.status(404).json({
          success: false,
          message: 'Murid tidak ditemukan',
        });
      }

      // Check if murid is already in santri
      const existingIndex = santriDoc.muridIds.findIndex(item => {
        const id = typeof item === 'string' ? item : item.id;
        return id === muridId;
      });
      
      if (existingIndex >= 0) {
        return res.status(400).json({
          success: false,
          message: 'Murid ini sudah ditambahkan sebagai santri',
        });
      }

      // Add murid with isActive status
      santriDoc.muridIds.push({
        id: muridId,
        isActive: true, // Default active
      });
      santriDoc.updatedAt = new Date().toISOString();
      await santriDoc.save();

      // Get the added murid data
      const addedMurid = await Murid.findOne({ id: muridId });
      const muridObj = addedMurid.toObject();
      muridObj.role = 'murid';
      muridObj.isFromMurid = true;

      return res.json({
        success: true,
        message: 'Santri berhasil ditambahkan',
        santri: muridObj,
      });
    } else {
      // Create new santri (not from murid collection)
      if (!name || !email || !nisn) {
        return res.status(400).json({
          success: false,
          message: 'Nama, email, dan NISN wajib diisi',
        });
      }

      // Check if email already exists
      const emailUnique = await isEmailUnique(email);
      if (!emailUnique) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar',
        });
      }

      // Check if NISN already exists in murid or santri
      const existingNISNMurid = await Murid.findOne({ nisn });
      const existingNISNSantri = santriDoc.santriData.find(s => s.nisn === nisn);
      if (existingNISNMurid || existingNISNSantri) {
        return res.status(400).json({
          success: false,
          message: 'NISN sudah terdaftar',
        });
      }

      // Check if RFID GUID already exists
      if (rfidGuid) {
        const rfidUnique = await isRfidGuidUnique(rfidGuid);
        if (!rfidUnique) {
          return res.status(400).json({
            success: false,
            message: 'GUID/RFID sudah terdaftar ke guru/murid lain',
          });
        }
      }

      // Hash password
      const passwordToSave = password || 'abc1234';
      const hashedPassword = await hashPassword(passwordToSave);

      // Create new santri data
      const newSantriId = `santri${Date.now()}`;
      const newSantri = {
        id: newSantriId,
        name,
        email,
        password: hashedPassword,
        nisn,
        whatsappOrtu: whatsappOrtu || undefined,
        isActive: isActive !== false,
        rfidGuid: rfidGuid || undefined,
        profileImage: profileImage || undefined,
        createdAt: new Date().toISOString(),
      };

      santriDoc.santriData.push(newSantri);
      santriDoc.updatedAt = new Date().toISOString();
      await santriDoc.save();

      const santriObj = {
        ...newSantri,
        password: undefined, // Don't send password
        role: 'murid',
        isFromMurid: false,
      };

      return res.json({
        success: true,
        message: 'Santri berhasil ditambahkan',
        santri: santriObj,
      });
    }
  } catch (error) {
    console.error('Add santri error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan santri',
    });
  }
};

// Add all murid as santri
export const addAllMurid = async (req, res) => {
  try {
    let santriDoc = await Santri.findOne({ id: 'santri-single' });
    
    if (!santriDoc) {
      santriDoc = new Santri({
        id: 'santri-single',
        muridIds: [],
        santriData: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Get all murid
    const allMurid = await Murid.find();
    
    // Get existing murid IDs from santri
    const existingMuridIds = santriDoc.muridIds.map(item => 
      typeof item === 'string' ? item : item.id
    );
    
    // Filter out murid that are already in santri
    const newMuridData = allMurid
      .filter(m => !existingMuridIds.includes(m.id))
      .map(m => ({
        id: m.id,
        isActive: true, // Default active
      }));

    if (newMuridData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Semua murid sudah ditambahkan sebagai santri',
      });
    }

    // Add all new murid IDs with isActive
    santriDoc.muridIds.push(...newMuridData);
    santriDoc.updatedAt = new Date().toISOString();
    await santriDoc.save();

    // Get the added murids
    const newMuridIds = newMuridData.map(item => item.id);
    const addedMurids = await Murid.find({ id: { $in: newMuridIds } });
    const muridObjs = addedMurids.map(m => {
      const muridObj = m.toObject();
      muridObj.role = 'murid';
      muridObj.isFromMurid = true;
      return muridObj;
    });

    return res.json({
      success: true,
      message: `${newMuridData.length} santri berhasil ditambahkan`,
      santri: muridObjs,
      count: newMuridData.length,
    });
  } catch (error) {
    console.error('Add all murid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan semua murid sebagai santri',
    });
  }
};

// Update santri status (active/inactive)
export const updateSantriStatus = async (req, res) => {
  try {
    const { santriId } = req.params;
    const { isActive } = req.body;

    let santriDoc = await Santri.findOne({ id: 'santri-single' });
    
    if (!santriDoc) {
      return res.status(404).json({
        success: false,
        message: 'Data santri tidak ditemukan',
      });
    }

    // Check if it's from muridIds or santriData
    const muridIndex = santriDoc.muridIds.findIndex(item => {
      const id = typeof item === 'string' ? item : item.id;
      return id === santriId;
    });
    
    if (muridIndex >= 0) {
      // Update status in muridIds
      const item = santriDoc.muridIds[muridIndex];
      if (typeof item === 'string') {
        // Convert old format to new format
        santriDoc.muridIds[muridIndex] = {
          id: item,
          isActive: isActive !== false,
        };
      } else {
        santriDoc.muridIds[muridIndex].isActive = isActive !== false;
      }
    } else {
      // Update status in santriData
      const santriIndex = santriDoc.santriData.findIndex(s => s.id === santriId);
      if (santriIndex >= 0) {
        santriDoc.santriData[santriIndex].isActive = isActive !== false;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Santri tidak ditemukan',
        });
      }
    }

    santriDoc.updatedAt = new Date().toISOString();
    await santriDoc.save();

    return res.json({
      success: true,
      message: 'Status santri berhasil diperbarui',
    });
  } catch (error) {
    console.error('Update santri status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui status santri',
    });
  }
};

// Update santri (for standalone santri in santriData)
export const updateSantri = async (req, res) => {
  try {
    const { santriId } = req.params;
    const {
      name,
      email,
      nisn,
      password,
      whatsappOrtu,
      rfidGuid,
      isActive,
    } = req.body;

    let santriDoc = await Santri.findOne({ id: 'santri-single' });
    
    if (!santriDoc) {
      return res.status(404).json({
        success: false,
        message: 'Data santri tidak ditemukan',
      });
    }

    // Find santri in santriData (standalone santri)
    const santriIndex = santriDoc.santriData.findIndex(s => s.id === santriId);
    
    if (santriIndex < 0) {
      return res.status(404).json({
        success: false,
        message: 'Santri tidak ditemukan atau santri berasal dari collection murid. Gunakan update murid untuk mengedit.',
      });
    }

    const santri = santriDoc.santriData[santriIndex];

    // Check if email already exists (excluding current santri)
    if (email && email !== santri.email) {
      // Check in murid collection
      const existingMurid = await Murid.findOne({ email });
      if (existingMurid) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar',
        });
      }
      // Check in other santriData
      const existingSantri = santriDoc.santriData.find((s, idx) => idx !== santriIndex && s.email === email);
      if (existingSantri) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar',
        });
      }
    }

    // Check if NISN already exists (excluding current santri)
    if (nisn && nisn !== santri.nisn) {
      // Check in murid collection
      const existingMurid = await Murid.findOne({ nisn });
      if (existingMurid) {
        return res.status(400).json({
          success: false,
          message: 'NISN sudah terdaftar',
        });
      }
      // Check in other santriData
      const existingSantri = santriDoc.santriData.find((s, idx) => idx !== santriIndex && s.nisn === nisn);
      if (existingSantri) {
        return res.status(400).json({
          success: false,
          message: 'NISN sudah terdaftar',
        });
      }
    }

    // Check if RFID GUID already exists (excluding current santri)
    const rfidGuidValue = typeof rfidGuid === 'string' ? rfidGuid.trim() : rfidGuid;
    if (rfidGuidValue && rfidGuidValue !== '' && rfidGuidValue !== santri.rfidGuid) {
      const isUnique = await isRfidGuidUnique(rfidGuidValue, santriId);
      if (!isUnique) {
        return res.status(400).json({
          success: false,
          message: 'GUID/RFID sudah terdaftar ke guru/murid lain',
        });
      }
    }

    // Update santri data
    if (name) santriDoc.santriData[santriIndex].name = name;
    if (email) santriDoc.santriData[santriIndex].email = email;
    if (nisn !== undefined) santriDoc.santriData[santriIndex].nisn = nisn;
    if (whatsappOrtu !== undefined) santriDoc.santriData[santriIndex].whatsappOrtu = whatsappOrtu;
    if (isActive !== undefined) santriDoc.santriData[santriIndex].isActive = isActive !== false;
    if (rfidGuidValue !== undefined) santriDoc.santriData[santriIndex].rfidGuid = rfidGuidValue || undefined;

    // Update password if provided
    if (password && password.trim() !== '') {
      santriDoc.santriData[santriIndex].password = await hashPassword(password);
    }

    santriDoc.updatedAt = new Date().toISOString();
    await santriDoc.save();

    return res.json({
      success: true,
      message: 'Santri berhasil diperbarui',
    });
  } catch (error) {
    console.error('Update santri error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui santri',
    });
  }
};

// Remove santri
export const removeSantri = async (req, res) => {
  try {
    const { santriId } = req.params;

    let santriDoc = await Santri.findOne({ id: 'santri-single' });
    
    if (!santriDoc) {
      return res.status(404).json({
        success: false,
        message: 'Data santri tidak ditemukan',
      });
    }

    // Check if it's from muridIds or santriData
    const muridIndex = santriDoc.muridIds.findIndex(item => {
      const id = typeof item === 'string' ? item : item.id;
      return id === santriId;
    });
    
    if (muridIndex >= 0) {
      // Remove from muridIds
      santriDoc.muridIds.splice(muridIndex, 1);
    } else {
      // Remove from santriData
      santriDoc.santriData = santriDoc.santriData.filter(s => s.id !== santriId);
    }

    santriDoc.updatedAt = new Date().toISOString();
    await santriDoc.save();

    return res.json({
      success: true,
      message: 'Santri berhasil dihapus',
    });
  } catch (error) {
    console.error('Remove santri error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus santri',
    });
  }
};

