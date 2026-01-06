import StatusKenaikanKelas from '../models/StatusKenaikanKelas.js';

// Get all status kenaikan kelas
export const getAll = async (req, res) => {
  try {
    const data = await StatusKenaikanKelas.find();
    res.json({
      success: true,
      data: data.map(item => ({
        id: item._id.toString(),
        kelasIds: item.kelasIds || [],
        tahunAjaran: item.tahunAjaran,
        semester: item.semester,
        isPublished: item.isPublished,
        publishedKelasIds: item.publishedKelasIds || [],
        publishedBy: item.publishedBy,
        publishedAt: item.publishedAt,
        createdAt: item.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get by ID
export const getById = async (req, res) => {
  try {
    const data = await StatusKenaikanKelas.findById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    res.json({
      success: true,
      data: {
        id: data._id.toString(),
        kelasIds: data.kelasIds || [],
        tahunAjaran: data.tahunAjaran,
        semester: data.semester,
        isPublished: data.isPublished,
        publishedKelasIds: data.publishedKelasIds || [],
        publishedBy: data.publishedBy,
        publishedAt: data.publishedAt,
        createdAt: data.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create or Update (upsert based on tahunAjaran + semester)
export const create = async (req, res) => {
  try {
    const { kelasIds, tahunAjaran, semester, isPublished, publishedBy, publishedAt } = req.body;
    
    // Support backward compatibility: if kelasId is provided instead of kelasIds, convert it
    let finalKelasIds = kelasIds;
    if (!finalKelasIds && req.body.kelasId) {
      finalKelasIds = [req.body.kelasId];
    }
    
    if (!finalKelasIds || !Array.isArray(finalKelasIds)) {
      return res.status(400).json({ success: false, message: 'kelasIds harus berupa array' });
    }
    
    // Check if document exists for this tahunAjaran + semester
    const existing = await StatusKenaikanKelas.findOne({ tahunAjaran, semester });
    
    let saved;
    if (existing) {
      // Update existing: merge kelasIds (avoid duplicates)
      const mergedKelasIds = [...new Set([...existing.kelasIds, ...finalKelasIds])];
      existing.kelasIds = mergedKelasIds;
      if (isPublished !== undefined) existing.isPublished = isPublished;
      if (publishedBy !== undefined) existing.publishedBy = publishedBy;
      if (publishedAt !== undefined) existing.publishedAt = publishedAt;
      saved = await existing.save();
    } else {
      // Create new
      const newData = new StatusKenaikanKelas({
        kelasIds: finalKelasIds,
        tahunAjaran,
        semester,
        isPublished: isPublished || false,
        publishedBy,
        publishedAt,
        createdAt: new Date().toISOString()
      });
      saved = await newData.save();
    }
    
    res.status(201).json({
      success: true,
      data: {
        id: saved._id.toString(),
        kelasIds: saved.kelasIds || [],
        tahunAjaran: saved.tahunAjaran,
        semester: saved.semester,
        isPublished: saved.isPublished,
        publishedKelasIds: saved.publishedKelasIds || [],
        publishedBy: saved.publishedBy,
        publishedAt: saved.publishedAt,
        createdAt: saved.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update
export const update = async (req, res) => {
  try {
    // Support backward compatibility: if kelasId is provided, convert to kelasIds array
    if (req.body.kelasId && !req.body.kelasIds) {
      req.body.kelasIds = [req.body.kelasId];
      delete req.body.kelasId;
    }
    
    // Handle adding kelasId to publishedKelasIds when publishing
    // If addPublishedKelasId is provided, add it to publishedKelasIds array
    if (req.body.addPublishedKelasId) {
      const kelasIdToAdd = req.body.addPublishedKelasId;
      delete req.body.addPublishedKelasId;
      
      const existing = await StatusKenaikanKelas.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
      }
      
      // Add kelasId to publishedKelasIds if not already present
      const currentPublishedKelasIds = existing.publishedKelasIds || [];
      if (!currentPublishedKelasIds.includes(kelasIdToAdd)) {
        req.body.publishedKelasIds = [...currentPublishedKelasIds, kelasIdToAdd];
      } else {
        req.body.publishedKelasIds = currentPublishedKelasIds;
      }
    }
    
    const updated = await StatusKenaikanKelas.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    res.json({
      success: true,
      data: {
        id: updated._id.toString(),
        kelasIds: updated.kelasIds || [],
        tahunAjaran: updated.tahunAjaran,
        semester: updated.semester,
        isPublished: updated.isPublished,
        publishedKelasIds: updated.publishedKelasIds || [],
        publishedBy: updated.publishedBy,
        publishedAt: updated.publishedAt,
        createdAt: updated.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete
export const deleteOne = async (req, res) => {
  try {
    const deleted = await StatusKenaikanKelas.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get by kelas, tahun ajaran, and semester
export const getByFilter = async (req, res) => {
  try {
    const { kelasId, tahunAjaran, semester } = req.query;
    const filter = {};
    if (tahunAjaran) filter.tahunAjaran = tahunAjaran;
    if (semester) filter.semester = parseInt(semester);
    
    let data = await StatusKenaikanKelas.find(filter);
    
    // If kelasId is provided, filter by kelasId in the array
    if (kelasId) {
      data = data.filter(item => item.kelasIds && item.kelasIds.includes(kelasId));
    }
    
    res.json({
      success: true,
      data: data.map(item => ({
        id: item._id.toString(),
        kelasIds: item.kelasIds || [],
        tahunAjaran: item.tahunAjaran,
        semester: item.semester,
        isPublished: item.isPublished,
        publishedKelasIds: item.publishedKelasIds || [],
        publishedBy: item.publishedBy,
        publishedAt: item.publishedAt,
        createdAt: item.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { deleteOne as delete };
