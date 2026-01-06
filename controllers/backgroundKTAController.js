import BackgroundKTA from '../models/BackgroundKTA.js';

// Get background KTA (only one record exists)
export const getBackgroundKTA = async (req, res) => {
  try {
    const backgroundKTA = await BackgroundKTA.findOne();
    
    return res.json({
      success: true,
      backgroundKTA: backgroundKTA ? backgroundKTA.toObject() : null,
    });
  } catch (error) {
    console.error('Get background KTA error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data background KTA',
    });
  }
};

// Create or update background KTA
export const saveBackgroundKTA = async (req, res) => {
  try {
    const {
      backgroundDepanBase64,
      backgroundBelakangBase64,
      backgroundDepanMuridBase64,
      backgroundBelakangMuridBase64,
      backgroundDepanGuruBase64,
      backgroundBelakangGuruBase64,
    } = req.body;

    // Check if background KTA already exists
    let backgroundKTA = await BackgroundKTA.findOne();

    if (backgroundKTA) {
      // Update existing
      if (backgroundDepanBase64 !== undefined) backgroundKTA.backgroundDepanBase64 = backgroundDepanBase64;
      if (backgroundBelakangBase64 !== undefined) backgroundKTA.backgroundBelakangBase64 = backgroundBelakangBase64;
      if (backgroundDepanMuridBase64 !== undefined) backgroundKTA.backgroundDepanMuridBase64 = backgroundDepanMuridBase64;
      if (backgroundBelakangMuridBase64 !== undefined) backgroundKTA.backgroundBelakangMuridBase64 = backgroundBelakangMuridBase64;
      if (backgroundDepanGuruBase64 !== undefined) backgroundKTA.backgroundDepanGuruBase64 = backgroundDepanGuruBase64;
      if (backgroundBelakangGuruBase64 !== undefined) backgroundKTA.backgroundBelakangGuruBase64 = backgroundBelakangGuruBase64;
      backgroundKTA.updatedAt = new Date().toISOString();

      await backgroundKTA.save();

      return res.json({
        success: true,
        message: 'Background KTA berhasil diperbarui',
        backgroundKTA: backgroundKTA.toObject(),
      });
    } else {
      // Create new
      const newBackground = new BackgroundKTA({
        id: 'background-kta-1',
        backgroundDepanBase64,
        backgroundBelakangBase64,
        backgroundDepanMuridBase64,
        backgroundBelakangMuridBase64,
        backgroundDepanGuruBase64,
        backgroundBelakangGuruBase64,
        createdAt: new Date().toISOString(),
      });

      await newBackground.save();

      return res.json({
        success: true,
        message: 'Background KTA berhasil dibuat',
        backgroundKTA: newBackground.toObject(),
      });
    }
  } catch (error) {
    console.error('Save background KTA error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menyimpan background KTA',
    });
  }
};


