import Ustadz from '../models/Ustadz.js';
import Guru from '../models/Guru.js';
import { hashPassword } from '../utils/passwordUtils.js';
import { isEmailUnique, isRfidGuidUnique } from '../utils/validationUtils.js';

// Get all ustadz (with populated guru data)
export const getAllUstadz = async (req, res) => {
  try {
    // Get or create single ustadz document
    let ustadzDoc = await Ustadz.findOne({ id: 'ustadz-single' });
    
    if (!ustadzDoc) {
      // Create initial document if it doesn't exist
      ustadzDoc = new Ustadz({
        id: 'ustadz-single',
        guruIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await ustadzDoc.save();
    }

    // Get guru IDs from guruIds array (handle both old string format and new object format)
    const guruIdList = ustadzDoc.guruIds.map(item => 
      typeof item === 'string' ? item : item.id
    );
    
    // Populate guru data
    const gurus = await Guru.find({ id: { $in: guruIdList } });
    
    // Create a map of guruIds with their isActive status
    const guruStatusMap = new Map();
    ustadzDoc.guruIds.forEach(item => {
      const id = typeof item === 'string' ? item : item.id;
      const isActive = typeof item === 'string' ? true : (item.isActive !== false);
      guruStatusMap.set(id, isActive);
    });
    
    return res.json({
      success: true,
      ustadz: gurus.map(g => {
        const guruObj = g.toObject();
        guruObj.role = 'guru';
        // Override isActive dengan nilai dari ustadz collection
        guruObj.isActive = guruStatusMap.get(g.id) !== false;
        return guruObj;
      }),
      count: gurus.length,
    });
  } catch (error) {
    console.error('Get all ustadz error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data ustadz',
    });
  }
};

// Get available gurus (gurus that are not yet in ustadz)
export const getAvailableGurus = async (req, res) => {
  try {
    // Get ustadz document
    let ustadzDoc = await Ustadz.findOne({ id: 'ustadz-single' });
    
    if (!ustadzDoc) {
      // If no ustadz document exists, return all gurus
      const allGurus = await Guru.find().sort({ name: 1 });
      return res.json({
        success: true,
        gurus: allGurus.map(g => {
          const guruObj = g.toObject();
          guruObj.role = 'guru';
          return guruObj;
        }),
      });
    }

    // Get guru IDs from guruIds array (handle both old string format and new object format)
    const existingGuruIds = ustadzDoc.guruIds.map(item => 
      typeof item === 'string' ? item : item.id
    );
    
    // Get gurus that are not in ustadz
    const availableGurus = await Guru.find({
      id: { $nin: existingGuruIds }
    }).sort({ name: 1 });

    return res.json({
      success: true,
      gurus: availableGurus.map(g => {
        const guruObj = g.toObject();
        guruObj.role = 'guru';
        return guruObj;
      }),
    });
  } catch (error) {
    console.error('Get available gurus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data guru yang tersedia',
    });
  }
};

// Add ustadz (either from existing guru or create new guru)
export const addUstadz = async (req, res) => {
  try {
    const {
      guruId, // If provided, use existing guru
      name,
      email,
      phone,
      nip,
      password,
      subject,
      isActive,
      rfidGuid,
      profileImage,
    } = req.body;

    let guruIdToAdd;

    if (guruId) {
      // Use existing guru
      const existingGuru = await Guru.findOne({ id: guruId });
      if (!existingGuru) {
        return res.status(404).json({
          success: false,
          message: 'Guru tidak ditemukan',
        });
      }

      // Check if guru is already in ustadz
      let ustadzDoc = await Ustadz.findOne({ id: 'ustadz-single' });
      if (ustadzDoc) {
        const existingIndex = ustadzDoc.guruIds.findIndex(item => {
          const id = typeof item === 'string' ? item : item.id;
          return id === guruId;
        });
        
        if (existingIndex >= 0) {
          return res.status(400).json({
            success: false,
            message: 'Guru ini sudah ditambahkan sebagai ustadz',
          });
        }
      }

      guruIdToAdd = guruId;
    } else {
      // Create new guru first
      if (!name || !email || !nip) {
        return res.status(400).json({
          success: false,
          message: 'Nama, email, dan NIP wajib diisi',
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

      // Check if NIP already exists
      const existingNIP = await Guru.findOne({ nip });
      if (existingNIP) {
        return res.status(400).json({
          success: false,
          message: 'NIP sudah terdaftar',
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

      // Create new guru
      const newGuru = new Guru({
        id: `guru${Date.now()}`,
        name,
        email,
        phone: phone || undefined,
        nip,
        password: hashedPassword,
        subject: subject || undefined,
        isWaliKelas: false,
        isActive: isActive !== false,
        rfidGuid: rfidGuid || undefined,
        profileImage: profileImage || undefined,
        createdAt: new Date().toISOString(),
      });

      await newGuru.save();
      guruIdToAdd = newGuru.id;
    }

    // Add guru ID to ustadz collection
    let ustadzDoc = await Ustadz.findOne({ id: 'ustadz-single' });
    
    if (!ustadzDoc) {
      ustadzDoc = new Ustadz({
        id: 'ustadz-single',
        guruIds: [{
          id: guruIdToAdd,
          isActive: isActive !== false, // Use isActive from request or default to true
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Check if already exists
      const existingIndex = ustadzDoc.guruIds.findIndex(item => {
        const id = typeof item === 'string' ? item : item.id;
        return id === guruIdToAdd;
      });
      
      if (existingIndex >= 0) {
        return res.status(400).json({
          success: false,
          message: 'Ustadz ini sudah ditambahkan',
        });
      }
      
      // Add guru with isActive status
      ustadzDoc.guruIds.push({
        id: guruIdToAdd,
        isActive: isActive !== false, // Use isActive from request or default to true
      });
      ustadzDoc.updatedAt = new Date().toISOString();
    }

    await ustadzDoc.save();

    // Get the added guru data
    const addedGuru = await Guru.findOne({ id: guruIdToAdd });
    const guruObj = addedGuru.toObject();
    guruObj.role = 'guru';

    return res.json({
      success: true,
      message: 'Ustadz berhasil ditambahkan',
      ustadz: guruObj,
    });
  } catch (error) {
    console.error('Add ustadz error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan ustadz',
    });
  }
};

// Update ustadz status (active/inactive)
export const updateUstadzStatus = async (req, res) => {
  try {
    const { guruId } = req.params;
    const { isActive } = req.body;

    let ustadzDoc = await Ustadz.findOne({ id: 'ustadz-single' });
    
    if (!ustadzDoc) {
      return res.status(404).json({
        success: false,
        message: 'Data ustadz tidak ditemukan',
      });
    }

    // Find and update status in guruIds
    const guruIndex = ustadzDoc.guruIds.findIndex(item => {
      const id = typeof item === 'string' ? item : item.id;
      return id === guruId;
    });
    
    if (guruIndex >= 0) {
      const item = ustadzDoc.guruIds[guruIndex];
      if (typeof item === 'string') {
        // Convert old format to new format
        ustadzDoc.guruIds[guruIndex] = {
          id: item,
          isActive: isActive !== false,
        };
      } else {
        ustadzDoc.guruIds[guruIndex].isActive = isActive !== false;
      }
      
      ustadzDoc.updatedAt = new Date().toISOString();
      await ustadzDoc.save();

      return res.json({
        success: true,
        message: 'Status ustadz berhasil diperbarui',
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Ustadz tidak ditemukan',
      });
    }
  } catch (error) {
    console.error('Update ustadz status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui status ustadz',
    });
  }
};

// Remove ustadz
export const removeUstadz = async (req, res) => {
  try {
    const { guruId } = req.params;

    let ustadzDoc = await Ustadz.findOne({ id: 'ustadz-single' });
    
    if (!ustadzDoc) {
      return res.status(404).json({
        success: false,
        message: 'Data ustadz tidak ditemukan',
      });
    }

    // Remove guru ID from array (handle both old string format and new object format)
    ustadzDoc.guruIds = ustadzDoc.guruIds.filter(item => {
      const id = typeof item === 'string' ? item : item.id;
      return id !== guruId;
    });
    ustadzDoc.updatedAt = new Date().toISOString();
    await ustadzDoc.save();

    return res.json({
      success: true,
      message: 'Ustadz berhasil dihapus',
    });
  } catch (error) {
    console.error('Remove ustadz error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus ustadz',
    });
  }
};

