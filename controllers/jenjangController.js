import PengaturanJenjangPendidikan from '../models/PengaturanJenjangPendidikan.js';

export const getActiveJenjang = async (req, res) => {
  try {
    // Get all jenjang records
    const allJenjang = await PengaturanJenjangPendidikan.find();

    // Cleanup: If there are multiple records, keep only one (the first active one, or the first one)
    if (allJenjang.length > 1) {
      // Find active one, or take the first one
      const activeJenjang = allJenjang.find(j => j.isActive) || allJenjang[0];
      
      // Delete all others
      const idsToKeep = [activeJenjang._id];
      await PengaturanJenjangPendidikan.deleteMany({ _id: { $nin: idsToKeep } });
      
      // Update the kept one to be active
      activeJenjang.isActive = true;
      await activeJenjang.save();
      
      // Use the cleaned up record
      const range = getTingkatRangeByJenjang(activeJenjang.jenjang);
      if (!activeJenjang.tingkatAwal || !activeJenjang.tingkatAkhir) {
        activeJenjang.tingkatAwal = range.tingkatAwal;
        activeJenjang.tingkatAkhir = range.tingkatAkhir;
        await activeJenjang.save();
      }

      return res.json({
        success: true,
        activeJenjang: activeJenjang.jenjang,
        tingkatAwal: activeJenjang.tingkatAwal,
        tingkatAkhir: activeJenjang.tingkatAkhir,
      });
    }

    // Only get the active jenjang (there should be only one record in database)
    const activeJenjang = allJenjang.length > 0 ? allJenjang[0] : null;

    // If no jenjang exists, return null
    if (!activeJenjang) {
      return res.json({
        success: true,
        activeJenjang: null,
        tingkatAwal: null,
        tingkatAkhir: null,
      });
    }

    // If active jenjang exists but doesn't have tingkat data, calculate it
    if (!activeJenjang.tingkatAwal || !activeJenjang.tingkatAkhir) {
      const range = getTingkatRangeByJenjang(activeJenjang.jenjang);
      activeJenjang.tingkatAwal = range.tingkatAwal;
      activeJenjang.tingkatAkhir = range.tingkatAkhir;
      await activeJenjang.save();
    }

    // Ensure isActive is true
    if (!activeJenjang.isActive) {
      activeJenjang.isActive = true;
      await activeJenjang.save();
    }

    return res.json({
      success: true,
      activeJenjang: activeJenjang.jenjang,
      tingkatAwal: activeJenjang.tingkatAwal,
      tingkatAkhir: activeJenjang.tingkatAkhir,
    });
  } catch (error) {
    console.error('Get active jenjang error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil jenjang pendidikan',
    });
  }
};

export const getAllJenjang = async (req, res) => {
  try {
    // Only get the active jenjang (there should be only one record in database)
    const activeJenjang = await PengaturanJenjangPendidikan.findOne();

    if (!activeJenjang) {
      return res.json({
        success: true,
        jenjangList: [],
      });
    }

    const obj = activeJenjang.toObject();
    // Ensure tingkat data exists
    if (!obj.tingkatAwal || !obj.tingkatAkhir) {
      const range = getTingkatRangeByJenjang(obj.jenjang);
      obj.tingkatAwal = range.tingkatAwal;
      obj.tingkatAkhir = range.tingkatAkhir;
    }

    return res.json({
      success: true,
      jenjangList: [obj],
    });
  } catch (error) {
    console.error('Get all jenjang error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data jenjang pendidikan',
    });
  }
};

// Helper function to get tingkat range based on jenjang
const getTingkatRangeByJenjang = (jenjang) => {
  switch (jenjang) {
    case 'SD':
      return { tingkatAwal: 1, tingkatAkhir: 6 };
    case 'SMP':
      return { tingkatAwal: 7, tingkatAkhir: 9 };
    case 'SMA/SMK':
      return { tingkatAwal: 10, tingkatAkhir: 12 };
    default:
      return { tingkatAwal: null, tingkatAkhir: null };
  }
};

export const setJenjang = async (req, res) => {
  try {
    const { jenjang } = req.body;

    if (!jenjang || !['SD', 'SMP', 'SMA/SMK'].includes(jenjang)) {
      return res.status(400).json({
        success: false,
        message: 'Jenjang pendidikan harus dipilih (SD, SMP, atau SMA/SMK)',
      });
    }

    // Check if there's already a jenjang in database
    const existingJenjang = await PengaturanJenjangPendidikan.findOne();

    if (existingJenjang) {
      return res.status(400).json({
        success: false,
        message: 'Jenjang pendidikan tidak dapat diubah setelah dipilih',
      });
    }

    // Get tingkat range for selected jenjang
    const range = getTingkatRangeByJenjang(jenjang);

    // Create only one jenjang record (the active one)
    const jenjangData = {
      id: `jenjang-${jenjang.toLowerCase().replace('/', '-')}`,
      jenjang: jenjang,
      isActive: true,
      tingkatAwal: range.tingkatAwal,
      tingkatAkhir: range.tingkatAkhir,
      createdAt: new Date().toISOString(),
    };

    // Delete any existing jenjang settings (cleanup)
    await PengaturanJenjangPendidikan.deleteMany({});

    // Insert only the selected jenjang
    const savedJenjang = await PengaturanJenjangPendidikan.create(jenjangData);

    return res.json({
      success: true,
      message: `Jenjang pendidikan ${jenjang} berhasil disimpan`,
      jenjang: savedJenjang.toObject(),
    });
  } catch (error) {
    console.error('Set jenjang error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menyimpan jenjang pendidikan',
    });
  }
};

