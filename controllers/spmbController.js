import SpmbOpening from '../models/SpmbOpening.js';
import SpmbRegistration from '../models/SpmbRegistration.js';
import Murid from '../models/Murid.js';
import Kelas from '../models/Kelas.js';
import TahunAjaran from '../models/TahunAjaran.js';
import { hashPassword } from '../utils/passwordUtils.js';
import { isEmailUnique } from '../utils/validationUtils.js';

const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

// ====== SPMB OPENING (ADMIN) ======

export const getAllSpmbOpenings = async (req, res) => {
  try {
    const { tahunAjaran } = req.query;

    const filter = {};
    if (tahunAjaran) {
      filter.tahunAjaran = tahunAjaran;
    }

    const openings = await SpmbOpening.find(filter).sort({ tanggalMulai: -1 });

    return res.json({
      success: true,
      openings: openings.map(o => o.toObject()),
      count: openings.length,
    });
  } catch (error) {
    console.error('Get all SPMB openings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data pembukaan SPMB',
    });
  }
};

export const createSpmbOpening = async (req, res) => {
  try {
    const { tahunAjaran, judul, tanggalMulai, tanggalSelesai } = req.body;

    if (!tahunAjaran || !judul || !tanggalMulai || !tanggalSelesai) {
      return res.status(400).json({
        success: false,
        message: 'Tahun ajaran, judul, tanggal mulai, dan tanggal selesai wajib diisi',
      });
    }

    if (tanggalMulai >= tanggalSelesai) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal selesai harus lebih besar dari tanggal mulai',
      });
    }

    // Enforce: hanya 1 pembukaan per tahun ajaran
    const existingByYear = await SpmbOpening.findOne({ tahunAjaran });
    if (existingByYear) {
      return res.status(400).json({
        success: false,
        message: `Pembukaan SPMB untuk tahun ajaran ${tahunAjaran} sudah ada. Hanya boleh satu pembukaan per tahun ajaran.`,
      });
    }

    // Enforce: hanya 1 pembukaan yang aktif pada satu waktu
    const existingActive = await SpmbOpening.findOne({ isActive: true });
    if (existingActive) {
      return res.status(400).json({
        success: false,
        message:
          'Masih ada pembukaan SPMB yang aktif. Silakan matikan pembukaan aktif terlebih dahulu sebelum membuat pembukaan baru.',
      });
    }

    const newOpening = new SpmbOpening({
      id: `spmb-open-${Date.now()}`,
      tahunAjaran,
      judul,
      tanggalMulai,
      tanggalSelesai,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    await newOpening.save();

    return res.json({
      success: true,
      message: 'Pembukaan SPMB berhasil ditambahkan',
      opening: newOpening.toObject(),
    });
  } catch (error) {
    console.error('Create SPMB opening error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan pembukaan SPMB',
    });
  }
};

export const updateSpmbOpening = async (req, res) => {
  try {
    const { id } = req.params;
    const { tahunAjaran, judul, tanggalMulai, tanggalSelesai, isActive } = req.body;

    const opening = await SpmbOpening.findOne({ id });
    if (!opening) {
      return res.status(404).json({
        success: false,
        message: 'Pembukaan SPMB tidak ditemukan',
      });
    }

    if (tanggalMulai && tanggalSelesai && tanggalMulai >= tanggalSelesai) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal selesai harus lebih besar dari tanggal mulai',
      });
    }

    // Enforce: jika ganti tahun ajaran, tetap hanya 1 pembukaan per tahun ajaran
    if (tahunAjaran && tahunAjaran !== opening.tahunAjaran) {
      const existingByYear = await SpmbOpening.findOne({ tahunAjaran, id: { $ne: id } });
      if (existingByYear) {
        return res.status(400).json({
          success: false,
          message: `Pembukaan SPMB untuk tahun ajaran ${tahunAjaran} sudah ada. Hanya boleh satu pembukaan per tahun ajaran.`,
        });
      }
    }

    // Enforce: hanya 1 pembukaan yang aktif pada satu waktu
    if (typeof isActive === 'boolean' && isActive === true) {
      const existingActive = await SpmbOpening.findOne({ isActive: true, id: { $ne: id } });
      if (existingActive) {
        return res.status(400).json({
          success: false,
          message:
            'Tidak bisa mengaktifkan pembukaan ini karena masih ada pembukaan SPMB lain yang aktif. Matikan pembukaan aktif terlebih dahulu.',
        });
      }
    }

    const updateData = {};
    if (tahunAjaran) updateData.tahunAjaran = tahunAjaran;
    if (judul) updateData.judul = judul;
    if (tanggalMulai) updateData.tanggalMulai = tanggalMulai;
    if (tanggalSelesai) updateData.tanggalSelesai = tanggalSelesai;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    await SpmbOpening.updateOne({ id }, updateData);
    const updated = await SpmbOpening.findOne({ id });

    return res.json({
      success: true,
      message: 'Pembukaan SPMB berhasil diperbarui',
      opening: updated.toObject(),
    });
  } catch (error) {
    console.error('Update SPMB opening error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui pembukaan SPMB',
    });
  }
};

export const deleteSpmbOpening = async (req, res) => {
  try {
    const { id } = req.params;

    const opening = await SpmbOpening.findOne({ id });
    if (!opening) {
      return res.status(404).json({
        success: false,
        message: 'Pembukaan SPMB tidak ditemukan',
      });
    }

    // Optional: prevent delete if there are registrations
    const registrationsCount = await SpmbRegistration.countDocuments({ openingId: id });
    if (registrationsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus pembukaan SPMB yang sudah memiliki pendaftar',
      });
    }

    await SpmbOpening.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Pembukaan SPMB berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete SPMB opening error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus pembukaan SPMB',
    });
  }
};

// ====== PUBLIC: GET ACTIVE OPENING ======

export const getActiveSpmbOpeningPublic = async (req, res) => {
  try {
    const today = getTodayDateString();

    const opening = await SpmbOpening.findOne({
      isActive: true,
      tanggalMulai: { $lte: today },
      tanggalSelesai: { $gte: today },
    }).sort({ tanggalMulai: -1 });

    return res.json({
      success: true,
      opening: opening ? opening.toObject() : null,
    });
  } catch (error) {
    console.error('Get active SPMB opening error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data pembukaan SPMB aktif',
    });
  }
};

// ====== SPMB REGISTRATION (PUBLIC + ADMIN) ======

export const createSpmbRegistrationPublic = async (req, res) => {
  try {
    const {
      namaLengkap,
      jenisKelamin,
      umur,
      nisn,
      email,
      noWhatsappOrtu,
      asalSekolah,
      alamat,
      pilihanJurusan,
      nikAnak,
      nomorKk,
      tempatLahir,
      tanggalLahir,
      namaOrangTua,
      nikOrangTua,
      pekerjaanOrangTua,
      noHpOrangTua,
      ringkasanNilaiRapor,
      dokumenKk,
      dokumenAktaKelahiran,
      dokumenKtpOrangTua,
      dokumenKartuImunisasi,
      dokumenPasFoto,
      dokumenIjazahAtauSkL,
      dokumenRapor,
      dokumenKip,
      dokumenSertifikatPrestasi,
      dokumenSuratKeteranganSehat,
    } = req.body;

    if (!namaLengkap || !noWhatsappOrtu || !asalSekolah || !alamat) {
      return res.status(400).json({
        success: false,
        message: 'Nama lengkap, nomor WhatsApp orang tua, asal sekolah, dan alamat wajib diisi',
      });
    }

    const today = getTodayDateString();

    const opening = await SpmbOpening.findOne({
      isActive: true,
      tanggalMulai: { $lte: today },
      tanggalSelesai: { $gte: today },
    }).sort({ tanggalMulai: -1 });

    if (!opening) {
      return res.status(400).json({
        success: false,
        message: 'Pendaftaran SPMB belum dibuka atau sudah ditutup',
      });
    }

    const newReg = new SpmbRegistration({
      id: `spmb-${Date.now()}`,
      openingId: opening.id,
      tahunAjaran: opening.tahunAjaran,
      namaLengkap,
      jenisKelamin: jenisKelamin || '',
      umur: typeof umur === 'number' ? umur : undefined,
      nisn: nisn || '',
      email: email || '',
      noWhatsappOrtu,
      asalSekolah,
      alamat,
      pilihanJurusan: pilihanJurusan || '',
      nikAnak: nikAnak || '',
      nomorKk: nomorKk || '',
      tempatLahir: tempatLahir || '',
      tanggalLahir: tanggalLahir || '',
      namaOrangTua: namaOrangTua || '',
      nikOrangTua: nikOrangTua || '',
      pekerjaanOrangTua: pekerjaanOrangTua || '',
      noHpOrangTua: noHpOrangTua || '',
      ringkasanNilaiRapor: ringkasanNilaiRapor || '',
      dokumenKk: dokumenKk || '',
      dokumenAktaKelahiran: dokumenAktaKelahiran || '',
      dokumenKtpOrangTua: dokumenKtpOrangTua || '',
      dokumenKartuImunisasi: dokumenKartuImunisasi || '',
      dokumenPasFoto: dokumenPasFoto || '',
      dokumenIjazahAtauSkL: dokumenIjazahAtauSkL || '',
      dokumenRapor: dokumenRapor || '',
      dokumenKip: dokumenKip || '',
      dokumenSertifikatPrestasi: dokumenSertifikatPrestasi || '',
      dokumenSuratKeteranganSehat: dokumenSuratKeteranganSehat || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    await newReg.save();

    return res.json({
      success: true,
      message: 'Pendaftaran SPMB berhasil dikirim',
      registration: newReg.toObject(),
    });
  } catch (error) {
    console.error('Create SPMB registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengirim pendaftaran SPMB',
    });
  }
};

export const getSpmbRegistrations = async (req, res) => {
  try {
    const { tahunAjaran, status } = req.query;

    const filter = {};
    if (tahunAjaran) {
      filter.tahunAjaran = tahunAjaran;
    }
    if (status) {
      filter.status = status;
    }

    const regs = await SpmbRegistration.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      registrations: regs.map(r => r.toObject()),
      count: regs.length,
    });
  } catch (error) {
    console.error('Get SPMB registrations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data pendaftar SPMB',
    });
  }
};

export const updateSpmbRegistrationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'diterima', 'ditolak'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid',
      });
    }

    const reg = await SpmbRegistration.findOne({ id });
    if (!reg) {
      return res.status(404).json({
        success: false,
        message: 'Pendaftar SPMB tidak ditemukan',
      });
    }

    await SpmbRegistration.updateOne({ id }, { status });
    const updated = await SpmbRegistration.findOne({ id });

    return res.json({
      success: true,
      message: 'Status pendaftar SPMB berhasil diperbarui',
      registration: updated.toObject(),
    });
  } catch (error) {
    console.error('Update SPMB registration status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui status pendaftar SPMB',
    });
  }
};

// ====== ASSIGN DITERIMA SPMB TO KELAS (CREATE MURID) ======

export const assignSpmbRegistrationsToClass = async (req, res) => {
  try {
    const { kelasId, registrationIds } = req.body;

    if (!kelasId || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Kelas tujuan dan daftar pendaftar wajib diisi',
      });
    }

    const kelas = await Kelas.findOne({ id: kelasId });
    if (!kelas) {
      return res.status(400).json({
        success: false,
        message: 'Kelas tujuan tidak ditemukan',
      });
    }

    const regs = await SpmbRegistration.find({
      id: { $in: registrationIds },
      status: 'diterima',
    });

    if (regs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada pendaftar dengan status diterima yang ditemukan',
      });
    }

    // Pastikan tahun ajaran untuk setiap pendaftar sudah ada di koleksi TahunAjaran
    const tahunSet = new Set(regs.map(r => r.tahunAjaran).filter(Boolean));
    for (const tahun of tahunSet) {
      const existing = await TahunAjaran.findOne({ tahun, semester: 1 });
      if (!existing) {
        const newTa = new TahunAjaran({
          id: `ta${Date.now()}${Math.floor(Math.random() * 1000)}`,
          tahun,
          semester: 1,
          isActive: false,
          tanggalMulai: '',
          tanggalSelesai: '',
          isAutoCreated: true,
        });
        await newTa.save();
      }
    }

    const createdMurid = [];
    const skipped = [];

    for (const reg of regs) {
      if (reg.assignedToClass) {
        skipped.push({ id: reg.id, reason: 'already_assigned' });
        continue;
      }

      const nisn = (reg.nisn || '').trim();
      if (!nisn) {
        skipped.push({ id: reg.id, reason: 'missing_nisn' });
        continue;
      }

      const existingNisn = await Murid.findOne({ nisn });
      if (existingNisn) {
        skipped.push({ id: reg.id, reason: 'nisn_already_exists' });
        continue;
      }

      // Tentukan email unik
      let email = (reg.email || '').trim();
      if (!email || !(await isEmailUnique(email))) {
        email = `spmb-${reg.id}@spmb.local`;
      }

      const newId = `murid${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const qrCode = nisn;
      const passwordToSave = 'cerdasdanreligius';
      const hashedPassword = await hashPassword(passwordToSave);

      const muridDoc = new Murid({
        id: newId,
        name: reg.namaLengkap,
        email,
        nisn,
        password: hashedPassword,
        kelasId,
        qrCode,
        whatsappOrtu: reg.noWhatsappOrtu || undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      await muridDoc.save();

      await SpmbRegistration.updateOne(
        { id: reg.id },
        {
          assignedToClass: true,
          assignedClassId: kelasId,
        }
      );

      const muridObj = muridDoc.toObject();
      createdMurid.push(muridObj);
    }

    return res.json({
      success: true,
      message: 'Proses memasukkan murid ke kelas selesai',
      createdCount: createdMurid.length,
      createdMurid,
      skipped,
    });
  } catch (error) {
    console.error('Assign SPMB registrations to class error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memasukkan murid ke kelas',
    });
  }
};

