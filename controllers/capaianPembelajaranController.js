import CapaianPembelajaran from '../models/CapaianPembelajaran.js';
import Guru from '../models/Guru.js';

// Get capaian pembelajaran by guru, tahun ajaran, and semester
export const getCapaianPembelajaran = async (req, res) => {
  try {
    const { guruId, tahunAjaran, semester } = req.query;

    if (!guruId || !tahunAjaran || !semester) {
      return res.status(400).json({
        success: false,
        message: 'guruId, tahunAjaran, dan semester wajib diisi',
      });
    }

    const capaianPembelajaran = await CapaianPembelajaran.findOne({
      guruId,
      tahunAjaran,
      semester: parseInt(semester),
    });

    if (!capaianPembelajaran) {
      // Return empty structure if not found
      return res.json({
        success: true,
        capaianPembelajaran: null,
        message: 'Data capaian pembelajaran tidak ditemukan',
      });
    }

    // Populate guru data
    const guru = await Guru.findOne({ id: capaianPembelajaran.guruId });

    const capaianPembelajaranObj = capaianPembelajaran.toObject();
    return res.json({
      success: true,
      capaianPembelajaran: {
        ...capaianPembelajaranObj,
        guru: guru ? {
          id: guru.id,
          name: guru.name,
          nip: guru.nip,
        } : null,
      },
    });
  } catch (error) {
    console.error('Get capaian pembelajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data capaian pembelajaran',
    });
  }
};

// Get all capaian pembelajaran (legacy - for backward compatibility, flattened structure)
export const getAllCapaianPembelajaran = async (req, res) => {
  try {
    const { guruId, tingkat, mataPelajaranId, tahunAjaran, semester } = req.query;
    
    const query = {};
    if (guruId) query.guruId = guruId;
    if (tahunAjaran) query.tahunAjaran = tahunAjaran;
    if (semester) query.semester = parseInt(semester);

    const capaianPembelajaranDocs = await CapaianPembelajaran.find(query).sort({ createdAt: -1 });
    
    // Flatten structure to match old format for backward compatibility
    const flattened = [];
    for (const doc of capaianPembelajaranDocs) {
      for (const tingkatData of doc.tingkatData || []) {
        // Apply tingkat filter if provided
        if (tingkat && tingkatData.tingkat !== parseInt(tingkat)) continue;
        
        for (const mataPelajaranData of tingkatData.mataPelajaranData || []) {
          // Apply mataPelajaranId filter if provided
          if (mataPelajaranId && mataPelajaranData.mataPelajaranId !== mataPelajaranId) continue;
          
          flattened.push({
            id: `${doc.id}-${tingkatData.tingkat}-${mataPelajaranData.mataPelajaranId}`,
            guruId: doc.guruId,
            tingkat: tingkatData.tingkat,
            mataPelajaranId: mataPelajaranData.mataPelajaranId,
            capaianPembelajaran: mataPelajaranData.capaianPembelajaran,
            tahunAjaran: doc.tahunAjaran,
            semester: doc.semester,
            createdAt: doc.createdAt,
          });
        }
      }
    }
    
    return res.json({
      success: true,
      capaianPembelajaran: flattened,
      count: flattened.length,
    });
  } catch (error) {
    console.error('Get all capaian pembelajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data capaian pembelajaran',
    });
  }
};

// Get single capaian pembelajaran by ID (legacy - returns flattened structure)
export const getCapaianPembelajaranById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Parse ID format: docId-tingkat-mataPelajaranId
    const parts = id.split('-');
    if (parts.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'ID tidak valid',
      });
    }
    
    const docId = parts[0];
    const tingkat = parseInt(parts[1]);
    const mataPelajaranId = parts.slice(2).join('-');
    
    const capaianPembelajaran = await CapaianPembelajaran.findOne({ id: docId });
    
    if (!capaianPembelajaran) {
      return res.status(404).json({
        success: false,
        message: 'Capaian pembelajaran tidak ditemukan',
      });
    }
    
    // Find the specific tingkat and mata pelajaran
    const tingkatData = capaianPembelajaran.tingkatData.find(td => td.tingkat === tingkat);
    if (!tingkatData) {
      return res.status(404).json({
        success: false,
        message: 'Tingkat tidak ditemukan',
      });
    }
    
    const mataPelajaranData = tingkatData.mataPelajaranData.find(mpd => mpd.mataPelajaranId === mataPelajaranId);
    if (!mataPelajaranData) {
      return res.status(404).json({
        success: false,
        message: 'Mata pelajaran tidak ditemukan',
      });
    }
    
    return res.json({
      success: true,
      capaianPembelajaran: {
        id,
        guruId: capaianPembelajaran.guruId,
        tingkat: tingkatData.tingkat,
        mataPelajaranId: mataPelajaranData.mataPelajaranId,
        capaianPembelajaran: mataPelajaranData.capaianPembelajaran,
        tahunAjaran: capaianPembelajaran.tahunAjaran,
        semester: capaianPembelajaran.semester,
        createdAt: capaianPembelajaran.createdAt,
      },
    });
  } catch (error) {
    console.error('Get capaian pembelajaran by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data capaian pembelajaran',
    });
  }
};

// Create or update capaian pembelajaran for a guru
export const createOrUpdateCapaianPembelajaran = async (req, res) => {
  try {
    const { guruId, tahunAjaran, semester, tingkatData } = req.body;

    if (!guruId || !tahunAjaran || !semester || !Array.isArray(tingkatData)) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi dan tingkatData harus berupa array',
      });
    }

    // Validate guru exists
    const guru = await Guru.findOne({ id: guruId });
    if (!guru) {
      return res.status(400).json({
        success: false,
        message: 'Guru tidak ditemukan',
      });
    }

    const now = new Date().toISOString();
    const semesterNum = parseInt(semester);

    // Check if capaian pembelajaran already exists
    const existing = await CapaianPembelajaran.findOne({
      guruId,
      tahunAjaran,
      semester: semesterNum,
    });

    if (existing) {
      // Update existing
      existing.tingkatData = tingkatData;
      existing.updatedAt = now;
      await existing.save();

      return res.json({
        success: true,
        capaianPembelajaran: {
          ...existing.toObject(),
          guru: {
            id: guru.id,
            name: guru.name,
            nip: guru.nip,
          },
        },
        message: 'Data capaian pembelajaran berhasil diperbarui',
      });
    } else {
      // Create new
      const newCapaianPembelajaran = new CapaianPembelajaran({
        id: `capaian-${Date.now()}`,
        guruId,
        tahunAjaran,
        semester: semesterNum,
        tingkatData,
        createdAt: now,
        updatedAt: now,
      });

      await newCapaianPembelajaran.save();

      return res.json({
        success: true,
        capaianPembelajaran: {
          ...newCapaianPembelajaran.toObject(),
          guru: {
            id: guru.id,
            name: guru.name,
            nip: guru.nip,
          },
        },
        message: 'Data capaian pembelajaran berhasil dibuat',
      });
    }
  } catch (error) {
    console.error('Create or update capaian pembelajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menyimpan data capaian pembelajaran',
    });
  }
};

// Add or update capaian pembelajaran for a specific tingkat and mata pelajaran
export const addOrUpdateCapaianPembelajaranItem = async (req, res) => {
  try {
    const { guruId, tahunAjaran, semester, tingkat, mataPelajaranId, capaianPembelajaran } = req.body;

    // Log incoming data for debugging
    console.log('Received data:', { guruId, tahunAjaran, semester, tingkat, mataPelajaranId, capaianPembelajaran: capaianPembelajaran?.substring(0, 50) + '...' });

    if (!guruId || !tahunAjaran || !semester || !tingkat || !mataPelajaranId || !capaianPembelajaran) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi',
        received: { guruId: !!guruId, tahunAjaran: !!tahunAjaran, semester: !!semester, tingkat: !!tingkat, mataPelajaranId: !!mataPelajaranId, capaianPembelajaran: !!capaianPembelajaran },
      });
    }

    // Validate guru exists
    const guru = await Guru.findOne({ id: guruId });
    if (!guru) {
      return res.status(400).json({
        success: false,
        message: 'Guru tidak ditemukan',
      });
    }

    let capaianPembelajaranDoc = await CapaianPembelajaran.findOne({
      guruId,
      tahunAjaran,
      semester: parseInt(semester),
    });

    const now = new Date().toISOString();
    const tingkatNum = parseInt(tingkat);

    // If data doesn't exist, create it
    if (!capaianPembelajaranDoc) {
      capaianPembelajaranDoc = new CapaianPembelajaran({
        id: `capaian-${Date.now()}`,
        guruId,
        tahunAjaran,
        semester: parseInt(semester),
        tingkatData: [],
        createdAt: now,
        updatedAt: now,
      });
    }

    // Find or create tingkat data
    const tingkatDataIndex = capaianPembelajaranDoc.tingkatData.findIndex(td => td.tingkat === tingkatNum);
    
    if (tingkatDataIndex === -1) {
      // Create new tingkat data
      capaianPembelajaranDoc.tingkatData.push({
        tingkat: tingkatNum,
        mataPelajaranData: [{
          mataPelajaranId: String(mataPelajaranId),
          capaianPembelajaran: String(capaianPembelajaran),
        }],
      });
    } else {
      // Use existing tingkat data - access directly from array
      const tingkatData = capaianPembelajaranDoc.tingkatData[tingkatDataIndex];
      
      // Find or create mata pelajaran data
      const mataPelajaranIndex = tingkatData.mataPelajaranData.findIndex(
        mpd => String(mpd.mataPelajaranId) === String(mataPelajaranId)
      );

      if (mataPelajaranIndex === -1) {
        // Add new
        tingkatData.mataPelajaranData.push({
          mataPelajaranId: String(mataPelajaranId),
          capaianPembelajaran: String(capaianPembelajaran),
        });
      } else {
        // Update existing - access directly from array
        capaianPembelajaranDoc.tingkatData[tingkatDataIndex].mataPelajaranData[mataPelajaranIndex].capaianPembelajaran = String(capaianPembelajaran);
      }
    }

    // Mark the nested array as modified so Mongoose detects the change
    capaianPembelajaranDoc.markModified('tingkatData');
    capaianPembelajaranDoc.updatedAt = now;
    
    // Save and log the result
    const saved = await capaianPembelajaranDoc.save();
    console.log('Saved data:', JSON.stringify(saved.tingkatData, null, 2));

    return res.json({
      success: true,
      capaianPembelajaran: {
        ...capaianPembelajaranDoc.toObject(),
        guru: {
          id: guru.id,
          name: guru.name,
          nip: guru.nip,
        },
      },
      message: 'Capaian pembelajaran berhasil disimpan',
    });
  } catch (error) {
    console.error('Add or update capaian pembelajaran item error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menyimpan capaian pembelajaran',
    });
  }
};

// Delete capaian pembelajaran for a specific tingkat and mata pelajaran
export const deleteCapaianPembelajaranItem = async (req, res) => {
  try {
    const { guruId, tahunAjaran, semester, tingkat, mataPelajaranId } = req.body;

    if (!guruId || !tahunAjaran || !semester || !tingkat || !mataPelajaranId) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi',
      });
    }

    const capaianPembelajaranDoc = await CapaianPembelajaran.findOne({
      guruId,
      tahunAjaran,
      semester: parseInt(semester),
    });

    if (!capaianPembelajaranDoc) {
      return res.status(404).json({
        success: false,
        message: 'Data capaian pembelajaran tidak ditemukan',
      });
    }

    const tingkatNum = parseInt(tingkat);
    const tingkatDataIndex = capaianPembelajaranDoc.tingkatData.findIndex(
      td => td.tingkat === tingkatNum
    );

    if (tingkatDataIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Tingkat tidak ditemukan',
      });
    }

    const tingkatData = capaianPembelajaranDoc.tingkatData[tingkatDataIndex];
    tingkatData.mataPelajaranData = tingkatData.mataPelajaranData.filter(
      mpd => mpd.mataPelajaranId !== mataPelajaranId
    );

    // If no more mata pelajaran in this tingkat, remove the tingkat
    if (tingkatData.mataPelajaranData.length === 0) {
      capaianPembelajaranDoc.tingkatData.splice(tingkatDataIndex, 1);
    }

    capaianPembelajaranDoc.updatedAt = new Date().toISOString();
    await capaianPembelajaranDoc.save();

    // Populate guru data
    const guru = await Guru.findOne({ id: capaianPembelajaranDoc.guruId });

    return res.json({
      success: true,
      capaianPembelajaran: {
        ...capaianPembelajaranDoc.toObject(),
        guru: guru ? {
          id: guru.id,
          name: guru.name,
          nip: guru.nip,
        } : null,
      },
      message: 'Capaian pembelajaran berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete capaian pembelajaran item error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus capaian pembelajaran',
    });
  }
};

// Legacy: Update capaian pembelajaran (for backward compatibility)
export const updateCapaianPembelajaran = async (req, res) => {
  try {
    const { id } = req.params;
    const { capaianPembelajaran } = req.body;

    if (!capaianPembelajaran) {
      return res.status(400).json({
        success: false,
        message: 'Capaian pembelajaran wajib diisi',
      });
    }

    // Parse ID format: docId-tingkat-mataPelajaranId
    const parts = id.split('-');
    if (parts.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'ID tidak valid',
      });
    }
    
    const docId = parts[0];
    const tingkat = parseInt(parts[1]);
    const mataPelajaranId = parts.slice(2).join('-');

    const existing = await CapaianPembelajaran.findOne({ id: docId });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Capaian pembelajaran tidak ditemukan',
      });
    }

    // Find and update the specific tingkat and mata pelajaran
    const tingkatData = existing.tingkatData.find(td => td.tingkat === tingkat);
    if (!tingkatData) {
      return res.status(404).json({
        success: false,
        message: 'Tingkat tidak ditemukan',
      });
    }

    const mataPelajaranData = tingkatData.mataPelajaranData.find(mpd => mpd.mataPelajaranId === mataPelajaranId);
    if (!mataPelajaranData) {
      return res.status(404).json({
        success: false,
        message: 'Mata pelajaran tidak ditemukan',
      });
    }

    mataPelajaranData.capaianPembelajaran = capaianPembelajaran;
    existing.updatedAt = new Date().toISOString();
    await existing.save();

    return res.json({
      success: true,
      capaianPembelajaran: {
        id,
        guruId: existing.guruId,
        tingkat: tingkatData.tingkat,
        mataPelajaranId: mataPelajaranData.mataPelajaranId,
        capaianPembelajaran: mataPelajaranData.capaianPembelajaran,
        tahunAjaran: existing.tahunAjaran,
        semester: existing.semester,
        createdAt: existing.createdAt,
      },
      message: 'Capaian pembelajaran berhasil diperbarui',
    });
  } catch (error) {
    console.error('Update capaian pembelajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui capaian pembelajaran',
    });
  }
};

// Legacy: Delete capaian pembelajaran (for backward compatibility)
export const deleteCapaianPembelajaran = async (req, res) => {
  try {
    const { id } = req.params;

    // Parse ID format: docId-tingkat-mataPelajaranId
    const parts = id.split('-');
    if (parts.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'ID tidak valid',
      });
    }
    
    const docId = parts[0];
    const tingkat = parseInt(parts[1]);
    const mataPelajaranId = parts.slice(2).join('-');

    const capaianPembelajaran = await CapaianPembelajaran.findOne({ id: docId });

    if (!capaianPembelajaran) {
      return res.status(404).json({
        success: false,
        message: 'Capaian pembelajaran tidak ditemukan',
      });
    }

    // Find and remove the specific tingkat and mata pelajaran
    const tingkatDataIndex = capaianPembelajaran.tingkatData.findIndex(td => td.tingkat === tingkat);
    if (tingkatDataIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Tingkat tidak ditemukan',
      });
    }

    const tingkatData = capaianPembelajaran.tingkatData[tingkatDataIndex];
    tingkatData.mataPelajaranData = tingkatData.mataPelajaranData.filter(
      mpd => mpd.mataPelajaranId !== mataPelajaranId
    );

    // If no more mata pelajaran in this tingkat, remove the tingkat
    if (tingkatData.mataPelajaranData.length === 0) {
      capaianPembelajaran.tingkatData.splice(tingkatDataIndex, 1);
    }

    capaianPembelajaran.updatedAt = new Date().toISOString();
    await capaianPembelajaran.save();

    return res.json({
      success: true,
      message: 'Capaian pembelajaran berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete capaian pembelajaran error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus capaian pembelajaran',
    });
  }
};
