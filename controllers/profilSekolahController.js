import ProfilSekolah from '../models/ProfilSekolah.js';

// Get profil sekolah (only one record exists)
export const getProfilSekolah = async (req, res) => {
  try {
    const profilSekolah = await ProfilSekolah.findOne();
    
    return res.json({
      success: true,
      profilSekolah: profilSekolah ? profilSekolah.toObject() : null,
    });
  } catch (error) {
    console.error('Get profil sekolah error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data profil sekolah',
    });
  }
};

// Create or update profil sekolah
export const saveProfilSekolah = async (req, res) => {
  try {
    const {
      namaSekolah,
      npsn,
      alamat,
      kota,
      provinsi,
      kodePos,
      email,
      nomorTelepon,
      website,
      logoSekolah,
      deskripsi,
      misiSekolah,
      visiSekolah,
    } = req.body;

    // Validation
    if (!namaSekolah || !alamat) {
      return res.status(400).json({
        success: false,
        message: 'Nama sekolah dan alamat wajib diisi',
      });
    }

    // Check if profil sekolah already exists
    let profilSekolah = await ProfilSekolah.findOne();

    if (profilSekolah) {
      // Update existing
      profilSekolah.namaSekolah = namaSekolah;
      profilSekolah.npsn = npsn;
      profilSekolah.alamat = alamat;
      profilSekolah.kota = kota;
      profilSekolah.provinsi = provinsi;
      profilSekolah.kodePos = kodePos;
      profilSekolah.email = email;
      profilSekolah.nomorTelepon = nomorTelepon;
      profilSekolah.website = website;
      profilSekolah.logoSekolah = logoSekolah;
      profilSekolah.deskripsi = deskripsi;
      profilSekolah.misiSekolah = misiSekolah;
      profilSekolah.visiSekolah = visiSekolah;
      profilSekolah.updatedAt = new Date().toISOString();

      await profilSekolah.save();

      return res.json({
        success: true,
        message: 'Profil sekolah berhasil diperbarui',
        profilSekolah: profilSekolah.toObject(),
      });
    } else {
      // Create new
      const newProfil = new ProfilSekolah({
        id: 'profil-sekolah-1',
        namaSekolah,
        npsn,
        alamat,
        kota,
        provinsi,
        kodePos,
        email,
        nomorTelepon,
        website,
        logoSekolah,
        deskripsi,
        misiSekolah,
        visiSekolah,
        createdAt: new Date().toISOString(),
      });

      await newProfil.save();

      return res.json({
        success: true,
        message: 'Profil sekolah berhasil dibuat',
        profilSekolah: newProfil.toObject(),
      });
    }
  } catch (error) {
    console.error('Save profil sekolah error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menyimpan profil sekolah',
    });
  }
};


