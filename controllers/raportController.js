import User from '../models/User.js';
import Guru from '../models/Guru.js';
import Murid from '../models/Murid.js';
import Kelas from '../models/Kelas.js';
import Jurusan from '../models/Jurusan.js';
import Nilai from '../models/Nilai.js';
import MataPelajaran from '../models/MataPelajaran.js';
import TahunAjaran from '../models/TahunAjaran.js';
import JadwalPelajaran from '../models/JadwalPelajaran.js';
import Absensi from '../models/Absensi.js';
import SesiAbsensi from '../models/SesiAbsensi.js';
import StatusBagiRaport from '../models/StatusBagiRaport.js';
import DataKepsek from '../models/DataKepsek.js';
import PengaturanNilaiMinimal from '../models/PengaturanNilaiMinimal.js';
import PengaturanKomponenNilai from '../models/PengaturanKomponenNilai.js';

// Get laporan hasil belajar data for verification (public endpoint)
// Returns all raw data needed to generate laporan hasil belajar on frontend
export const getRaportVerification = async (req, res) => {
  try {
    const { nisn } = req.params;
    const { tahunAjaran, semester } = req.query;

    if (!nisn) {
      return res.status(400).json({
        success: false,
        message: 'NISN diperlukan',
      });
    }

    // Find student by NISN
    const student = await Murid.findOne({ nisn });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Siswa tidak ditemukan',
      });
    }

    // Get all required data - combine from all collections for backward compatibility
    const usersFromUser = await User.find();
    const gurus = await Guru.find();
    const murids = await Murid.find();
    
    // Combine all users and add role for backward compatibility
    const users = [
      ...usersFromUser.map(u => {
        const userObj = u.toObject();
        if (!userObj.role) userObj.role = 'admin';
        return userObj;
      }),
      ...gurus.map(g => {
        const guruObj = g.toObject();
        guruObj.role = 'guru';
        return guruObj;
      }),
      ...murids.map(m => {
        const muridObj = m.toObject();
        muridObj.role = 'murid';
        return muridObj;
      })
    ];
    const kelas = await Kelas.find();
    const jurusan = await Jurusan.find();
    const nilaiDocs = await Nilai.find();
    const mataPelajaran = await MataPelajaran.find();
    const tahunAjaranList = await TahunAjaran.find();
    const jadwalPelajaran = await JadwalPelajaran.find();
    const absensi = await Absensi.find();
    const sesiAbsensi = await SesiAbsensi.find();
    const statusBagiRaportList = await StatusBagiRaport.find();
    
    // Get data kepsek, pengaturan nilai minimal, and komponen nilai for verification page
    const dataKepsekList = await DataKepsek.find().sort({ createdAt: -1 });
    let pengaturanNilaiMinimal = await PengaturanNilaiMinimal.findOne();
    
    // If pengaturan nilai minimal doesn't exist, create default
    if (!pengaturanNilaiMinimal) {
      pengaturanNilaiMinimal = new PengaturanNilaiMinimal({
        id: 'pengaturan-nilai-minimal-1',
        nilaiAkhirMinimal: 70,
        tingkatKehadiranMinimal: 75,
        createdAt: new Date().toISOString(),
      });
      await pengaturanNilaiMinimal.save();
    }

    // Get komponen nilai
    let komponenNilaiList = await PengaturanKomponenNilai.find().sort({ createdAt: 1 });
    
    // If no komponen nilai exists, create default
    if (komponenNilaiList.length === 0) {
      const defaultKomponenNilai = [
        { id: '1', nama: 'UTS', persentase: 25, isDefault: true, hasNilai: false, createdAt: new Date().toISOString() },
        { id: '2', nama: 'UAS', persentase: 25, isDefault: true, hasNilai: false, createdAt: new Date().toISOString() },
        { id: '3', nama: 'Tugas', persentase: 30, isDefault: true, hasNilai: true, createdAt: new Date().toISOString() },
        { id: '4', nama: 'Kehadiran', persentase: 20, isDefault: true, hasNilai: false, createdAt: new Date().toISOString() },
      ];
      await PengaturanKomponenNilai.insertMany(defaultKomponenNilai);
      komponenNilaiList = await PengaturanKomponenNilai.find().sort({ createdAt: 1 });
    }

    // Convert nilai from backend format (dataNilai array) to frontend format (one doc per murid)
    // Backend: one doc per mapel/kelas/semester/tahunAjaran with dataNilai array
    // Frontend: one doc per murid per mapel per kelas per semester per tahunAjaran
    const nilai = [];
    nilaiDocs.forEach(nilaiDoc => {
      const docObj = nilaiDoc.toObject();
      if (docObj.dataNilai && Array.isArray(docObj.dataNilai)) {
        docObj.dataNilai.forEach((nilaiMurid) => {
          nilai.push({
            id: `${docObj.id}-${nilaiMurid.muridId}`,
            muridId: nilaiMurid.muridId,
            mataPelajaranId: docObj.mataPelajaranId,
            kelasId: docObj.kelasId,
            guruId: docObj.guruId,
            semester: docObj.semester,
            tahunAjaran: docObj.tahunAjaran,
            tugas: nilaiMurid.tugas || [],
            uts: nilaiMurid.uts !== undefined ? nilaiMurid.uts : null,
            uas: nilaiMurid.uas !== undefined ? nilaiMurid.uas : null,
            nilaiAkhir: nilaiMurid.nilaiAkhir !== undefined ? nilaiMurid.nilaiAkhir : null,
            grade: nilaiMurid.grade || null,
            komponenDinamis: nilaiMurid.komponenDinamis || [],
            createdAt: docObj.createdAt,
            updatedAt: nilaiMurid.updatedAt || docObj.updatedAt
          });
        });
      }
    });

    // Determine tahun ajaran and semester
    let targetTahunAjaran = tahunAjaran;
    let targetSemester = semester ? parseInt(semester) : null;

    // If not provided, use active tahun ajaran
    if (!targetTahunAjaran) {
      const activeTahunAjaran = tahunAjaranList.find(ta => ta.isActive);
      if (activeTahunAjaran) {
        targetTahunAjaran = activeTahunAjaran.tahun;
        targetSemester = targetSemester || activeTahunAjaran.semester;
      } else if (tahunAjaranList.length > 0) {
        // Use latest tahun ajaran
        const latest = tahunAjaranList.sort((a, b) => 
          new Date(b.tanggalMulai) - new Date(a.tanggalMulai)
        )[0];
        targetTahunAjaran = latest.tahun;
        targetSemester = targetSemester || latest.semester;
      }
    }

    if (!targetTahunAjaran || !targetSemester) {
      return res.status(400).json({
        success: false,
        message: 'Tahun ajaran dan semester diperlukan',
      });
    }

    // Return all raw data for frontend to generate laporan hasil belajar
    return res.json({
      success: true,
      studentId: student.id,
      semester: targetSemester,
      tahunAjaran: targetTahunAjaran,
      data: {
        users: users, // Already plain objects, no need to call toObject()
        kelas: kelas.map(k => k.toObject()),
        jurusan: jurusan.map(j => j.toObject()),
        nilai: nilai, // Already plain objects, no need to call toObject()
        mataPelajaran: mataPelajaran.map(m => m.toObject()),
        tahunAjaran: tahunAjaranList.filter(ta => ta.tahun === targetTahunAjaran).map(ta => ta.toObject()),
        jadwalPelajaran: jadwalPelajaran.map(j => j.toObject()),
        absensi: absensi.map(a => a.toObject()),
        sesiAbsensi: sesiAbsensi.map(s => s.toObject()),
        statusBagiRaport: statusBagiRaportList.map(s => ({
          id: s._id.toString(),
          kelasId: s.kelasId,
          tahunAjaran: s.tahunAjaran,
          semester: s.semester,
          isPublished: s.isPublished,
          publishedBy: s.publishedBy,
          publishedAt: s.publishedAt,
          createdAt: s.createdAt
        })),
        dataKepsek: dataKepsekList.map(d => d.toObject()),
        pengaturanNilaiMinimal: pengaturanNilaiMinimal ? pengaturanNilaiMinimal.toObject() : null,
        komponenNilai: komponenNilaiList.map(k => k.toObject())
      }
    });
  } catch (error) {
    console.error('Error getting laporan hasil belajar verification:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data laporan hasil belajar',
      error: error.message,
    });
  }
};


