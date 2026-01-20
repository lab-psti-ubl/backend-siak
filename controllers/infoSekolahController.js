import InfoSekolah from '../models/InfoSekolah.js';

// Helper function to check if image should be removed (older than 1 month)
const shouldRemoveImage = (createdAt) => {
  if (!createdAt) return false;
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffInMs = now.getTime() - createdDate.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  return diffInDays > 30; // More than 30 days (1 month)
};

// Helper function to clean up old images from database
const cleanupOldImages = async () => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const result = await InfoSekolah.updateMany(
      {
        gambar: { $exists: true, $ne: null, $ne: '' },
        createdAt: { $lt: oneMonthAgo.toISOString() }
      },
      {
        $unset: { gambar: '' }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`Cleaned up ${result.modifiedCount} old images from InfoSekolah`);
    }
  } catch (error) {
    console.error('Error cleaning up old images:', error);
  }
};

// Get all info sekolah
export const getAll = async (req, res) => {
  try {
    // Clean up old images before fetching
    await cleanupOldImages();
    
    // Filter out the read notifications document (internal use only)
    const data = await InfoSekolah.find({ judul: { $ne: '__READ_NOTIFICATIONS__' } }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: data.map(item => {
        // Remove gambar if older than 1 month (double check in case cleanup didn't run)
        const gambar = shouldRemoveImage(item.createdAt) ? undefined : item.gambar;
        
        return {
        id: item._id.toString(),
        judul: item.judul,
        konten: item.konten,
        jenis: item.jenis,
        target: item.target,
        kelasId: item.kelasId,
          gambar: gambar,
        isActive: item.isActive,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        publishedAt: item.publishedAt
        };
      })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get by ID
export const getById = async (req, res) => {
  try {
    const data = await InfoSekolah.findById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    
    // Remove gambar if older than 1 month
    const gambar = shouldRemoveImage(data.createdAt) ? undefined : data.gambar;
    
    // If image should be removed, update database
    if (shouldRemoveImage(data.createdAt) && data.gambar) {
      await InfoSekolah.findByIdAndUpdate(req.params.id, { $unset: { gambar: '' } });
    }
    
    res.json({
      success: true,
      data: {
        id: data._id.toString(),
        judul: data.judul,
        konten: data.konten,
        jenis: data.jenis,
        target: data.target,
        kelasId: data.kelasId,
        gambar: gambar,
        isActive: data.isActive,
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
    const { judul, konten, jenis, target, kelasId, gambar, isActive, createdBy, publishedAt } = req.body;
    
    if (!judul || !konten || !jenis || !target || !createdBy) {
      return res.status(400).json({ 
        success: false, 
        message: 'Judul, konten, jenis, target, dan createdBy wajib diisi' 
      });
    }

    const newData = new InfoSekolah({
      judul: judul.trim(),
      konten: konten.trim(),
      jenis,
      target,
      kelasId,
      gambar,
      isActive: isActive !== undefined ? isActive : true,
      createdBy,
      createdAt: new Date().toISOString(),
      publishedAt: publishedAt || new Date().toISOString()
    });
    
    const saved = await newData.save();
    res.status(201).json({
      success: true,
      data: {
        id: saved._id.toString(),
        judul: saved.judul,
        konten: saved.konten,
        jenis: saved.jenis,
        target: saved.target,
        kelasId: saved.kelasId,
        gambar: saved.gambar,
        isActive: saved.isActive,
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
    const updated = await InfoSekolah.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date().toISOString() },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    res.json({
      success: true,
      data: {
        id: updated._id.toString(),
        judul: updated.judul,
        konten: updated.konten,
        jenis: updated.jenis,
        target: updated.target,
        kelasId: updated.kelasId,
        gambar: updated.gambar,
        isActive: updated.isActive,
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
    const deleted = await InfoSekolah.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get by filter (jenis, target, isActive)
export const getByFilter = async (req, res) => {
  try {
    // Clean up old images before fetching
    await cleanupOldImages();
    
    const { jenis, target, isActive } = req.query;
    const filter = { judul: { $ne: '__READ_NOTIFICATIONS__' } }; // Filter out read notifications document
    if (jenis) filter.jenis = jenis;
    if (target) filter.target = target;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const data = await InfoSekolah.find(filter).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: data.map(item => {
        // Remove gambar if older than 1 month (double check in case cleanup didn't run)
        const gambar = shouldRemoveImage(item.createdAt) ? undefined : item.gambar;
        
        return {
        id: item._id.toString(),
        judul: item.judul,
        konten: item.konten,
        jenis: item.jenis,
        target: item.target,
        kelasId: item.kelasId,
          gambar: gambar,
        isActive: item.isActive,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        publishedAt: item.publishedAt
        };
      })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { deleteOne as delete };

