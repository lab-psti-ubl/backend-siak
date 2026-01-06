import NilaiEkstrakulikuler from '../models/NilaiEkstrakulikuler.js';
import Ekstrakulikuler from '../models/Ekstrakulikuler.js';
import Guru from '../models/Guru.js';
import Murid from '../models/Murid.js';
import PengaturanGrade from '../models/PengaturanGrade.js';
import Kelas from '../models/Kelas.js';

// Helper function to get predikat from nilai (using deskripsi from grade)
const getPredikatFromNilai = (nilai, grades) => {
  // Ensure nilai is a number
  const nilaiNumber = typeof nilai === 'number' ? nilai : parseFloat(nilai);
  
  if (isNaN(nilaiNumber)) {
    console.error(`Invalid nilai: ${nilai}`);
    return 'Sangat Kurang';
  }

  // Find grade that matches the nilai range from database
  // Sort by minNilai descending to check from highest range first
  const sortedGrades = [...grades].sort((a, b) => b.minNilai - a.minNilai);
  const grade = sortedGrades.find(g => {
    const minNilai = typeof g.minNilai === 'number' ? g.minNilai : parseFloat(g.minNilai);
    const maxNilai = typeof g.maxNilai === 'number' ? g.maxNilai : parseFloat(g.maxNilai);
    return nilaiNumber >= minNilai && nilaiNumber <= maxNilai;
  });
  
  // Use deskripsi from database if grade found
  if (grade) {
    return grade.deskripsi || grade.grade || 'Sangat Kurang';
  }
  
  // Fallback to hardcoded grade ranges if no match found in database
  const hardcodedGrades = [
    { min: 86, max: 100, deskripsi: 'Sangat Baik' },
    { min: 71, max: 85, deskripsi: 'Baik' },
    { min: 56, max: 70, deskripsi: 'Cukup' },
    { min: 41, max: 55, deskripsi: 'Kurang' },
    { min: 0, max: 40, deskripsi: 'Sangat Kurang' },
  ];
  
  const hardcodedGrade = hardcodedGrades.find(g => nilaiNumber >= g.min && nilaiNumber <= g.max);
  
  if (hardcodedGrade) {
    return hardcodedGrade.deskripsi;
  }
  
  // Final fallback
  return 'Sangat Kurang';
};

// Helper function to generate keterangan based on predikat and kegiatan
const generateKeterangan = (predikat, namaKegiatan) => {
  const keteranganMap = {
    'Sangat Baik': `Aktif mengikuti seluruh kegiatan ${namaKegiatan}, disiplin, bertanggung jawab, dan memahami materi ${namaKegiatan} dengan sangat baik.`,
    'Baik': `Mengikuti kegiatan ${namaKegiatan} dengan baik dan memahami sebagian besar materi yang diberikan.`,
    'Cukup': `Mengikuti kegiatan ${namaKegiatan} dengan cukup baik dan memahami materi dasar.`,
    'Kurang': `Kurang aktif dalam kegiatan ${namaKegiatan} dan pemahaman materi masih terbatas.`,
    'Sangat Kurang': `Sangat kurang aktif dalam kegiatan ${namaKegiatan} dan belum memahami materi yang diberikan.`,
  };

  // Check if predikat matches any key (case insensitive)
  const predikatLower = predikat.toLowerCase();
  for (const [key, value] of Object.entries(keteranganMap)) {
    if (key.toLowerCase() === predikatLower) {
      return value;
    }
  }

  // Default keterangan if predikat doesn't match
  return `Mengikuti kegiatan ${namaKegiatan} dengan predikat ${predikat}.`;
};

// Get nilai ekstrakulikuler by kelas, tahun ajaran, and semester
export const getNilaiEkstrakulikuler = async (req, res) => {
  try {
    const { kelasId, tahunAjaran, semester } = req.query;

    if (!kelasId || !tahunAjaran || !semester) {
      return res.status(400).json({
        success: false,
        message: 'kelasId, tahunAjaran, dan semester wajib diisi',
      });
    }

    const nilaiEkstrakulikuler = await NilaiEkstrakulikuler.findOne({
      kelasId,
      tahunAjaran,
      semester: parseInt(semester),
    });

    if (!nilaiEkstrakulikuler) {
      // Return empty structure if not found
      return res.json({
        success: true,
        nilaiEkstrakulikuler: null,
        message: 'Data nilai ekstrakulikuler tidak ditemukan',
      });
    }

    // Check if this is new structure (has kelasId and muridData)
    if (!nilaiEkstrakulikuler.kelasId || !nilaiEkstrakulikuler.muridData) {
      // Old structure - return empty
      return res.json({
        success: true,
        nilaiEkstrakulikuler: null,
        message: 'Data nilai ekstrakulikuler tidak ditemukan',
      });
    }

    // Populate kelas and wali kelas data
    const kelas = await Kelas.findOne({ id: nilaiEkstrakulikuler.kelasId });
    const waliKelas = nilaiEkstrakulikuler.waliKelasId 
      ? await Guru.findOne({ id: nilaiEkstrakulikuler.waliKelasId })
      : null;

    // Populate murid data and ekstrakulikuler data
    const muridDataWithDetails = await Promise.all(
      (nilaiEkstrakulikuler.muridData || []).map(async (item) => {
        const murid = await Murid.findOne({ id: item.muridId });
        
        const nilaiEkstraWithDetails = await Promise.all(
          (item.nilaiEkstrakulikuler || []).map(async (nilaiEkstra) => {
            const ekstra = await Ekstrakulikuler.findOne({ id: nilaiEkstra.ekstrakulikulerId });
            return {
              ...nilaiEkstra.toObject(),
              ekstrakulikuler: ekstra ? {
                id: ekstra.id,
                nama: ekstra.nama,
                deskripsi: ekstra.deskripsi,
              } : null,
            };
          })
        );

        return {
          muridId: item.muridId,
          nilaiEkstrakulikuler: nilaiEkstraWithDetails,
          murid: murid ? {
            id: murid.id,
            name: murid.name,
            nisn: murid.nisn,
            email: murid.email,
          } : null,
        };
      })
    );

    const nilaiEkstrakulikulerObj = nilaiEkstrakulikuler.toObject();
    return res.json({
      success: true,
      nilaiEkstrakulikuler: {
        ...nilaiEkstrakulikulerObj,
        kelas: kelas ? {
          id: kelas.id,
          name: kelas.name,
          tingkat: kelas.tingkat,
        } : null,
        waliKelas: waliKelas ? {
          id: waliKelas.id,
          name: waliKelas.name,
          nip: waliKelas.nip,
        } : null,
        muridData: muridDataWithDetails,
      },
    });
  } catch (error) {
    console.error('Get nilai ekstrakulikuler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data nilai ekstrakulikuler',
    });
  }
};

// Get nilai ekstrakulikuler by muridId (for detail view)
export const getNilaiEkstrakulikulerByMuridId = async (req, res) => {
  try {
    const { muridId } = req.params;
    const { semester, tahunAjaran } = req.query;

    if (!muridId || !semester || !tahunAjaran) {
      return res.status(400).json({
        success: false,
        message: 'muridId, semester, dan tahunAjaran wajib diisi',
      });
    }

    // Find murid to get kelasId
    const murid = await Murid.findOne({ id: muridId });
    if (!murid) {
      return res.status(404).json({
        success: false,
        message: 'Murid tidak ditemukan',
      });
    }

    // Get nilai ekstrakulikuler for the class
    const nilaiEkstrakulikuler = await NilaiEkstrakulikuler.findOne({
      kelasId: murid.kelasId,
      tahunAjaran,
      semester: parseInt(semester),
    });

    if (!nilaiEkstrakulikuler) {
      return res.json({
        success: true,
        nilaiEkstrakulikuler: [],
        count: 0,
      });
    }

    // Find murid data in the class
    const muridData = nilaiEkstrakulikuler.muridData.find(md => md.muridId === muridId);

    if (!muridData) {
      return res.json({
        success: true,
        nilaiEkstrakulikuler: [],
        count: 0,
      });
    }

    // Populate ekstrakulikuler data
    const nilaiEkstraWithDetails = await Promise.all(
      muridData.nilaiEkstrakulikuler.map(async (nilaiEkstra) => {
        const ekstra = await Ekstrakulikuler.findOne({ id: nilaiEkstra.ekstrakulikulerId });
        return {
          ...nilaiEkstra.toObject(),
          ekstrakulikuler: ekstra ? {
            id: ekstra.id,
            nama: ekstra.nama,
            deskripsi: ekstra.deskripsi,
          } : null,
        };
      })
    );

    return res.json({
      success: true,
      nilaiEkstrakulikuler: nilaiEkstraWithDetails,
      count: nilaiEkstraWithDetails.length,
    });
  } catch (error) {
    console.error('Get nilai ekstrakulikuler by muridId error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data nilai ekstrakulikuler',
    });
  }
};

// Create or update nilai ekstrakulikuler for a class
export const createOrUpdateNilaiEkstrakulikuler = async (req, res) => {
  try {
    const { kelasId, waliKelasId, tahunAjaran, semester, muridData } = req.body;

    if (!kelasId || !waliKelasId || !tahunAjaran || !semester || !Array.isArray(muridData)) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi dan muridData harus berupa array',
      });
    }

    // Validate kelas exists
    const kelas = await Kelas.findOne({ id: kelasId });
    if (!kelas) {
      return res.status(400).json({
        success: false,
        message: 'Kelas tidak ditemukan',
      });
    }

    // Validate wali kelas exists and is a guru
    const waliKelas = await Guru.findOne({ id: waliKelasId });
    if (!waliKelas) {
      return res.status(400).json({
        success: false,
        message: 'Wali kelas tidak ditemukan',
      });
    }

    // Validate all murid exist and are active in the class
    const muridIds = muridData.map(item => item.muridId);
    const muridList = await Murid.find({
      id: { $in: muridIds },
      kelasId: kelasId,
      isActive: true,
    });

    if (muridList.length !== muridIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Beberapa murid tidak ditemukan atau tidak aktif di kelas ini',
      });
    }

    // Validate ekstrakulikuler exists for all nilai
    const allEkstraIds = [];
    muridData.forEach(item => {
      if (item.nilaiEkstrakulikuler && Array.isArray(item.nilaiEkstrakulikuler)) {
        item.nilaiEkstrakulikuler.forEach(nilaiEkstra => {
          if (nilaiEkstra.ekstrakulikulerId) {
            allEkstraIds.push(nilaiEkstra.ekstrakulikulerId);
          }
        });
      }
    });

    if (allEkstraIds.length > 0) {
      const uniqueEkstraIds = [...new Set(allEkstraIds)];
      const ekstraList = await Ekstrakulikuler.find({ id: { $in: uniqueEkstraIds } });
      if (ekstraList.length !== uniqueEkstraIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Beberapa ekstrakulikuler tidak ditemukan',
        });
      }
    }

    const now = new Date().toISOString();
    const semesterNum = parseInt(semester);

    // Check if nilai ekstrakulikuler already exists
    const existing = await NilaiEkstrakulikuler.findOne({
      kelasId,
      tahunAjaran,
      semester: semesterNum,
    });

    if (existing) {
      // Update existing
      existing.waliKelasId = waliKelasId;
      existing.muridData = muridData;
      existing.updatedAt = now;
      await existing.save();

      // Populate data for response
      const updatedNilaiEkstrakulikuler = await NilaiEkstrakulikuler.findOne({ id: existing.id });
      const muridDataWithDetails = await Promise.all(
        updatedNilaiEkstrakulikuler.muridData.map(async (item) => {
          const m = await Murid.findOne({ id: item.muridId });
          
          const nilaiEkstraWithDetails = await Promise.all(
            item.nilaiEkstrakulikuler.map(async (nilaiEkstra) => {
              const e = await Ekstrakulikuler.findOne({ id: nilaiEkstra.ekstrakulikulerId });
              return {
                ...nilaiEkstra.toObject(),
                ekstrakulikuler: e ? {
                  id: e.id,
                  nama: e.nama,
                  deskripsi: e.deskripsi,
                } : null,
              };
            })
          );

          return {
            muridId: item.muridId,
            nilaiEkstrakulikuler: nilaiEkstraWithDetails,
            murid: m ? {
              id: m.id,
              name: m.name,
              nisn: m.nisn,
              email: m.email,
            } : null,
          };
        })
      );

      return res.json({
        success: true,
        nilaiEkstrakulikuler: {
          ...updatedNilaiEkstrakulikuler.toObject(),
          kelas: {
            id: kelas.id,
            name: kelas.name,
            tingkat: kelas.tingkat,
          },
          waliKelas: {
            id: waliKelas.id,
            name: waliKelas.name,
            nip: waliKelas.nip,
          },
          muridData: muridDataWithDetails,
        },
        message: 'Data nilai ekstrakulikuler berhasil diperbarui',
      });
    } else {
      // Create new
      const newNilaiEkstrakulikuler = new NilaiEkstrakulikuler({
        id: `nilai-ekstra-${Date.now()}`,
        kelasId,
        waliKelasId,
        tahunAjaran,
        semester: semesterNum,
        muridData,
        createdAt: now,
        updatedAt: now,
      });

      await newNilaiEkstrakulikuler.save();

      // Populate data for response
      const muridDataWithDetails = await Promise.all(
        newNilaiEkstrakulikuler.muridData.map(async (item) => {
          const m = await Murid.findOne({ id: item.muridId });
          
          const nilaiEkstraWithDetails = await Promise.all(
            item.nilaiEkstrakulikuler.map(async (nilaiEkstra) => {
              const e = await Ekstrakulikuler.findOne({ id: nilaiEkstra.ekstrakulikulerId });
              return {
                ...nilaiEkstra.toObject(),
                ekstrakulikuler: e ? {
                  id: e.id,
                  nama: e.nama,
                  deskripsi: e.deskripsi,
                } : null,
              };
            })
          );

          return {
            muridId: item.muridId,
            nilaiEkstrakulikuler: nilaiEkstraWithDetails,
            murid: m ? {
              id: m.id,
              name: m.name,
              nisn: m.nisn,
              email: m.email,
            } : null,
          };
        })
      );

      return res.json({
        success: true,
        nilaiEkstrakulikuler: {
          ...newNilaiEkstrakulikuler.toObject(),
          kelas: {
            id: kelas.id,
            name: kelas.name,
            tingkat: kelas.tingkat,
          },
          waliKelas: {
            id: waliKelas.id,
            name: waliKelas.name,
            nip: waliKelas.nip,
          },
          muridData: muridDataWithDetails,
        },
        message: 'Data nilai ekstrakulikuler berhasil dibuat',
      });
    }
  } catch (error) {
    console.error('Create or update nilai ekstrakulikuler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menyimpan data nilai ekstrakulikuler',
    });
  }
};

// Add or update nilai ekstrakulikuler for a specific murid
export const addOrUpdateNilaiEkstrakulikulerMurid = async (req, res) => {
  try {
    const { kelasId, tahunAjaran, semester, muridId, ekstrakulikulerId, nilai } = req.body;

    if (!kelasId || !tahunAjaran || !semester || !muridId || !ekstrakulikulerId || nilai === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi',
      });
    }

    // Validate nilai range
    if (nilai < 0 || nilai > 100) {
      return res.status(400).json({
        success: false,
        message: 'Nilai harus antara 0-100',
      });
    }

    // Check if ekstrakulikuler exists
    const ekstra = await Ekstrakulikuler.findOne({ id: ekstrakulikulerId });
    if (!ekstra) {
      return res.status(400).json({
        success: false,
        message: 'Ekstrakulikuler tidak ditemukan',
      });
    }

    // Find murid to validate
    const murid = await Murid.findOne({ id: muridId });
    if (!murid) {
      return res.status(404).json({
        success: false,
        message: 'Murid tidak ditemukan',
      });
    }

    // Validate kelas
    const kelas = await Kelas.findOne({ id: kelasId });
    if (!kelas) {
      return res.status(400).json({
        success: false,
        message: 'Kelas tidak ditemukan',
      });
    }

    // Get grades to determine predikat
    const grades = await PengaturanGrade.find().sort({ minNilai: -1 });
    const predikat = getPredikatFromNilai(nilai, grades);
    const keterangan = generateKeterangan(predikat, ekstra.nama);

    let nilaiEkstrakulikuler = await NilaiEkstrakulikuler.findOne({
      kelasId,
      tahunAjaran,
      semester: parseInt(semester),
    });

    // If data doesn't exist, create it with all active students in the class
    if (!nilaiEkstrakulikuler) {
      // Get all active students in the class
      const activeMurid = await Murid.find({
        kelasId: kelasId,
        isActive: true,
      });

      const now = new Date().toISOString();
      const muridData = activeMurid.map(m => ({
        muridId: m.id,
        nilaiEkstrakulikuler: [],
      }));

      // Get wali kelas from kelas or from user making the request (like Kokulikuler)
      // Priority: 1. kelas.waliKelasId, 2. user making request (must be guru)
      let waliKelasId = kelas.waliKelasId;
      
      // If kelas doesn't have waliKelasId or it's empty, use the user making the request
      if (!waliKelasId || waliKelasId.trim() === '') {
        // Use user making the request as wali kelas (same as Kokulikuler)
        const requestUser = req.user;
        if (!requestUser) {
          return res.status(401).json({
            success: false,
            message: 'User tidak terautentikasi',
          });
        }
        
        if (requestUser.role !== 'guru') {
          return res.status(403).json({
            success: false,
            message: 'Hanya guru yang dapat mengakses fitur ini',
          });
        }
        
        // Verify the user is actually a guru in database
        const guruUser = await Guru.findOne({ id: requestUser.id });
        if (!guruUser) {
          return res.status(400).json({
            success: false,
            message: 'User tidak ditemukan atau bukan guru',
          });
        }
        
        waliKelasId = requestUser.id;
      }

      nilaiEkstrakulikuler = new NilaiEkstrakulikuler({
        id: `nilai-ekstra-${Date.now()}`,
        kelasId,
        waliKelasId: waliKelasId,
        tahunAjaran,
        semester: parseInt(semester),
        muridData,
        createdAt: now,
        updatedAt: now,
      });

      await nilaiEkstrakulikuler.save();
    }

    // Find murid data
    let muridIndex = nilaiEkstrakulikuler.muridData.findIndex(
      item => item.muridId === muridId
    );

    // If murid not found in data, add them
    if (muridIndex === -1) {
      nilaiEkstrakulikuler.muridData.push({
        muridId,
        nilaiEkstrakulikuler: [],
      });
      muridIndex = nilaiEkstrakulikuler.muridData.length - 1;
    }

    // Find existing nilai ekstrakulikuler for this murid
    const nilaiIndex = nilaiEkstrakulikuler.muridData[muridIndex].nilaiEkstrakulikuler.findIndex(
      n => n.ekstrakulikulerId === ekstrakulikulerId
    );

    const nilaiData = {
      ekstrakulikulerId,
      nilai: parseFloat(nilai),
      predikat,
      keterangan,
    };

    if (nilaiIndex === -1) {
      // Add new
      nilaiEkstrakulikuler.muridData[muridIndex].nilaiEkstrakulikuler.push(nilaiData);
    } else {
      // Update existing
      nilaiEkstrakulikuler.muridData[muridIndex].nilaiEkstrakulikuler[nilaiIndex] = nilaiData;
    }

    nilaiEkstrakulikuler.updatedAt = new Date().toISOString();
    await nilaiEkstrakulikuler.save();

    // Populate data for response (kelas already fetched above at line 490)
    const waliKelas = await Guru.findOne({ id: nilaiEkstrakulikuler.waliKelasId });
    
    const muridDataWithDetails = await Promise.all(
      nilaiEkstrakulikuler.muridData.map(async (item) => {
        const murid = await Murid.findOne({ id: item.muridId });
        
        const nilaiEkstraWithDetails = await Promise.all(
          item.nilaiEkstrakulikuler.map(async (nilaiEkstra) => {
            const e = await Ekstrakulikuler.findOne({ id: nilaiEkstra.ekstrakulikulerId });
            return {
              ...nilaiEkstra.toObject(),
              ekstrakulikuler: e ? {
                id: e.id,
                nama: e.nama,
                deskripsi: e.deskripsi,
              } : null,
            };
          })
        );

        return {
          muridId: item.muridId,
          nilaiEkstrakulikuler: nilaiEkstraWithDetails,
          murid: murid ? {
            id: murid.id,
            name: murid.name,
            nisn: murid.nisn,
            email: murid.email,
          } : null,
        };
      })
    );

    return res.json({
      success: true,
      nilaiEkstrakulikuler: {
        ...nilaiEkstrakulikuler.toObject(),
        kelas: kelas ? {
          id: kelas.id,
          name: kelas.name,
          tingkat: kelas.tingkat,
        } : null,
        waliKelas: waliKelas ? {
          id: waliKelas.id,
          name: waliKelas.name,
          nip: waliKelas.nip,
        } : null,
        muridData: muridDataWithDetails,
      },
      message: 'Nilai ekstrakulikuler murid berhasil disimpan',
    });
  } catch (error) {
    console.error('Add or update nilai ekstrakulikuler murid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menyimpan nilai ekstrakulikuler murid',
    });
  }
};

// Delete nilai ekstrakulikuler for a specific murid
export const deleteNilaiEkstrakulikulerMurid = async (req, res) => {
  try {
    const { kelasId, tahunAjaran, semester, muridId, ekstrakulikulerId } = req.body;

    if (!kelasId || !tahunAjaran || !semester || !muridId || !ekstrakulikulerId) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi',
      });
    }

    const nilaiEkstrakulikuler = await NilaiEkstrakulikuler.findOne({
      kelasId,
      tahunAjaran,
      semester: parseInt(semester),
    });

    if (!nilaiEkstrakulikuler) {
      return res.status(404).json({
        success: false,
        message: 'Data nilai ekstrakulikuler tidak ditemukan',
      });
    }

    // Find murid data
    const muridIndex = nilaiEkstrakulikuler.muridData.findIndex(
      item => item.muridId === muridId
    );

    if (muridIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Murid tidak ditemukan dalam data nilai ekstrakulikuler',
      });
    }

    // Remove nilai ekstrakulikuler
    nilaiEkstrakulikuler.muridData[muridIndex].nilaiEkstrakulikuler = 
      nilaiEkstrakulikuler.muridData[muridIndex].nilaiEkstrakulikuler.filter(
        n => n.ekstrakulikulerId !== ekstrakulikulerId
      );

    nilaiEkstrakulikuler.updatedAt = new Date().toISOString();
    await nilaiEkstrakulikuler.save();

    // Populate data for response
    const kelas = await Kelas.findOne({ id: nilaiEkstrakulikuler.kelasId });
    const waliKelas = await Guru.findOne({ id: nilaiEkstrakulikuler.waliKelasId });
    
    const muridDataWithDetails = await Promise.all(
      nilaiEkstrakulikuler.muridData.map(async (item) => {
        const murid = await Murid.findOne({ id: item.muridId });
        
        const nilaiEkstraWithDetails = await Promise.all(
          item.nilaiEkstrakulikuler.map(async (nilaiEkstra) => {
            const e = await Ekstrakulikuler.findOne({ id: nilaiEkstra.ekstrakulikulerId });
            return {
              ...nilaiEkstra.toObject(),
              ekstrakulikuler: e ? {
                id: e.id,
                nama: e.nama,
                deskripsi: e.deskripsi,
              } : null,
            };
          })
        );

        return {
          muridId: item.muridId,
          nilaiEkstrakulikuler: nilaiEkstraWithDetails,
          murid: murid ? {
            id: murid.id,
            name: murid.name,
            nisn: murid.nisn,
            email: murid.email,
          } : null,
        };
      })
    );

    return res.json({
      success: true,
      nilaiEkstrakulikuler: {
        ...nilaiEkstrakulikuler.toObject(),
        kelas: kelas ? {
          id: kelas.id,
          name: kelas.name,
          tingkat: kelas.tingkat,
        } : null,
        waliKelas: waliKelas ? {
          id: waliKelas.id,
          name: waliKelas.name,
          nip: waliKelas.nip,
        } : null,
        muridData: muridDataWithDetails,
      },
      message: 'Nilai ekstrakulikuler murid berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete nilai ekstrakulikuler murid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus nilai ekstrakulikuler murid',
    });
  }
};

// Legacy endpoints for backward compatibility (keeping old structure support)
export const getAllNilaiEkstrakulikuler = async (req, res) => {
  try {
    const { muridId, kelasId, semester, tahunAjaran, ekstrakulikulerId } = req.query;
    
    let query = {};
    if (semester) query.semester = parseInt(semester);
    if (tahunAjaran) query.tahunAjaran = tahunAjaran;
    if (kelasId) query.kelasId = kelasId;

    const nilaiEkstrakulikulerDocs = await NilaiEkstrakulikuler.find(query)
      .sort({ createdAt: -1 });

    // Flatten structure to match old format for backward compatibility
    const flattened = [];
    for (const doc of nilaiEkstrakulikulerDocs) {
      for (const muridData of doc.muridData) {
        for (const nilaiEkstra of muridData.nilaiEkstrakulikuler) {
          // Apply filters
          if (muridId && muridData.muridId !== muridId) continue;
          if (ekstrakulikulerId && nilaiEkstra.ekstrakulikulerId !== ekstrakulikulerId) continue;

          const ekstra = await Ekstrakulikuler.findOne({ id: nilaiEkstra.ekstrakulikulerId });
          const murid = await Murid.findOne({ id: muridData.muridId });
          
          flattened.push({
            id: `${doc.id}-${muridData.muridId}-${nilaiEkstra.ekstrakulikulerId}`,
            muridId: muridData.muridId,
            ekstrakulikulerId: nilaiEkstra.ekstrakulikulerId,
            nilai: nilaiEkstra.nilai,
            predikat: nilaiEkstra.predikat,
            keterangan: nilaiEkstra.keterangan,
            semester: doc.semester,
            tahunAjaran: doc.tahunAjaran,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            ekstrakulikuler: ekstra ? {
              id: ekstra.id,
              nama: ekstra.nama,
              deskripsi: ekstra.deskripsi,
            } : null,
            murid: murid ? {
              id: murid.id,
              name: murid.name,
              nisn: murid.nisn,
            } : null,
          });
        }
      }
    }

    return res.json({
      success: true,
      nilaiEkstrakulikuler: flattened,
      count: flattened.length,
    });
  } catch (error) {
    console.error('Get all nilai ekstrakulikuler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data nilai ekstrakulikuler',
    });
  }
};
