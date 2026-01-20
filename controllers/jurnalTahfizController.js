import JurnalTahfiz from '../models/JurnalTahfiz.js';

export const getAllJurnalTahfiz = async (req, res) => {
  try {
    const jurnalTahfiz = await JurnalTahfiz.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      jurnalTahfiz: jurnalTahfiz.map(j => j.toObject()),
    });
  } catch (error) {
    console.error('Error getting jurnal tahfiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data jurnal tahfiz',
      error: error.message,
    });
  }
};

export const getJurnalTahfizById = async (req, res) => {
  try {
    const { id } = req.params;
    const jurnalTahfiz = await JurnalTahfiz.findOne({ id });
    if (!jurnalTahfiz) {
      return res.status(404).json({
        success: false,
        message: 'Jurnal tahfiz tidak ditemukan',
      });
    }
    return res.json({
      success: true,
      jurnalTahfiz: jurnalTahfiz.toObject(),
    });
  } catch (error) {
    console.error('Error getting jurnal tahfiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data jurnal tahfiz',
      error: error.message,
    });
  }
};

export const getJurnalTahfizByJadwalId = async (req, res) => {
  try {
    const { jadwalId } = req.params;
    const jurnalTahfiz = await JurnalTahfiz.find({ jadwalId }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      jurnalTahfiz: jurnalTahfiz.map(j => j.toObject()),
    });
  } catch (error) {
    console.error('Error getting jurnal tahfiz by jadwalId:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data jurnal tahfiz',
      error: error.message,
    });
  }
};

export const getJurnalTahfizByTanggal = async (req, res) => {
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
    
    const jurnalDocs = await JurnalTahfiz.find(query).sort({ createdAt: -1 });
    
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
      jurnalTahfiz: result,
    });
  } catch (error) {
    console.error('Error getting jurnal tahfiz by tanggal:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data jurnal tahfiz',
      error: error.message,
    });
  }
};

export const getJurnalTahfizByJadwalIdAndTanggal = async (req, res) => {
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
    
    const jurnalDoc = await JurnalTahfiz.findOne(query);
    
    if (!jurnalDoc) {
      return res.json({
        success: true,
        jurnalTahfiz: null,
      });
    }
    
    // Find the specific pertemuan by tanggal
    const pertemuan = jurnalDoc.pertemuan.find(p => p.tanggal === tanggal);
    
    if (!pertemuan) {
      return res.json({
        success: true,
        jurnalTahfiz: null,
      });
    }
    
    // Return jurnal with single pertemuan
    const jurnalObj = jurnalDoc.toObject();
    return res.json({
      success: true,
      jurnalTahfiz: {
        id: jurnalObj.id,
        jadwalId: jurnalObj.jadwalId,
        kelasId: jurnalObj.kelasId,
        tanggal: pertemuan.tanggal,
        judul: pertemuan.judul,
        deskripsi: pertemuan.deskripsi,
        waktuInput: pertemuan.waktuInput,
        file: pertemuan.file,
        fotoMengajar: pertemuan.fotoMengajar,
        tahun: jurnalObj.tahun,
        createdAt: jurnalObj.createdAt,
        updatedAt: jurnalObj.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting jurnal tahfiz by jadwalId and tanggal:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data jurnal tahfiz',
      error: error.message,
    });
  }
};

export const createJurnalTahfiz = async (req, res) => {
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
      fotoMengajar,
      tahun,
    } = req.body;

    if (!jadwalId || !kelasId || !tanggal || !judul || !deskripsi || !waktuInput || !tahun) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap',
      });
    }

    // Find existing jurnal for this jadwalId and kelasId
    let jurnalTahfiz = await JurnalTahfiz.findOne({ jadwalId, kelasId });

    // Create new pertemuan object
    const newPertemuan = {
      tanggal,
      judul,
      deskripsi,
      waktuInput,
      file: file || undefined,
      fotoMengajar: fotoMengajar || undefined,
    };

    if (jurnalTahfiz) {
      // Check if pertemuan with this tanggal already exists
      const existingPertemuanIndex = jurnalTahfiz.pertemuan.findIndex(p => p.tanggal === tanggal);
      
      if (existingPertemuanIndex >= 0) {
        // Update existing pertemuan
        jurnalTahfiz.pertemuan[existingPertemuanIndex] = newPertemuan;
      } else {
        // Add new pertemuan
        jurnalTahfiz.pertemuan.push(newPertemuan);
      }
      
      jurnalTahfiz.updatedAt = new Date().toISOString();
      await jurnalTahfiz.save();
    } else {
      // Create new jurnal document
      const jurnalId = id || `jurnal-tahfiz-${jadwalId}-${kelasId}-${Date.now()}`;
      jurnalTahfiz = new JurnalTahfiz({
        id: jurnalId,
        jadwalId,
        kelasId,
        pertemuan: [newPertemuan],
        tahun,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await jurnalTahfiz.save();
    }

    // Return the specific pertemuan
    const pertemuan = jurnalTahfiz.pertemuan.find(p => p.tanggal === tanggal);
    const jurnalObj = jurnalTahfiz.toObject();
    
    return res.status(201).json({
      success: true,
      message: 'Jurnal tahfiz berhasil dibuat',
      jurnalTahfiz: {
        id: jurnalObj.id,
        jadwalId: jurnalObj.jadwalId,
        kelasId: jurnalObj.kelasId,
        tanggal: pertemuan.tanggal,
        judul: pertemuan.judul,
        deskripsi: pertemuan.deskripsi,
        waktuInput: pertemuan.waktuInput,
        file: pertemuan.file,
        fotoMengajar: pertemuan.fotoMengajar,
        tahun: jurnalObj.tahun,
        createdAt: jurnalObj.createdAt,
        updatedAt: jurnalObj.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error creating jurnal tahfiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat jurnal tahfiz',
      error: error.message,
    });
  }
};

export const updateJurnalTahfiz = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const jurnalTahfiz = await JurnalTahfiz.findOne({ id });
    if (!jurnalTahfiz) {
      return res.status(404).json({
        success: false,
        message: 'Jurnal tahfiz tidak ditemukan',
      });
    }

    // If updating a specific pertemuan (tanggal provided)
    if (updateData.tanggal) {
      const pertemuanIndex = jurnalTahfiz.pertemuan.findIndex(p => p.tanggal === updateData.tanggal);
      
      if (pertemuanIndex >= 0) {
        // Update existing pertemuan
        const pertemuan = jurnalTahfiz.pertemuan[pertemuanIndex];
        if (updateData.judul !== undefined) pertemuan.judul = updateData.judul;
        if (updateData.deskripsi !== undefined) pertemuan.deskripsi = updateData.deskripsi;
        if (updateData.waktuInput !== undefined) pertemuan.waktuInput = updateData.waktuInput;
        if (updateData.file !== undefined) pertemuan.file = updateData.file;
        if (updateData.fotoMengajar !== undefined) pertemuan.fotoMengajar = updateData.fotoMengajar;
        
        jurnalTahfiz.pertemuan[pertemuanIndex] = pertemuan;
      } else {
        // Add new pertemuan if not found
        jurnalTahfiz.pertemuan.push({
          tanggal: updateData.tanggal,
          judul: updateData.judul || '',
          deskripsi: updateData.deskripsi || '',
          waktuInput: updateData.waktuInput || new Date().toISOString(),
          file: updateData.file,
          fotoMengajar: updateData.fotoMengajar,
        });
      }
    } else {
      // Update jurnal document fields (not pertemuan)
      delete updateData.id; // Prevent ID change
      delete updateData.pertemuan; // Don't allow direct pertemuan update
      Object.assign(jurnalTahfiz, updateData);
    }

    jurnalTahfiz.updatedAt = new Date().toISOString();
    await jurnalTahfiz.save();

    const updatedJurnal = await JurnalTahfiz.findOne({ id });
    
    // If tanggal was provided, return the specific pertemuan
    if (updateData.tanggal) {
      const pertemuan = updatedJurnal.pertemuan.find(p => p.tanggal === updateData.tanggal);
      const jurnalObj = updatedJurnal.toObject();
      
      return res.json({
        success: true,
        message: 'Jurnal tahfiz berhasil diperbarui',
        jurnalTahfiz: pertemuan ? {
          id: jurnalObj.id,
          jadwalId: jurnalObj.jadwalId,
          kelasId: jurnalObj.kelasId,
          tanggal: pertemuan.tanggal,
          judul: pertemuan.judul,
          deskripsi: pertemuan.deskripsi,
          waktuInput: pertemuan.waktuInput,
          file: pertemuan.file,
          fotoMengajar: pertemuan.fotoMengajar,
          tahun: jurnalObj.tahun,
          createdAt: jurnalObj.createdAt,
          updatedAt: jurnalObj.updatedAt,
        } : updatedJurnal.toObject(),
      });
    }

    return res.json({
      success: true,
      message: 'Jurnal tahfiz berhasil diperbarui',
      jurnalTahfiz: updatedJurnal.toObject(),
    });
  } catch (error) {
    console.error('Error updating jurnal tahfiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui jurnal tahfiz',
      error: error.message,
    });
  }
};

export const deleteJurnalTahfiz = async (req, res) => {
  try {
    const { id } = req.params;
    const jurnalTahfiz = await JurnalTahfiz.findOne({ id });
    if (!jurnalTahfiz) {
      return res.status(404).json({
        success: false,
        message: 'Jurnal tahfiz tidak ditemukan',
      });
    }

    await JurnalTahfiz.deleteOne({ id });
    return res.json({
      success: true,
      message: 'Jurnal tahfiz berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting jurnal tahfiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus jurnal tahfiz',
      error: error.message,
    });
  }
};

// Delete a specific pertemuan from jurnal tahfiz
export const deletePertemuanJurnalTahfiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { tanggal } = req.body;

    if (!tanggal) {
      return res.status(400).json({
        success: false,
        message: 'tanggal diperlukan',
      });
    }

    const jurnalTahfiz = await JurnalTahfiz.findOne({ id });
    if (!jurnalTahfiz) {
      return res.status(404).json({
        success: false,
        message: 'Jurnal tahfiz tidak ditemukan',
      });
    }

    const pertemuanIndex = jurnalTahfiz.pertemuan.findIndex(p => p.tanggal === tanggal);
    if (pertemuanIndex < 0) {
      return res.status(404).json({
        success: false,
        message: 'Pertemuan tidak ditemukan',
      });
    }

    jurnalTahfiz.pertemuan.splice(pertemuanIndex, 1);
    jurnalTahfiz.updatedAt = new Date().toISOString();
    await jurnalTahfiz.save();

    return res.json({
      success: true,
      message: 'Pertemuan berhasil dihapus',
      jurnalTahfiz: jurnalTahfiz.toObject(),
    });
  } catch (error) {
    console.error('Error deleting pertemuan jurnal tahfiz:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus pertemuan',
      error: error.message,
    });
  }
};

