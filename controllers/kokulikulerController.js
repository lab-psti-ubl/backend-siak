import Kokulikuler from '../models/Kokulikuler.js';
import Guru from '../models/Guru.js';
import Murid from '../models/Murid.js';
import Kelas from '../models/Kelas.js';

// Get kokulikuler by kelas, tahun ajaran, and semester
export const getKokulikuler = async (req, res) => {
  try {
    const { kelasId, tahunAjaran, semester } = req.query;

    if (!kelasId || !tahunAjaran || !semester) {
      return res.status(400).json({
        success: false,
        message: 'kelasId, tahunAjaran, dan semester wajib diisi',
      });
    }

    const kokulikuler = await Kokulikuler.findOne({
      kelasId,
      tahunAjaran,
      semester: parseInt(semester),
    });

    if (!kokulikuler) {
      // Return empty structure if not found
      return res.json({
        success: true,
        kokulikuler: null,
        message: 'Data kokulikuler tidak ditemukan',
      });
    }

    // Populate kelas and wali kelas data
    const kelas = await Kelas.findOne({ id: kokulikuler.kelasId });
    const waliKelas = await Guru.findOne({ id: kokulikuler.waliKelasId });

    // Populate murid data
    const muridDataWithDetails = await Promise.all(
      kokulikuler.muridData.map(async (item) => {
        const murid = await Murid.findOne({ id: item.muridId });
        return {
          muridId: item.muridId,
          kokulikuler: item.kokulikuler,
          murid: murid ? {
            id: murid.id,
            name: murid.name,
            nisn: murid.nisn,
            email: murid.email,
          } : null,
        };
      })
    );

    const kokulikulerObj = kokulikuler.toObject();
    return res.json({
      success: true,
      kokulikuler: {
        ...kokulikulerObj,
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
    console.error('Get kokulikuler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data kokulikuler',
    });
  }
};

// Create or update kokulikuler for a class
export const createOrUpdateKokulikuler = async (req, res) => {
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

    // Validate wali kelas exists
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

    const now = new Date().toISOString();
    const semesterNum = parseInt(semester);

    // Check if kokulikuler already exists
    const existing = await Kokulikuler.findOne({
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
      const updatedKokulikuler = await Kokulikuler.findOne({ id: existing.id });
      const muridDataWithDetails = await Promise.all(
        updatedKokulikuler.muridData.map(async (item) => {
          const murid = await Murid.findOne({ id: item.muridId });
          return {
            muridId: item.muridId,
            kokulikuler: item.kokulikuler,
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
        kokulikuler: {
          ...updatedKokulikuler.toObject(),
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
        message: 'Data kokulikuler berhasil diperbarui',
      });
    } else {
      // Create new
      const newKokulikuler = new Kokulikuler({
        id: `kokulikuler-${Date.now()}`,
        kelasId,
        waliKelasId,
        tahunAjaran,
        semester: semesterNum,
        muridData,
        createdAt: now,
        updatedAt: now,
      });

      await newKokulikuler.save();

      // Populate data for response
      const muridDataWithDetails = await Promise.all(
        newKokulikuler.muridData.map(async (item) => {
          const murid = await Murid.findOne({ id: item.muridId });
          return {
            muridId: item.muridId,
            kokulikuler: item.kokulikuler,
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
        kokulikuler: {
          ...newKokulikuler.toObject(),
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
        message: 'Data kokulikuler berhasil dibuat',
      });
    }
  } catch (error) {
    console.error('Create or update kokulikuler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menyimpan data kokulikuler',
    });
  }
};

// Update kokulikuler for a specific murid
export const updateKokulikulerMurid = async (req, res) => {
  try {
    const { kelasId, tahunAjaran, semester, muridId, kokulikuler, waliKelasId } = req.body;

    if (!kelasId || !tahunAjaran || !semester || !muridId || kokulikuler === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi',
      });
    }

    let kokulikulerData = await Kokulikuler.findOne({
      kelasId,
      tahunAjaran,
      semester: parseInt(semester),
    });

    // If data doesn't exist, create it
    if (!kokulikulerData) {
      // Validate kelas exists
      const kelas = await Kelas.findOne({ id: kelasId });
      if (!kelas) {
        return res.status(400).json({
          success: false,
          message: 'Kelas tidak ditemukan',
        });
      }

      // Validate wali kelas exists and is a guru
      const waliKelas = await Guru.findOne({ id: waliKelasId || req.body.waliKelasId });
      if (!waliKelas) {
        return res.status(400).json({
          success: false,
          message: 'Wali kelas tidak ditemukan',
        });
      }

      // Get all active students in the class
      const muridList = await Murid.find({
        kelasId,
        isActive: true,
      });

      const now = new Date().toISOString();
      const semesterNum = parseInt(semester);

      // Create muridData with the murid being updated
      const muridData = muridList.map(m => ({
        muridId: m.id,
        kokulikuler: m.id === muridId ? kokulikuler : '',
      }));

      kokulikulerData = new Kokulikuler({
        id: `kokulikuler-${Date.now()}`,
        kelasId,
        waliKelasId: waliKelasId || req.body.waliKelasId,
        tahunAjaran,
        semester: semesterNum,
        muridData,
        createdAt: now,
        updatedAt: now,
      });

      await kokulikulerData.save();
    } else {
      // Find and update murid data
      const muridIndex = kokulikulerData.muridData.findIndex(
        item => item.muridId === muridId
      );

      if (muridIndex === -1) {
        // Add new murid to existing data
        kokulikulerData.muridData.push({
          muridId,
          kokulikuler,
        });
      } else {
        // Update existing murid data
        kokulikulerData.muridData[muridIndex].kokulikuler = kokulikuler;
      }

      kokulikulerData.updatedAt = new Date().toISOString();
      await kokulikulerData.save();
    }

    // Populate data for response
    const kelas = await Kelas.findOne({ id: kokulikulerData.kelasId });
    const waliKelas = await Guru.findOne({ id: kokulikulerData.waliKelasId });
    const murid = await Murid.findOne({ id: muridId });

    const muridDataWithDetails = await Promise.all(
      kokulikulerData.muridData.map(async (item) => {
        const m = await Murid.findOne({ id: item.muridId });
        return {
          muridId: item.muridId,
          kokulikuler: item.kokulikuler,
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
      kokulikuler: {
        ...kokulikulerData.toObject(),
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
      message: 'Kokulikuler murid berhasil diperbarui',
    });
  } catch (error) {
    console.error('Update kokulikuler murid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui kokulikuler murid',
    });
  }
};


