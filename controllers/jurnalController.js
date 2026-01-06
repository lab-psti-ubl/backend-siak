import Jurnal from '../models/Jurnal.js';

export const getAllJurnal = async (req, res) => {
  try {
    const jurnal = await Jurnal.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      jurnal: jurnal.map(j => j.toObject()),
    });
  } catch (error) {
    console.error('Error getting jurnal:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data jurnal',
      error: error.message,
    });
  }
};

export const getJurnalById = async (req, res) => {
  try {
    const { id } = req.params;
    const jurnal = await Jurnal.findOne({ id });
    if (!jurnal) {
      return res.status(404).json({
        success: false,
        message: 'Jurnal tidak ditemukan',
      });
    }
    return res.json({
      success: true,
      jurnal: jurnal.toObject(),
    });
  } catch (error) {
    console.error('Error getting jurnal:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data jurnal',
      error: error.message,
    });
  }
};

export const getJurnalByJadwalId = async (req, res) => {
  try {
    const { jadwalId } = req.params;
    const jurnal = await Jurnal.find({ jadwalId }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      jurnal: jurnal.map(j => j.toObject()),
    });
  } catch (error) {
    console.error('Error getting jurnal by jadwalId:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data jurnal',
      error: error.message,
    });
  }
};

export const getJurnalByTanggal = async (req, res) => {
  try {
    const { tanggal, jadwalId, kelasId } = req.query;
    
    const query = {};
    if (jadwalId) query.jadwalId = jadwalId;
    if (kelasId) query.kelasId = kelasId;
    
    if (!jadwalId && !kelasId) {
      return res.status(400).json({
        success: false,
        message: 'Minimal satu parameter diperlukan (jadwalId atau kelasId)',
      });
    }
    
    const jurnalDocs = await Jurnal.find(query).sort({ createdAt: -1 });
    
    // Filter pertemuan by tanggal if provided
    let result = [];
    if (tanggal) {
      jurnalDocs.forEach(doc => {
        const pertemuan = doc.pertemuan.find(p => p.tanggal === tanggal);
        if (pertemuan) {
          result.push({
            ...doc.toObject(),
            pertemuan: [pertemuan], // Return only matching pertemuan
          });
        }
      });
    } else {
      result = jurnalDocs.map(j => j.toObject());
    }
    
    return res.json({
      success: true,
      jurnal: result,
    });
  } catch (error) {
    console.error('Error getting jurnal by tanggal:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data jurnal',
      error: error.message,
    });
  }
};

export const getJurnalByJadwalIdAndTanggal = async (req, res) => {
  try {
    const { jadwalId, tanggal, kelasId } = req.query;
    
    if (!jadwalId || !tanggal) {
      return res.status(400).json({
        success: false,
        message: 'jadwalId dan tanggal diperlukan',
      });
    }
    
    const query = { jadwalId };
    if (kelasId) query.kelasId = kelasId;
    
    const jurnalDoc = await Jurnal.findOne(query);
    
    if (!jurnalDoc) {
      return res.json({
        success: true,
        jurnal: null,
      });
    }
    
    // Find the specific pertemuan by tanggal
    const pertemuan = jurnalDoc.pertemuan.find(p => p.tanggal === tanggal);
    
    if (!pertemuan) {
      return res.json({
        success: true,
        jurnal: null,
      });
    }
    
    // Return jurnal with single pertemuan in a format compatible with old structure
    const jurnalObj = jurnalDoc.toObject();
    return res.json({
      success: true,
      jurnal: {
        id: jurnalObj.id,
        jadwalId: jurnalObj.jadwalId,
        kelasId: jurnalObj.kelasId,
        tanggal: pertemuan.tanggal,
        judul: pertemuan.judul,
        deskripsi: pertemuan.deskripsi,
        waktuInput: pertemuan.waktuInput,
        file: pertemuan.file,
        tahunAjaranId: jurnalObj.tahunAjaranId,
        semester: jurnalObj.semester,
        createdAt: jurnalObj.createdAt,
        updatedAt: jurnalObj.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting jurnal by jadwalId and tanggal:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data jurnal',
      error: error.message,
    });
  }
};

export const createJurnal = async (req, res) => {
  try {
    const {
      id,
      jadwalId,
      kelasId,
      tanggal,
      judul,
      deskripsi,
      waktuInput,
      file,
      tahunAjaranId,
      semester,
    } = req.body;

    if (!jadwalId || !kelasId || !tanggal || !judul || !deskripsi || !waktuInput || !tahunAjaranId || semester === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap',
      });
    }

    // Find existing jurnal for this jadwalId and kelasId
    let jurnal = await Jurnal.findOne({ jadwalId, kelasId });

    // Create new pertemuan object
    const newPertemuan = {
      tanggal,
      judul,
      deskripsi,
      waktuInput,
      file: file || undefined,
    };

    if (jurnal) {
      // Check if pertemuan with this tanggal already exists
      const existingPertemuanIndex = jurnal.pertemuan.findIndex(p => p.tanggal === tanggal);
      
      if (existingPertemuanIndex >= 0) {
        // Update existing pertemuan
        jurnal.pertemuan[existingPertemuanIndex] = newPertemuan;
      } else {
        // Add new pertemuan
        jurnal.pertemuan.push(newPertemuan);
      }
      
      jurnal.updatedAt = new Date().toISOString();
      await jurnal.save();
    } else {
      // Create new jurnal document
      const jurnalId = id || `jurnal-${jadwalId}-${kelasId}-${Date.now()}`;
      jurnal = new Jurnal({
        id: jurnalId,
        jadwalId,
        kelasId,
        pertemuan: [newPertemuan],
        tahunAjaranId,
        semester,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await jurnal.save();
    }

    // Return the specific pertemuan in a format compatible with old structure
    const pertemuan = jurnal.pertemuan.find(p => p.tanggal === tanggal);
    const jurnalObj = jurnal.toObject();
    
    return res.status(201).json({
      success: true,
      message: 'Jurnal berhasil dibuat',
      jurnal: {
        id: jurnalObj.id,
        jadwalId: jurnalObj.jadwalId,
        kelasId: jurnalObj.kelasId,
        tanggal: pertemuan.tanggal,
        judul: pertemuan.judul,
        deskripsi: pertemuan.deskripsi,
        waktuInput: pertemuan.waktuInput,
        file: pertemuan.file,
        tahunAjaranId: jurnalObj.tahunAjaranId,
        semester: jurnalObj.semester,
        createdAt: jurnalObj.createdAt,
        updatedAt: jurnalObj.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error creating jurnal:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat jurnal',
      error: error.message,
    });
  }
};

export const updateJurnal = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const jurnal = await Jurnal.findOne({ id });
    if (!jurnal) {
      return res.status(404).json({
        success: false,
        message: 'Jurnal tidak ditemukan',
      });
    }

    // If updating a specific pertemuan (tanggal provided)
    if (updateData.tanggal) {
      const pertemuanIndex = jurnal.pertemuan.findIndex(p => p.tanggal === updateData.tanggal);
      
      if (pertemuanIndex >= 0) {
        // Update existing pertemuan
        const pertemuan = jurnal.pertemuan[pertemuanIndex];
        if (updateData.judul !== undefined) pertemuan.judul = updateData.judul;
        if (updateData.deskripsi !== undefined) pertemuan.deskripsi = updateData.deskripsi;
        if (updateData.waktuInput !== undefined) pertemuan.waktuInput = updateData.waktuInput;
        if (updateData.file !== undefined) pertemuan.file = updateData.file;
        
        jurnal.pertemuan[pertemuanIndex] = pertemuan;
      } else {
        // Add new pertemuan if not found
        jurnal.pertemuan.push({
          tanggal: updateData.tanggal,
          judul: updateData.judul || '',
          deskripsi: updateData.deskripsi || '',
          waktuInput: updateData.waktuInput || new Date().toISOString(),
          file: updateData.file,
        });
      }
    } else {
      // Update jurnal document fields (not pertemuan)
      delete updateData.id; // Prevent ID change
      delete updateData.pertemuan; // Don't allow direct pertemuan update
      Object.assign(jurnal, updateData);
    }

    jurnal.updatedAt = new Date().toISOString();
    await jurnal.save();

    const updatedJurnal = await Jurnal.findOne({ id });
    
    // If tanggal was provided, return the specific pertemuan
    if (updateData.tanggal) {
      const pertemuan = updatedJurnal.pertemuan.find(p => p.tanggal === updateData.tanggal);
      const jurnalObj = updatedJurnal.toObject();
      
      return res.json({
        success: true,
        message: 'Jurnal berhasil diperbarui',
        jurnal: pertemuan ? {
          id: jurnalObj.id,
          jadwalId: jurnalObj.jadwalId,
          kelasId: jurnalObj.kelasId,
          tanggal: pertemuan.tanggal,
          judul: pertemuan.judul,
          deskripsi: pertemuan.deskripsi,
          waktuInput: pertemuan.waktuInput,
          file: pertemuan.file,
          tahunAjaranId: jurnalObj.tahunAjaranId,
          semester: jurnalObj.semester,
          createdAt: jurnalObj.createdAt,
          updatedAt: jurnalObj.updatedAt,
        } : updatedJurnal.toObject(),
      });
    }

    return res.json({
      success: true,
      message: 'Jurnal berhasil diperbarui',
      jurnal: updatedJurnal.toObject(),
    });
  } catch (error) {
    console.error('Error updating jurnal:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui jurnal',
      error: error.message,
    });
  }
};

export const deleteJurnal = async (req, res) => {
  try {
    const { id } = req.params;
    const jurnal = await Jurnal.findOne({ id });
    if (!jurnal) {
      return res.status(404).json({
        success: false,
        message: 'Jurnal tidak ditemukan',
      });
    }

    await Jurnal.deleteOne({ id });
    return res.json({
      success: true,
      message: 'Jurnal berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting jurnal:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus jurnal',
      error: error.message,
    });
  }
};

