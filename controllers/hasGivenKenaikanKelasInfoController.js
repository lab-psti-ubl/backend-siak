import HasGivenKenaikanKelasInfo from '../models/HasGivenKenaikanKelasInfo.js';

// Get flag by tahun ajaran and semester
export const getByTahunAjaranAndSemester = async (req, res) => {
  try {
    const { tahunAjaran, semester } = req.query;
    
    if (!tahunAjaran || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Tahun ajaran dan semester wajib diisi'
      });
    }

    const data = await HasGivenKenaikanKelasInfo.findOne({
      tahunAjaran,
      semester: parseInt(semester)
    });

    if (!data) {
      return res.json({
        success: true,
        data: {
          hasGiven: false
        }
      });
    }

    res.json({
      success: true,
      data: {
        id: data._id.toString(),
        tahunAjaran: data.tahunAjaran,
        semester: data.semester,
        hasGiven: data.hasGiven,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Set flag (create or update)
export const setFlag = async (req, res) => {
  try {
    const { tahunAjaran, semester, hasGiven } = req.body;
    
    if (!tahunAjaran || semester === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Tahun ajaran dan semester wajib diisi'
      });
    }

    const data = await HasGivenKenaikanKelasInfo.findOneAndUpdate(
      {
        tahunAjaran,
        semester: parseInt(semester)
      },
      {
        tahunAjaran,
        semester: parseInt(semester),
        hasGiven: hasGiven !== undefined ? hasGiven : true,
        updatedAt: new Date().toISOString()
      },
      {
        upsert: true,
        new: true
      }
    );

    res.json({
      success: true,
      data: {
        id: data._id.toString(),
        tahunAjaran: data.tahunAjaran,
        semester: data.semester,
        hasGiven: data.hasGiven,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete flag
export const deleteFlag = async (req, res) => {
  try {
    const { tahunAjaran, semester } = req.query;
    
    if (!tahunAjaran || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Tahun ajaran dan semester wajib diisi'
      });
    }

    const deleted = await HasGivenKenaikanKelasInfo.findOneAndDelete({
      tahunAjaran,
      semester: parseInt(semester)
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Flag berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all flags
export const getAll = async (req, res) => {
  try {
    const data = await HasGivenKenaikanKelasInfo.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: data.map(item => ({
        id: item._id.toString(),
        tahunAjaran: item.tahunAjaran,
        semester: item.semester,
        hasGiven: item.hasGiven,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

