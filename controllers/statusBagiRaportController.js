import StatusBagiRaport from '../models/StatusBagiRaport.js';

// Get all status bagi raport
export const getAll = async (req, res) => {
  try {
    const data = await StatusBagiRaport.find();
    res.json({
      success: true,
      data: data.map(item => ({
        id: item._id.toString(),
        kelasId: item.kelasId,
        tahunAjaran: item.tahunAjaran,
        semester: item.semester,
        isPublished: item.isPublished,
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
    const data = await StatusBagiRaport.findById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    res.json({
      success: true,
      data: {
        id: data._id.toString(),
        kelasId: data.kelasId,
        tahunAjaran: data.tahunAjaran,
        semester: data.semester,
        isPublished: data.isPublished,
        publishedBy: data.publishedBy,
        publishedAt: data.publishedAt,
        createdAt: data.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create
export const create = async (req, res) => {
  try {
    const { kelasId, tahunAjaran, semester, isPublished, publishedBy, publishedAt } = req.body;
    
    const newData = new StatusBagiRaport({
      kelasId,
      tahunAjaran,
      semester,
      isPublished: isPublished || false,
      publishedBy,
      publishedAt,
      createdAt: new Date().toISOString()
    });
    
    const saved = await newData.save();
    res.status(201).json({
      success: true,
      data: {
        id: saved._id.toString(),
        kelasId: saved.kelasId,
        tahunAjaran: saved.tahunAjaran,
        semester: saved.semester,
        isPublished: saved.isPublished,
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
    const updated = await StatusBagiRaport.findByIdAndUpdate(
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
        kelasId: updated.kelasId,
        tahunAjaran: updated.tahunAjaran,
        semester: updated.semester,
        isPublished: updated.isPublished,
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
    const deleted = await StatusBagiRaport.findByIdAndDelete(req.params.id);
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
    if (kelasId) filter.kelasId = kelasId;
    if (tahunAjaran) filter.tahunAjaran = tahunAjaran;
    if (semester) filter.semester = parseInt(semester);
    
    const data = await StatusBagiRaport.find(filter);
    res.json({
      success: true,
      data: data.map(item => ({
        id: item._id.toString(),
        kelasId: item.kelasId,
        tahunAjaran: item.tahunAjaran,
        semester: item.semester,
        isPublished: item.isPublished,
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
