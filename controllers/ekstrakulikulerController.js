import Ekstrakulikuler from '../models/Ekstrakulikuler.js';
import Guru from '../models/Guru.js';

// Get all ekstrakulikuler
export const getAllEkstrakulikuler = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const ekstrakulikuler = await Ekstrakulikuler.find(query).sort({ createdAt: -1 });
    
    // Populate pembina data
    const ekstrakulikulerWithPembina = await Promise.all(
      ekstrakulikuler.map(async (ekstra) => {
        const pembina = await Guru.findOne({ id: ekstra.pembinaId });
        const ekstraObj = ekstra.toObject();
        return {
          ...ekstraObj,
          pembina: pembina ? {
            id: pembina.id,
            name: pembina.name,
            nip: pembina.nip,
          } : null,
        };
      })
    );
    
    return res.json({
      success: true,
      ekstrakulikuler: ekstrakulikulerWithPembina,
      count: ekstrakulikulerWithPembina.length,
    });
  } catch (error) {
    console.error('Get all ekstrakulikuler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data ekstrakulikuler',
    });
  }
};

// Get single ekstrakulikuler by ID
export const getEkstrakulikulerById = async (req, res) => {
  try {
    const { id } = req.params;
    const ekstrakulikuler = await Ekstrakulikuler.findOne({ id });
    
    if (!ekstrakulikuler) {
      return res.status(404).json({
        success: false,
        message: 'Ekstrakulikuler tidak ditemukan',
      });
    }

    // Populate pembina data
    const pembina = await Guru.findOne({ id: ekstrakulikuler.pembinaId });
    const ekstraObj = ekstrakulikuler.toObject();
    
    return res.json({
      success: true,
      ekstrakulikuler: {
        ...ekstraObj,
        pembina: pembina ? {
          id: pembina.id,
          name: pembina.name,
          nip: pembina.nip,
        } : null,
      },
    });
  } catch (error) {
    console.error('Get ekstrakulikuler by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data ekstrakulikuler',
    });
  }
};

// Create ekstrakulikuler
export const createEkstrakulikuler = async (req, res) => {
  try {
    const { nama, deskripsi, pembinaId } = req.body;

    if (!nama || !pembinaId) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan pembina wajib diisi',
      });
    }

    // Check if pembina exists
    const pembina = await Guru.findOne({ id: pembinaId });
    if (!pembina) {
      return res.status(400).json({
        success: false,
        message: 'Pembina tidak ditemukan atau bukan guru',
      });
    }

    // Check if nama already exists
    const existing = await Ekstrakulikuler.findOne({ nama });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ekstrakulikuler dengan nama ini sudah ada',
      });
    }

    const now = new Date().toISOString();
    const newEkstrakulikuler = new Ekstrakulikuler({
      id: `ekstrakulikuler-${Date.now()}`,
      nama,
      deskripsi: deskripsi || '',
      pembinaId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await newEkstrakulikuler.save();

    // Populate pembina data
    const ekstraObj = newEkstrakulikuler.toObject();
    
    return res.json({
      success: true,
      ekstrakulikuler: {
        ...ekstraObj,
        pembina: {
          id: pembina.id,
          name: pembina.name,
          nip: pembina.nip,
        },
      },
      message: 'Ekstrakulikuler berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Create ekstrakulikuler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan ekstrakulikuler',
    });
  }
};

// Update ekstrakulikuler
export const updateEkstrakulikuler = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, deskripsi, pembinaId, isActive } = req.body;

    const existing = await Ekstrakulikuler.findOne({ id });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Ekstrakulikuler tidak ditemukan',
      });
    }

    // If pembinaId is being updated, validate it
    if (pembinaId && pembinaId !== existing.pembinaId) {
      const pembina = await Guru.findOne({ id: pembinaId });
      if (!pembina) {
        return res.status(400).json({
          success: false,
          message: 'Pembina tidak ditemukan atau bukan guru',
        });
      }
      existing.pembinaId = pembinaId;
    }

    // If nama is being updated, check for duplicates
    if (nama && nama !== existing.nama) {
      const duplicate = await Ekstrakulikuler.findOne({ nama, id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Ekstrakulikuler dengan nama ini sudah ada',
        });
      }
      existing.nama = nama;
    }

    if (deskripsi !== undefined) existing.deskripsi = deskripsi;
    if (isActive !== undefined) existing.isActive = isActive;
    existing.updatedAt = new Date().toISOString();

    await existing.save();

    // Populate pembina data
    const pembina = await Guru.findOne({ id: existing.pembinaId });
    const ekstraObj = existing.toObject();
    
    return res.json({
      success: true,
      ekstrakulikuler: {
        ...ekstraObj,
        pembina: pembina ? {
          id: pembina.id,
          name: pembina.name,
          nip: pembina.nip,
        } : null,
      },
      message: 'Ekstrakulikuler berhasil diperbarui',
    });
  } catch (error) {
    console.error('Update ekstrakulikuler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui ekstrakulikuler',
    });
  }
};

// Delete ekstrakulikuler
export const deleteEkstrakulikuler = async (req, res) => {
  try {
    const { id } = req.params;

    const ekstrakulikuler = await Ekstrakulikuler.findOne({ id });

    if (!ekstrakulikuler) {
      return res.status(404).json({
        success: false,
        message: 'Ekstrakulikuler tidak ditemukan',
      });
    }

    await Ekstrakulikuler.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Ekstrakulikuler berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete ekstrakulikuler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus ekstrakulikuler',
    });
  }
};

