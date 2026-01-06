import PengumumanKelulusan from '../models/PengumumanKelulusan.js';

// Get all pengumuman kelulusan
export const getAll = async (req, res) => {
  try {
    const data = await PengumumanKelulusan.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: data.map(item => ({
        id: item._id.toString(),
        tahunAjaran: item.tahunAjaran,
        tanggalPengumuman: item.tanggalPengumuman,
        isPublished: item.isPublished,
        isProcessed: item.isProcessed,
        snapshotMuridIds: item.snapshotMuridIds || [],
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        publishedAt: item.publishedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get by ID
export const getById = async (req, res) => {
  try {
    const data = await PengumumanKelulusan.findById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    res.json({
      success: true,
      data: {
        id: data._id.toString(),
        tahunAjaran: data.tahunAjaran,
        tanggalPengumuman: data.tanggalPengumuman,
        isPublished: data.isPublished,
        isProcessed: data.isProcessed,
        snapshotMuridIds: data.snapshotMuridIds || [],
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        publishedAt: data.publishedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create
export const create = async (req, res) => {
  try {
    const { tahunAjaran, tanggalPengumuman, isPublished, isProcessed, snapshotMuridIds, createdBy, publishedAt } = req.body;
    
    if (!tahunAjaran || !tanggalPengumuman || !createdBy) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tahun ajaran, tanggal pengumuman, dan createdBy wajib diisi' 
      });
    }

    // Check if there's already a published announcement for this academic year
    if (isPublished) {
      const existingPublished = await PengumumanKelulusan.findOne({
        tahunAjaran,
        isPublished: true
      });
      
      if (existingPublished) {
        return res.status(400).json({
          success: false,
          message: `Pengumuman kelulusan sudah aktif untuk tahun ajaran ${tahunAjaran}`
        });
      }
    }

    const newData = new PengumumanKelulusan({
      tahunAjaran,
      tanggalPengumuman,
      isPublished: isPublished || false,
      isProcessed: isProcessed || false,
      snapshotMuridIds: snapshotMuridIds || [],
      createdBy,
      createdAt: new Date().toISOString(),
      publishedAt: publishedAt || (isPublished ? new Date().toISOString() : undefined)
    });
    
    const saved = await newData.save();
    res.status(201).json({
      success: true,
      data: {
        id: saved._id.toString(),
        tahunAjaran: saved.tahunAjaran,
        tanggalPengumuman: saved.tanggalPengumuman,
        isPublished: saved.isPublished,
        isProcessed: saved.isProcessed,
        snapshotMuridIds: saved.snapshotMuridIds || [],
        createdBy: saved.createdBy,
        createdAt: saved.createdAt,
        publishedAt: saved.publishedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update
export const update = async (req, res) => {
  try {
    const { isPublished } = req.body;
    
    // If trying to publish, check if there's already a published announcement for this academic year
    if (isPublished) {
      const current = await PengumumanKelulusan.findById(req.params.id);
      if (current) {
        const existingPublished = await PengumumanKelulusan.findOne({
          tahunAjaran: current.tahunAjaran,
          isPublished: true,
          _id: { $ne: req.params.id }
        });
        
        if (existingPublished) {
          return res.status(400).json({
            success: false,
            message: `Pengumuman kelulusan sudah aktif untuk tahun ajaran ${current.tahunAjaran}`
          });
        }
      }
    }

    const updated = await PengumumanKelulusan.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        ...(isPublished && !req.body.publishedAt ? { publishedAt: new Date().toISOString() } : {})
      },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    res.json({
      success: true,
      data: {
        id: updated._id.toString(),
        tahunAjaran: updated.tahunAjaran,
        tanggalPengumuman: updated.tanggalPengumuman,
        isPublished: updated.isPublished,
        isProcessed: updated.isProcessed,
        snapshotMuridIds: updated.snapshotMuridIds || [],
        createdBy: updated.createdBy,
        createdAt: updated.createdAt,
        publishedAt: updated.publishedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete
export const deleteOne = async (req, res) => {
  try {
    const deleted = await PengumumanKelulusan.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get by filter (tahunAjaran, isPublished, isProcessed)
export const getByFilter = async (req, res) => {
  try {
    const { tahunAjaran, isPublished, isProcessed } = req.query;
    const filter = {};
    if (tahunAjaran) filter.tahunAjaran = tahunAjaran;
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
    if (isProcessed !== undefined) filter.isProcessed = isProcessed === 'true';
    
    const data = await PengumumanKelulusan.find(filter).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: data.map(item => ({
        id: item._id.toString(),
        tahunAjaran: item.tahunAjaran,
        tanggalPengumuman: item.tanggalPengumuman,
        isPublished: item.isPublished,
        isProcessed: item.isProcessed,
        snapshotMuridIds: item.snapshotMuridIds || [],
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        publishedAt: item.publishedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get active (published) pengumuman for a specific academic year
export const getActive = async (req, res) => {
  try {
    const { tahunAjaran } = req.query;
    const filter = { isPublished: true };
    if (tahunAjaran) filter.tahunAjaran = tahunAjaran;
    
    const data = await PengumumanKelulusan.findOne(filter).sort({ createdAt: -1 });
    if (!data) {
      return res.json({
        success: true,
        data: null
      });
    }
    res.json({
      success: true,
      data: {
        id: data._id.toString(),
        tahunAjaran: data.tahunAjaran,
        tanggalPengumuman: data.tanggalPengumuman,
        isPublished: data.isPublished,
        isProcessed: data.isProcessed,
        snapshotMuridIds: data.snapshotMuridIds || [],
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        publishedAt: data.publishedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { deleteOne as delete };

