import Nilai from '../models/Nilai.js';
import { calculateAndUpdateNilaiAkhir, recalculateAllMuridNilaiAkhir } from '../utils/nilaiUtils.js';

// Get all nilai (dengan transformasi ke format flat untuk kompatibilitas frontend)
export const getAllNilai = async (req, res) => {
  try {
    const { guruId, kelasId, mataPelajaranId, muridId, semester, tahunAjaran } = req.query;
    
    const filter = {};
    if (guruId) filter.guruId = guruId;
    if (kelasId) filter.kelasId = kelasId;
    if (mataPelajaranId) filter.mataPelajaranId = mataPelajaranId;
    if (semester) filter.semester = parseInt(semester);
    if (tahunAjaran) filter.tahunAjaran = tahunAjaran;

    const nilaiDocs = await Nilai.find(filter);
    
    // Transform ke format flat (satu item per murid) untuk kompatibilitas frontend
    const flatNilai = [];
    nilaiDocs.forEach(doc => {
      doc.dataNilai.forEach(muridNilai => {
        // Filter by muridId jika ada
        if (muridId && muridNilai.muridId !== muridId) return;
        
        flatNilai.push({
          id: `${doc.id}-${muridNilai.muridId}`,
          muridId: muridNilai.muridId,
          mataPelajaranId: doc.mataPelajaranId,
          kelasId: doc.kelasId,
          guruId: doc.guruId,
          semester: doc.semester,
          tahunAjaran: doc.tahunAjaran,
          tugas: muridNilai.tugas || [],
          uts: muridNilai.uts,
          uas: muridNilai.uas,
          nilaiAkhir: muridNilai.nilaiAkhir,
          grade: muridNilai.grade,
          komponenDinamis: muridNilai.komponenDinamis || [],
          createdAt: doc.createdAt,
          updatedAt: muridNilai.updatedAt || doc.updatedAt,
        });
      });
    });
    
    res.json({
      success: true,
      nilai: flatNilai,
    });
  } catch (error) {
    console.error('Error getting nilai:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data nilai',
      error: error.message,
    });
  }
};

// Get nilai by ID (format: docId-muridId)
export const getNilaiById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cari di semua dokumen
    const nilaiDocs = await Nilai.find({});
    
    for (const doc of nilaiDocs) {
      for (const muridNilai of doc.dataNilai) {
        const flatId = `${doc.id}-${muridNilai.muridId}`;
        if (flatId === id) {
          return res.json({
            success: true,
            nilai: {
              id: flatId,
              muridId: muridNilai.muridId,
              mataPelajaranId: doc.mataPelajaranId,
              kelasId: doc.kelasId,
              guruId: doc.guruId,
              semester: doc.semester,
              tahunAjaran: doc.tahunAjaran,
              tugas: muridNilai.tugas || [],
              uts: muridNilai.uts,
              uas: muridNilai.uas,
              nilaiAkhir: muridNilai.nilaiAkhir,
              grade: muridNilai.grade,
              komponenDinamis: muridNilai.komponenDinamis || [],
              createdAt: doc.createdAt,
              updatedAt: muridNilai.updatedAt || doc.updatedAt,
            },
          });
        }
      }
    }

    return res.status(404).json({
      success: false,
      message: 'Nilai tidak ditemukan',
    });
  } catch (error) {
    console.error('Error getting nilai by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data nilai',
      error: error.message,
    });
  }
};

// Create atau update nilai untuk satu murid
export const createNilai = async (req, res) => {
  try {
    const nilaiData = req.body;
    const { muridId, mataPelajaranId, kelasId, guruId, semester, tahunAjaran } = nilaiData;

    // Cari atau buat dokumen nilai untuk kombinasi ini
    let nilaiDoc = await Nilai.findOne({
      mataPelajaranId,
      kelasId,
      semester,
      tahunAjaran,
    });

    const now = new Date().toISOString();

    if (!nilaiDoc) {
      // Buat dokumen baru
      nilaiDoc = new Nilai({
        id: `nilai-${mataPelajaranId}-${kelasId}-${semester}-${tahunAjaran}`,
        mataPelajaranId,
        kelasId,
        guruId,
        semester,
        tahunAjaran,
        dataNilai: [],
        createdAt: now,
        updatedAt: now,
      });
      
      // Prepare murid nilai data
      const muridNilaiData = {
        muridId,
        tugas: nilaiData.tugas || [],
        uts: nilaiData.uts,
        uas: nilaiData.uas,
        komponenDinamis: nilaiData.komponenDinamis || [],
        updatedAt: now,
      };

      // Recalculate nilai akhir and grade
      const calculatedNilai = await calculateAndUpdateNilaiAkhir(
        muridNilaiData,
        mataPelajaranId,
        kelasId,
        guruId,
        semester,
        tahunAjaran
      );

      nilaiDoc.dataNilai.push(calculatedNilai);
      await nilaiDoc.save();
    } else {
      // Cek apakah murid sudah ada dalam array
      const muridIndex = nilaiDoc.dataNilai.findIndex(n => n.muridId === muridId);
      
      if (muridIndex >= 0) {
        return res.status(400).json({
          success: false,
          message: 'Nilai untuk murid ini sudah ada',
        });
      }
      
      // Tambah murid baru ke array
      const muridNilaiData = {
        muridId,
        tugas: nilaiData.tugas || [],
        uts: nilaiData.uts,
        uas: nilaiData.uas,
        komponenDinamis: nilaiData.komponenDinamis || [],
        updatedAt: now,
      };

      // Recalculate nilai akhir and grade
      const calculatedNilai = await calculateAndUpdateNilaiAkhir(
        muridNilaiData,
        nilaiDoc.mataPelajaranId,
        nilaiDoc.kelasId,
        nilaiDoc.guruId,
        nilaiDoc.semester,
        nilaiDoc.tahunAjaran
      );

      nilaiDoc.dataNilai.push(calculatedNilai);
      nilaiDoc.updatedAt = now;
      await nilaiDoc.save();
    }

    // Return dalam format flat
    const muridNilai = nilaiDoc.dataNilai.find(n => n.muridId === muridId);
    res.status(201).json({
      success: true,
      message: 'Nilai berhasil dibuat',
      nilai: {
        id: `${nilaiDoc.id}-${muridId}`,
        muridId,
        mataPelajaranId: nilaiDoc.mataPelajaranId,
        kelasId: nilaiDoc.kelasId,
        guruId: nilaiDoc.guruId,
        semester: nilaiDoc.semester,
        tahunAjaran: nilaiDoc.tahunAjaran,
        tugas: muridNilai.tugas || [],
        uts: muridNilai.uts,
        uas: muridNilai.uas,
        nilaiAkhir: muridNilai.nilaiAkhir,
        grade: muridNilai.grade,
        komponenDinamis: muridNilai.komponenDinamis || [],
        createdAt: nilaiDoc.createdAt,
        updatedAt: muridNilai.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error creating nilai:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat nilai',
      error: error.message,
    });
  }
};

// Update nilai murid
export const updateNilai = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Parse ID untuk mendapatkan docId dan muridId
    // Format: nilai-mapelId-kelasId-semester-tahunAjaran-muridId
    const parts = id.split('-');
    const muridId = updates.muridId || parts[parts.length - 1];
    
    // Cari dokumen berdasarkan kombinasi
    const nilaiDoc = await Nilai.findOne({
      mataPelajaranId: updates.mataPelajaranId,
      kelasId: updates.kelasId,
      semester: updates.semester,
      tahunAjaran: updates.tahunAjaran,
    });

    if (!nilaiDoc) {
      return res.status(404).json({
        success: false,
        message: 'Nilai tidak ditemukan',
      });
    }

    // Cari murid dalam array
    const muridIndex = nilaiDoc.dataNilai.findIndex(n => n.muridId === muridId);
    
    if (muridIndex < 0) {
      return res.status(404).json({
        success: false,
        message: 'Nilai murid tidak ditemukan',
      });
    }

    const now = new Date().toISOString();

    // Check if tugas or komponen dinamis is being updated
    const isTugasUpdated = updates.tugas !== undefined && 
      JSON.stringify(nilaiDoc.dataNilai[muridIndex].tugas || []) !== JSON.stringify(updates.tugas || []);
    const isKomponenDinamisUpdated = updates.komponenDinamis !== undefined && 
      JSON.stringify(nilaiDoc.dataNilai[muridIndex].komponenDinamis || []) !== JSON.stringify(updates.komponenDinamis || []);

    // Update data murid
    if (updates.tugas !== undefined) nilaiDoc.dataNilai[muridIndex].tugas = updates.tugas;
    if (updates.uts !== undefined) nilaiDoc.dataNilai[muridIndex].uts = updates.uts;
    if (updates.uas !== undefined) nilaiDoc.dataNilai[muridIndex].uas = updates.uas;
    if (updates.komponenDinamis !== undefined) nilaiDoc.dataNilai[muridIndex].komponenDinamis = updates.komponenDinamis;
    nilaiDoc.dataNilai[muridIndex].updatedAt = now;
    nilaiDoc.updatedAt = now;

    // Recalculate nilai akhir and grade (ignore nilaiAkhir and grade from updates)
    const updatedMuridNilai = await calculateAndUpdateNilaiAkhir(
      nilaiDoc.dataNilai[muridIndex],
      nilaiDoc.mataPelajaranId,
      nilaiDoc.kelasId,
      nilaiDoc.guruId,
      nilaiDoc.semester,
      nilaiDoc.tahunAjaran
    );
    nilaiDoc.dataNilai[muridIndex].nilaiAkhir = updatedMuridNilai.nilaiAkhir;
    nilaiDoc.dataNilai[muridIndex].grade = updatedMuridNilai.grade;

    await nilaiDoc.save();

    // If tugas or komponen dinamis was updated, recalculate all murid in the same class
    if (isTugasUpdated || isKomponenDinamisUpdated) {
      await recalculateAllMuridNilaiAkhir(
        nilaiDoc.mataPelajaranId,
        nilaiDoc.kelasId,
        nilaiDoc.semester,
        nilaiDoc.tahunAjaran
      );
    }

    const muridNilai = nilaiDoc.dataNilai[muridIndex];
    res.json({
      success: true,
      message: 'Nilai berhasil diupdate',
      nilai: {
        id: `${nilaiDoc.id}-${muridId}`,
        muridId,
        mataPelajaranId: nilaiDoc.mataPelajaranId,
        kelasId: nilaiDoc.kelasId,
        guruId: nilaiDoc.guruId,
        semester: nilaiDoc.semester,
        tahunAjaran: nilaiDoc.tahunAjaran,
        tugas: muridNilai.tugas || [],
        uts: muridNilai.uts,
        uas: muridNilai.uas,
        nilaiAkhir: muridNilai.nilaiAkhir,
        grade: muridNilai.grade,
        komponenDinamis: muridNilai.komponenDinamis || [],
        createdAt: nilaiDoc.createdAt,
        updatedAt: muridNilai.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating nilai:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate nilai',
      error: error.message,
    });
  }
};

// Delete nilai murid
export const deleteNilai = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cari di semua dokumen dan hapus murid dari array
    const nilaiDocs = await Nilai.find({});
    
    for (const doc of nilaiDocs) {
      for (let i = 0; i < doc.dataNilai.length; i++) {
        const flatId = `${doc.id}-${doc.dataNilai[i].muridId}`;
        if (flatId === id) {
          doc.dataNilai.splice(i, 1);
          doc.updatedAt = new Date().toISOString();
          await doc.save();
          
          return res.json({
            success: true,
            message: 'Nilai berhasil dihapus',
          });
        }
      }
    }

    return res.status(404).json({
      success: false,
      message: 'Nilai tidak ditemukan',
    });
  } catch (error) {
    console.error('Error deleting nilai:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus nilai',
      error: error.message,
    });
  }
};

// Upsert nilai (create or update) - untuk satu murid
export const upsertNilai = async (req, res) => {
  try {
    const nilaiData = req.body;
    const { muridId, mataPelajaranId, kelasId, guruId, semester, tahunAjaran } = nilaiData;

    // Cari atau buat dokumen nilai untuk kombinasi ini
    let nilaiDoc = await Nilai.findOne({
      mataPelajaranId,
      kelasId,
      semester,
      tahunAjaran,
    });

    const now = new Date().toISOString();
    let isNew = false;

    if (!nilaiDoc) {
      // Buat dokumen baru
      isNew = true;
      nilaiDoc = new Nilai({
        id: `nilai-${mataPelajaranId}-${kelasId}-${semester}-${tahunAjaran}`,
        mataPelajaranId,
        kelasId,
        guruId,
        semester,
        tahunAjaran,
        dataNilai: [],
        createdAt: now,
        updatedAt: now,
      });
    }

    // Cari murid dalam array
    const muridIndex = nilaiDoc.dataNilai.findIndex(n => n.muridId === muridId);
    
    // Check if tugas or komponen dinamis is being updated (to trigger recalculation of all murid)
    const isTugasUpdated = muridIndex >= 0 && 
      JSON.stringify(nilaiDoc.dataNilai[muridIndex].tugas || []) !== JSON.stringify(nilaiData.tugas || []);
    const isKomponenDinamisUpdated = muridIndex >= 0 && 
      JSON.stringify(nilaiDoc.dataNilai[muridIndex].komponenDinamis || []) !== JSON.stringify(nilaiData.komponenDinamis || []);
    
    const muridNilaiData = {
      muridId,
      tugas: nilaiData.tugas || [],
      uts: nilaiData.uts,
      uas: nilaiData.uas,
      komponenDinamis: nilaiData.komponenDinamis || [],
      updatedAt: now,
    };

    // Recalculate nilai akhir and grade (ignore nilaiAkhir and grade from frontend)
    const calculatedNilai = await calculateAndUpdateNilaiAkhir(
      muridNilaiData,
      nilaiDoc.mataPelajaranId,
      nilaiDoc.kelasId,
      nilaiDoc.guruId,
      nilaiDoc.semester,
      nilaiDoc.tahunAjaran
    );

    if (muridIndex >= 0) {
      // Update existing
      nilaiDoc.dataNilai[muridIndex] = calculatedNilai;
    } else {
      // Add new
      isNew = true;
      nilaiDoc.dataNilai.push(calculatedNilai);
    }

    nilaiDoc.updatedAt = now;
    await nilaiDoc.save();

    // If tugas or komponen dinamis was updated, recalculate all murid in the same class
    // because max count may have changed
    if (isTugasUpdated || isKomponenDinamisUpdated) {
      await recalculateAllMuridNilaiAkhir(
        nilaiDoc.mataPelajaranId,
        nilaiDoc.kelasId,
        nilaiDoc.semester,
        nilaiDoc.tahunAjaran
      );
    }

    const muridNilai = nilaiDoc.dataNilai.find(n => n.muridId === muridId);
    res.json({
      success: true,
      message: isNew ? 'Nilai berhasil dibuat' : 'Nilai berhasil diupdate',
      nilai: {
        id: `${nilaiDoc.id}-${muridId}`,
        muridId,
        mataPelajaranId: nilaiDoc.mataPelajaranId,
        kelasId: nilaiDoc.kelasId,
        guruId: nilaiDoc.guruId,
        semester: nilaiDoc.semester,
        tahunAjaran: nilaiDoc.tahunAjaran,
        tugas: muridNilai.tugas || [],
        uts: muridNilai.uts,
        uas: muridNilai.uas,
        nilaiAkhir: muridNilai.nilaiAkhir,
        grade: muridNilai.grade,
        komponenDinamis: muridNilai.komponenDinamis || [],
        createdAt: nilaiDoc.createdAt,
        updatedAt: muridNilai.updatedAt,
      },
      isNew,
    });
  } catch (error) {
    console.error('Error upserting nilai:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menyimpan nilai',
      error: error.message,
    });
  }
};

// Bulk upsert nilai (for import) - multiple murid sekaligus
export const bulkUpsertNilai = async (req, res) => {
  try {
    const { nilaiList } = req.body;

    if (!Array.isArray(nilaiList) || nilaiList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Data nilai tidak valid',
      });
    }

    const now = new Date().toISOString();
    const results = [];

    // Group by kombinasi mapel/kelas/semester/tahunAjaran
    const grouped = {};
    nilaiList.forEach(item => {
      const key = `${item.mataPelajaranId}-${item.kelasId}-${item.semester}-${item.tahunAjaran}`;
      if (!grouped[key]) {
        grouped[key] = {
          mataPelajaranId: item.mataPelajaranId,
          kelasId: item.kelasId,
          guruId: item.guruId,
          semester: item.semester,
          tahunAjaran: item.tahunAjaran,
          muridList: [],
        };
      }
      grouped[key].muridList.push(item);
    });

    // Process each group
    for (const key in grouped) {
      const group = grouped[key];
      const { mataPelajaranId, kelasId, guruId, semester, tahunAjaran, muridList } = group;

      // Cari atau buat dokumen
      let nilaiDoc = await Nilai.findOne({
        mataPelajaranId,
        kelasId,
        semester,
        tahunAjaran,
      });

      if (!nilaiDoc) {
        nilaiDoc = new Nilai({
          id: `nilai-${mataPelajaranId}-${kelasId}-${semester}-${tahunAjaran}`,
          mataPelajaranId,
          kelasId,
          guruId,
          semester,
          tahunAjaran,
          dataNilai: [],
          createdAt: now,
          updatedAt: now,
        });
      }

      // Upsert setiap murid
      for (const item of muridList) {
        const muridIndex = nilaiDoc.dataNilai.findIndex(n => n.muridId === item.muridId);
        
        const muridNilaiData = {
          muridId: item.muridId,
          tugas: item.tugas || [],
          uts: item.uts,
          uas: item.uas,
          komponenDinamis: item.komponenDinamis || [],
          updatedAt: now,
        };

        // Recalculate nilai akhir and grade (ignore nilaiAkhir and grade from frontend)
        const calculatedNilai = await calculateAndUpdateNilaiAkhir(
          muridNilaiData,
          mataPelajaranId,
          kelasId,
          guruId,
          semester,
          tahunAjaran
        );

        if (muridIndex >= 0) {
          nilaiDoc.dataNilai[muridIndex] = calculatedNilai;
        } else {
          nilaiDoc.dataNilai.push(calculatedNilai);
        }

        results.push({
          id: `${nilaiDoc.id}-${item.muridId}`,
          muridId: item.muridId,
          mataPelajaranId,
          kelasId,
          guruId,
          semester,
          tahunAjaran,
          tugas: calculatedNilai.tugas,
          uts: calculatedNilai.uts,
          uas: calculatedNilai.uas,
          nilaiAkhir: calculatedNilai.nilaiAkhir,
          grade: calculatedNilai.grade,
          komponenDinamis: calculatedNilai.komponenDinamis,
          createdAt: nilaiDoc.createdAt,
          updatedAt: calculatedNilai.updatedAt,
        });
      }

      nilaiDoc.updatedAt = now;
      await nilaiDoc.save();

      // Recalculate all murid in this class after bulk update
      // because max tugas count may have changed
      await recalculateAllMuridNilaiAkhir(
        mataPelajaranId,
        kelasId,
        semester,
        tahunAjaran
      );

      // Reload nilaiDoc to get recalculated values
      const updatedNilaiDoc = await Nilai.findOne({
        mataPelajaranId,
        kelasId,
        semester,
        tahunAjaran,
      });

      // Update results with recalculated values for murid in this group
      if (updatedNilaiDoc) {
        muridList.forEach((item, itemIndex) => {
          const updatedMuridNilai = updatedNilaiDoc.dataNilai.find(n => n.muridId === item.muridId);
          if (updatedMuridNilai) {
            // Find the result for this murid and update it
            const resultIndex = results.findIndex(r => r.muridId === item.muridId);
            if (resultIndex >= 0) {
              results[resultIndex].nilaiAkhir = updatedMuridNilai.nilaiAkhir;
              results[resultIndex].grade = updatedMuridNilai.grade;
            }
          }
        });
      }
    }

    res.json({
      success: true,
      message: `${results.length} nilai berhasil disimpan`,
      nilai: results,
    });
  } catch (error) {
    console.error('Error bulk upserting nilai:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menyimpan nilai',
      error: error.message,
    });
  }
};
