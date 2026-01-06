import RiwayatWaliKelas from '../models/RiwayatWaliKelas.js';

// Get all
export const getAll = async (req, res) => {
  try {
    const data = await RiwayatWaliKelas.find();
    res.json({
      success: true,
      data: data.map(item => ({
        id: item._id.toString(),
        guruId: item.guruId,
        kelasId: item.kelasId,
        namaKelas: item.namaKelas,
        tahunAjaran: item.tahunAjaran,
        jumlahMuridLulus: item.jumlahMuridLulus,
        jumlahMuridTidakLulus: item.jumlahMuridTidakLulus,
        tanggalKelulusan: item.tanggalKelulusan,
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
    const data = await RiwayatWaliKelas.findById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    res.json({
      success: true,
      data: {
        id: data._id.toString(),
        guruId: data.guruId,
        kelasId: data.kelasId,
        namaKelas: data.namaKelas,
        tahunAjaran: data.tahunAjaran,
        jumlahMuridLulus: data.jumlahMuridLulus,
        jumlahMuridTidakLulus: data.jumlahMuridTidakLulus,
        tanggalKelulusan: data.tanggalKelulusan,
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
    const newData = new RiwayatWaliKelas({
      ...req.body,
      createdAt: new Date().toISOString()
    });
    
    const saved = await newData.save();
    res.status(201).json({
      success: true,
      data: {
        id: saved._id.toString(),
        guruId: saved.guruId,
        kelasId: saved.kelasId,
        namaKelas: saved.namaKelas,
        tahunAjaran: saved.tahunAjaran,
        jumlahMuridLulus: saved.jumlahMuridLulus,
        jumlahMuridTidakLulus: saved.jumlahMuridTidakLulus,
        tanggalKelulusan: saved.tanggalKelulusan,
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
    const updated = await RiwayatWaliKelas.findByIdAndUpdate(
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
        guruId: updated.guruId,
        kelasId: updated.kelasId,
        namaKelas: updated.namaKelas,
        tahunAjaran: updated.tahunAjaran,
        jumlahMuridLulus: updated.jumlahMuridLulus,
        jumlahMuridTidakLulus: updated.jumlahMuridTidakLulus,
        tanggalKelulusan: updated.tanggalKelulusan,
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
    const deleted = await RiwayatWaliKelas.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get by guru ID
export const getByGuruId = async (req, res) => {
  try {
    const data = await RiwayatWaliKelas.find({ guruId: req.params.guruId });
    res.json({
      success: true,
      data: data.map(item => ({
        id: item._id.toString(),
        guruId: item.guruId,
        kelasId: item.kelasId,
        namaKelas: item.namaKelas,
        tahunAjaran: item.tahunAjaran,
        jumlahMuridLulus: item.jumlahMuridLulus,
        jumlahMuridTidakLulus: item.jumlahMuridTidakLulus,
        tanggalKelulusan: item.tanggalKelulusan,
        createdAt: item.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { deleteOne as delete };
