import ERaport from '../models/ERaport.js';
import Guru from '../models/Guru.js';
import Kelas from '../models/Kelas.js';
import Nilai from '../models/Nilai.js';
import NilaiEkstrakulikuler from '../models/NilaiEkstrakulikuler.js';
import Kokulikuler from '../models/Kokulikuler.js';
import Absensi from '../models/Absensi.js';
import TahunAjaran from '../models/TahunAjaran.js';
import ProfilSekolah from '../models/ProfilSekolah.js';
import DataKepsek from '../models/DataKepsek.js';
import CapaianPembelajaran from '../models/CapaianPembelajaran.js';
import JadwalPelajaran from '../models/JadwalPelajaran.js';
import MataPelajaran from '../models/MataPelajaran.js';
import Ekstrakulikuler from '../models/Ekstrakulikuler.js';
import Murid from '../models/Murid.js';
import PengaturanNilaiMinimal from '../models/PengaturanNilaiMinimal.js';
import PengaturanJenjangPendidikan from '../models/PengaturanJenjangPendidikan.js';
import SesiAbsensi from '../models/SesiAbsensi.js';

// Helper function to calculate kehadiran per mata pelajaran (like in raport)
const calculateKehadiranPerMapel = async (muridId, mataPelajaranId, kelasId, guruId, semester, tahunAjaranId, jadwalPelajaran) => {
  try {
    // Get all schedules for this teacher, subject, and class in the current semester
    const relevantSchedules = jadwalPelajaran.filter(j =>
      j.guruId === guruId &&
      j.mataPelajaranId === mataPelajaranId &&
      j.kelasId === kelasId &&
      j.semester === semester
    );

    if (relevantSchedules.length === 0) return 100;

    // Get all sessions for these schedules
    const scheduleIds = relevantSchedules.map(s => s.id);
    const subjectSessions = await SesiAbsensi.find({
      jadwalId: { $in: scheduleIds },
      tahunAjaranId: tahunAjaranId,
      semester: semester,
    });

    if (subjectSessions.length === 0) return 100; // No sessions opened yet = 100%

    // Count attendance from dataAbsensi inside each session
    let hadirCount = 0;
    let totalSessions = subjectSessions.length;

    subjectSessions.forEach(session => {
      // Check if session has dataAbsensi
      if (session.dataAbsensi && Array.isArray(session.dataAbsensi)) {
        const studentRecord = session.dataAbsensi.find(a => a.muridId === muridId);
        if (studentRecord && studentRecord.status === 'hadir') {
          hadirCount++;
        }
      }
    });

    return totalSessions > 0 ? (hadirCount / totalSessions) * 100 : 100;
  } catch (error) {
    console.error('Error calculating kehadiran per mapel:', error);
    return 100; // Default to 100% if error
  }
};

// Helper function to calculate attendance rate from daily attendance (absen kehadiran) for graduation/promotion
const calculateKehadiranFromDailyAttendance = async (muridId, kelasId, tahunAjaranId, semester) => {
  try {
    // Get all absensi records for this year and semester
    const absensiRecords = await Absensi.find({
      tahunAjaranId,
      semester,
    });

    if (!absensiRecords || absensiRecords.length === 0) return 100; // No attendance records = 100% (default)

    // Get unique dates that have attendance records for this class
    const uniqueDates = new Set();
    absensiRecords.forEach(record => {
      if (record.tanggal && record.kelas && Array.isArray(record.kelas)) {
        const kelasData = record.kelas.find(k => k.kelasId === kelasId);
        if (kelasData) {
          uniqueDates.add(record.tanggal);
        }
      }
    });

    if (uniqueDates.size === 0) return 100; // No dates for this class = 100% (default)

    // Group murid absensi by tanggal
    const absensiByDate = {};
    absensiRecords.forEach(record => {
      if (record.tanggal && record.kelas && Array.isArray(record.kelas)) {
        const kelasData = record.kelas.find(k => k.kelasId === kelasId);
        if (kelasData && kelasData.murid && Array.isArray(kelasData.murid)) {
          const muridData = kelasData.murid.find(m => m.muridId === muridId);
          if (muridData) {
            absensiByDate[record.tanggal] = muridData;
          }
        }
      }
    });

    let hadirCount = 0;
    let totalDays = uniqueDates.size;

    // Process each unique date
    uniqueDates.forEach(tanggal => {
      const dayAbsensi = absensiByDate[tanggal];

      if (!dayAbsensi) {
        // Date exists in database but student has no record = alfa (not counted as hadir)
        return;
      }

      // Get status from new structure (statusMasuk/statusKeluar) or old structure (status)
      const statusMasuk = dayAbsensi.statusMasuk || dayAbsensi.status;
      const statusKeluar = dayAbsensi.statusKeluar;
      const jamMasuk = dayAbsensi.jamMasuk;

      // If there's jamMasuk or statusMasuk indicates attendance, check status
      const hasMasuk = jamMasuk || statusMasuk === 'tepat_waktu' || statusMasuk === 'hadir' || statusMasuk === 'terlambat';

      if (hasMasuk) {
        // Check if status is hadir (not izin, sakit, or alfa)
        if (statusMasuk === 'hadir' || statusMasuk === 'tepat_waktu' || statusMasuk === 'terlambat') {
          // If there's pulang status, check it too
          if (statusKeluar) {
            // If pulang status is izin or sakit, it's dispensation (dispen), not counted as hadir
            if (statusKeluar === 'izin' || statusKeluar === 'sakit') {
              return; // Not counted as hadir
            }
            // If pulang status is alfa or tidak_keluar, it's bolos, not counted as hadir
            if (statusKeluar === 'alfa' || statusKeluar === 'tidak_keluar') {
              return; // Not counted as hadir
            }
            // Both masuk and pulang are valid, count as hadir
            if (statusKeluar === 'hadir' || statusKeluar === 'tepat_waktu' || statusKeluar === 'pulang_awal' || statusKeluar === 'pulang_cepat') {
              hadirCount++;
              return;
            }
          }
          // Masuk is valid and no pulang status yet (or valid), count as hadir
          hadirCount++;
        } else if (statusMasuk === 'izin' || statusMasuk === 'sakit') {
          // Izin or sakit, not counted as hadir
          return;
        } else if (statusMasuk === 'alfa' || statusMasuk === 'tidak_masuk') {
          // Alfa, not counted as hadir
          return;
        } else if (statusMasuk && (statusMasuk === 'hadir' || statusMasuk === 'tepat_waktu' || statusMasuk === 'terlambat')) {
          // Fallback: if status is hadir/tepat_waktu/terlambat, count as hadir
          hadirCount++;
        }
      } else {
        // No masuk record, check status
        if (statusMasuk === 'izin' || statusMasuk === 'sakit' || statusMasuk === 'alfa' || statusMasuk === 'tidak_masuk') {
          // Not counted as hadir
          return;
        }
        // If status exists and is 'hadir', count it
        if (statusMasuk === 'hadir' || (dayAbsensi.status === 'hadir')) {
          hadirCount++;
        }
      }
    });

    return totalDays > 0 ? (hadirCount / totalDays) * 100 : 100;
  } catch (error) {
    console.error('Error calculating kehadiran from daily attendance:', error);
    return 100; // Default to 100% if error
  }
};

// Helper function to generate keterangan kenaikan kelas
const generateKeteranganKenaikanKelas = async (semester, tingkat, nilaiMataPelajaran, muridId, kelasId, tahunAjaranId, jadwalPelajaran, kelas) => {
  // Only generate for semester genap (2)
  if (semester !== 2) {
    return '';
  }

  try {
    // Get pengaturan nilai minimal
    let pengaturanNilaiMinimal = await PengaturanNilaiMinimal.findOne();
    if (!pengaturanNilaiMinimal) {
      pengaturanNilaiMinimal = new PengaturanNilaiMinimal({
        id: 'pengaturan-nilai-minimal-1',
        nilaiAkhirMinimal: 70,
        tingkatKehadiranMinimal: 75,
        createdAt: new Date().toISOString(),
      });
      await pengaturanNilaiMinimal.save();
    }

    // Get max tingkat from jenjang pendidikan
    const jenjangPendidikan = await PengaturanJenjangPendidikan.findOne({ isActive: true });
    if (!jenjangPendidikan) {
      return '';
    }
    const maxTingkat = jenjangPendidikan.tingkatAkhir || 12;

    // Calculate average nilai (overallGrade) - same as raport
    const validGrades = nilaiMataPelajaran.filter(n => n.nilaiAkhir !== null && n.nilaiAkhir !== undefined);
    const overallGrade = validGrades.length > 0 
      ? validGrades.reduce((sum, n) => sum + (n.nilaiAkhir || 0), 0) / validGrades.length
      : 0;

    // Calculate attendance rate from daily attendance (absen kehadiran) for graduation/promotion requirements
    const attendanceRate = await calculateKehadiranFromDailyAttendance(
      muridId,
      kelasId,
      tahunAjaranId,
      semester
    );

    // Check if meets requirements (same logic as raport)
    const meetsRequirements = overallGrade >= pengaturanNilaiMinimal.nilaiAkhirMinimal && 
                              attendanceRate >= pengaturanNilaiMinimal.tingkatKehadiranMinimal;

    // Generate keterangan
    if (tingkat === maxTingkat) {
      // Kelulusan
      if (meetsRequirements) {
        return 'Lulus';
      } else {
        return 'Tidak Lulus';
      }
    } else {
      // Kenaikan kelas
      if (meetsRequirements) {
        const nextTingkat = tingkat + 1;
        return `Naik Ke Kelas ${nextTingkat}`;
      } else {
        return `Tidak Naik Kelas, Tinggal di Kelas ${tingkat}`;
      }
    }
  } catch (error) {
    console.error('Error generating keterangan kenaikan kelas:', error);
    return '';
  }
};

// Helper function to generate catatan wali kelas
const generateCatatanWaliKelas = (nilaiMataPelajaran, kehadiran) => {
  if (!nilaiMataPelajaran || nilaiMataPelajaran.length === 0) {
    return 'Belum ada data nilai yang cukup untuk membuat catatan.';
  }

  // Calculate average grade
  const totalNilai = nilaiMataPelajaran.reduce((sum, item) => sum + (item.nilaiAkhir || 0), 0);
  const avgNilai = totalNilai / nilaiMataPelajaran.length;

  // Calculate total days and attendance rate
  const totalHari = kehadiran.sakit + kehadiran.izin + kehadiran.alfa;
  const hadirHari = totalHari - kehadiran.alfa;
  const attendanceRate = totalHari > 0 ? (hadirHari / totalHari) * 100 : 100;

  let academicNote = '';
  if (avgNilai >= 85) {
    academicNote = `Ananda menunjukkan prestasi akademik yang sangat baik dengan rata-rata nilai ${avgNilai.toFixed(1)}.`;
  } else if (avgNilai >= 75) {
    academicNote = `Ananda menunjukkan prestasi akademik yang baik dengan rata-rata nilai ${avgNilai.toFixed(1)}.`;
  } else if (avgNilai >= 65) {
    academicNote = `Ananda menunjukkan prestasi akademik yang cukup dengan rata-rata nilai ${avgNilai.toFixed(1)}.`;
  } else {
    academicNote = `Ananda perlu meningkatkan prestasi akademik dengan rata-rata nilai ${avgNilai.toFixed(1)}.`;
  }

  let attendanceNote = '';
  if (attendanceRate >= 90) {
    attendanceNote = ' Tingkat kehadiran sangat baik dan konsisten.';
  } else if (attendanceRate >= 80) {
    attendanceNote = ' Tingkat kehadiran baik, namun masih bisa ditingkatkan.';
  } else if (attendanceRate >= 70) {
    attendanceNote = ' Tingkat kehadiran cukup, perlu lebih konsisten dalam menghadiri pelajaran.';
  } else {
    attendanceNote = ' Perlu meningkatkan kehadiran untuk mendukung prestasi akademik.';
  }

  return academicNote + attendanceNote + ' Terus semangat belajar dan pertahankan prestasi yang baik!';
};

// Helper function to calculate kehadiran
const calculateKehadiran = async (muridId, kelasId, tahunAjaranId, semester) => {
  try {
    // Get all absensi records for this class, year, and semester
    const absensiRecords = await Absensi.find({
      tahunAjaranId,
      semester,
    });

    let sakit = 0;
    let izin = 0;
    let alfa = 0;
    const processedDates = new Set(); // Track dates we've already processed

    // Process each absensi record (each record represents one date)
    for (const absensiRecord of absensiRecords) {
      const tanggal = absensiRecord.tanggal;
      
      // Skip if we've already processed this date
      if (processedDates.has(tanggal)) continue;
      processedDates.add(tanggal);

      // Find kelas data for this class
      const kelasData = absensiRecord.kelas?.find(k => k.kelasId === kelasId);
      if (!kelasData) continue;

      // Find murid data for this student
      const muridData = kelasData.murid?.find(m => m.muridId === muridId);
      
      if (muridData) {
        // Get status from muridData
        const statusMasuk = muridData.statusMasuk;
        const statusKeluar = muridData.statusKeluar;
        const status = muridData.status;
        const jamMasuk = muridData.jamMasuk;
        
        // Jika ada absen masuk (jamMasuk ada atau statusMasuk = tepat_waktu/terlambat/hadir)
        // maka dihitung hadir, tidak dihitung sebagai sakit/izin/alfa
        const hasAbsenMasuk = jamMasuk || 
          statusMasuk === 'tepat_waktu' || 
          statusMasuk === 'terlambat' || 
          statusMasuk === 'hadir';
        
        if (hasAbsenMasuk) {
          // Ada absen masuk = hadir, tidak dihitung sebagai sakit/izin/alfa
          // Skip this date
          continue;
        }
        
        // Jika tidak ada absen masuk, cek status untuk menentukan sakit/izin/alfa
        // Priority: statusMasuk > statusKeluar > status
        
        if (statusMasuk === 'sakit') {
          sakit++;
        } else if (statusMasuk === 'izin') {
          izin++;
        } else if (statusMasuk === 'alfa' || statusMasuk === 'tidak_masuk') {
          alfa++;
        } else if (statusKeluar === 'sakit') {
          sakit++;
        } else if (statusKeluar === 'izin') {
          izin++;
        } else if (statusKeluar === 'alfa') {
          alfa++;
        } else if (status === 'sakit') {
          sakit++;
        } else if (status === 'izin') {
          izin++;
        } else if (status === 'alfa' || status === 'tidak_masuk') {
          alfa++;
        } else {
          // Jika tidak ada status yang jelas, tapi tidak ada absen masuk, hitung sebagai alfa
          alfa++;
        }
      } else {
        // Jika tanggal ada di database tapi murid tidak memiliki record absensi
        // maka dihitung sebagai alfa (tanpa keterangan)
        alfa++;
      }
    }

    return { sakit, izin, alfa };
  } catch (error) {
    console.error('Error calculating kehadiran:', error);
    console.error('Error details:', {
      muridId,
      kelasId,
      tahunAjaranId,
      semester,
      error: error.message,
      stack: error.stack
    });
    // Return zeros if there's an error
    return { sakit: 0, izin: 0, alfa: 0 };
  }
};

// Generate E-Raport for a class
export const generateERaport = async (req, res) => {
  try {
    const { kelasId, tahunAjaran, semester } = req.body;
    const waliKelasId = req.user.id;

    if (!kelasId || !tahunAjaran || !semester) {
      return res.status(400).json({
        success: false,
        message: 'kelasId, tahunAjaran, dan semester wajib diisi',
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

    // Validate wali kelas
    const Guru = (await import('../models/Guru.js')).default;
    const waliKelas = await Guru.findOne({ id: waliKelasId });
    if (!waliKelas) {
      return res.status(400).json({
        success: false,
        message: 'Wali kelas tidak ditemukan',
      });
    }

    // Get tahun ajaran data
    const tahunAjaranData = await TahunAjaran.findOne({
      tahun: tahunAjaran,
      semester: parseInt(semester),
    });

    if (!tahunAjaranData) {
      return res.status(400).json({
        success: false,
        message: 'Tahun ajaran tidak ditemukan',
      });
    }

    // Get all active students in the class
    const muridList = await Murid.find({
      kelasId: kelasId,
      isActive: true,
    });

    if (muridList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada murid aktif di kelas ini',
      });
    }

    // Get sekolah data
    const profilSekolah = await ProfilSekolah.findOne();
    if (!profilSekolah) {
      return res.status(400).json({
        success: false,
        message: 'Data profil sekolah tidak ditemukan',
      });
    }

    // Get kepala sekolah data
    const dataKepsek = await DataKepsek.findOne();
    if (!dataKepsek) {
      return res.status(400).json({
        success: false,
        message: 'Data kepala sekolah tidak ditemukan',
      });
    }

    // Get jadwal pelajaran untuk mendapatkan mata pelajaran
    const jadwalPelajaran = await JadwalPelajaran.find({
      kelasId,
      tahunAjaran,
      semester: parseInt(semester),
    });

    // Get unique mata pelajaran IDs
    const mataPelajaranIds = [...new Set(jadwalPelajaran.map(j => j.mataPelajaranId))];

    // Get mata pelajaran details
    const mataPelajaranList = await MataPelajaran.find({
      id: { $in: mataPelajaranIds },
    });

    // Get capaian pembelajaran for wali kelas
    const capaianPembelajaran = await CapaianPembelajaran.findOne({
      guruId: waliKelasId,
      tahunAjaran,
      semester: parseInt(semester),
    });

    // Get kokulikuler data
    const kokulikuler = await Kokulikuler.findOne({
      kelasId,
      tahunAjaran,
      semester: parseInt(semester),
    });

    // Get nilai ekstrakulikuler kelas
    const nilaiEkstrakulikulerKelas = await NilaiEkstrakulikuler.findOne({
      kelasId,
      tahunAjaran,
      semester: parseInt(semester),
    });

    // Process each student
    const muridDataArray = await Promise.all(
      muridList.map(async (murid) => {
        try {
          // Get nilai for this student
          const nilaiMataPelajaran = [];
          
          for (const mataPelajaranId of mataPelajaranIds) {
            try {
              const nilaiRecord = await Nilai.findOne({
                mataPelajaranId,
                kelasId,
                tahunAjaran,
                semester: parseInt(semester),
              });

              if (nilaiRecord && nilaiRecord.dataNilai) {
                const muridNilai = nilaiRecord.dataNilai.find(n => n.muridId === murid.id);
                if (muridNilai && muridNilai.nilaiAkhir !== null && muridNilai.nilaiAkhir !== undefined) {
                  const mataPelajaran = mataPelajaranList.find(mp => mp.id === mataPelajaranId);
                  
                  // Get capaian pembelajaran for this subject
                  let capaianPembelajaranText = '';
                  if (capaianPembelajaran && capaianPembelajaran.tingkatData) {
                    const tingkatData = capaianPembelajaran.tingkatData.find(t => t.tingkat === kelas.tingkat);
                    if (tingkatData) {
                      const mataPelajaranData = tingkatData.mataPelajaranData.find(mp => mp.mataPelajaranId === mataPelajaranId);
                      if (mataPelajaranData) {
                        capaianPembelajaranText = mataPelajaranData.capaianPembelajaran;
                      }
                    }
                  }

                  nilaiMataPelajaran.push({
                    mataPelajaranId,
                    mataPelajaran: mataPelajaran ? mataPelajaran.name : '',
                    nilaiAkhir: muridNilai.nilaiAkhir,
                    capaianPembelajaran: capaianPembelajaranText,
                  });
                }
              }
            } catch (err) {
              console.error(`Error processing nilai for murid ${murid.id}, mataPelajaran ${mataPelajaranId}:`, err);
              // Continue with next mata pelajaran
            }
          }

        // Get kokulikuler for this student
        let kokulikulerText = '';
        if (kokulikuler && kokulikuler.muridData) {
          const muridKokulikuler = kokulikuler.muridData.find(m => m.muridId === murid.id);
          if (muridKokulikuler) {
            kokulikulerText = muridKokulikuler.kokulikuler || '';
          }
        }

        // Get nilai ekstrakulikuler for this student
        const nilaiEkstrakulikulerArray = [];
        if (nilaiEkstrakulikulerKelas && nilaiEkstrakulikulerKelas.muridData) {
          const muridNilaiEkstra = nilaiEkstrakulikulerKelas.muridData.find(m => m.muridId === murid.id);
          if (muridNilaiEkstra && muridNilaiEkstra.nilaiEkstrakulikuler) {
            for (const nilaiEkstra of muridNilaiEkstra.nilaiEkstrakulikuler) {
              // Get ekstrakulikuler name
              const ekstraData = await Ekstrakulikuler.findOne({ id: nilaiEkstra.ekstrakulikulerId });
              
              nilaiEkstrakulikulerArray.push({
                ekstrakulikulerId: nilaiEkstra.ekstrakulikulerId,
                namaEkstrakulikuler: ekstraData ? ekstraData.nama : '',
                predikat: nilaiEkstra.predikat,
                keterangan: nilaiEkstra.keterangan || '',
              });
            }
          }
        }

        // Calculate kehadiran
        const kehadiran = await calculateKehadiran(
          murid.id,
          kelasId,
          tahunAjaranData.id,
          parseInt(semester)
        );

        // Generate catatan wali kelas
        const catatanWaliKelas = generateCatatanWaliKelas(nilaiMataPelajaran, kehadiran);

        // Generate keterangan kenaikan kelas (only for semester genap)
        // Use same logic as raport: calculate overallGrade and attendanceRate per mata pelajaran
        const keteranganKenaikanKelas = await generateKeteranganKenaikanKelas(
          parseInt(semester),
          kelas.tingkat,
          nilaiMataPelajaran,
          murid.id,
          kelasId,
          tahunAjaranData.id,
          jadwalPelajaran,
          kelas
        );

        // Get parent name from whatsappOrtu or use default
        const namaOrangTua = murid.whatsappOrtu || '';

        // Determine fase based on tingkat
        // Fase A untuk Kelas I-II SD (tingkat 1-2)
        // Fase B untuk Kelas III-IV SD (tingkat 3-4)
        // Fase C untuk Kelas V-VI SD (tingkat 5-6)
        // Fase D untuk Kelas VII-IX SMP (tingkat 7-9)
        // Fase E untuk Kelas X SMA/SMK (tingkat 10)
        // Fase F untuk Kelas XI-XII SMA/SMK (tingkat 11-12)
        let fase = '';
        if (kelas.tingkat <= 2) {
          fase = 'A'; // Fase A untuk Kelas I-II SD
        } else if (kelas.tingkat <= 4) {
          fase = 'B'; // Fase B untuk Kelas III-IV SD
        } else if (kelas.tingkat <= 6) {
          fase = 'C'; // Fase C untuk Kelas V-VI SD
        } else if (kelas.tingkat <= 9) {
          fase = 'D'; // Fase D untuk Kelas VII-IX SMP
        } else if (kelas.tingkat === 10) {
          fase = 'E'; // Fase E untuk Kelas X SMA/SMK
        } else if (kelas.tingkat >= 11) {
          fase = 'F'; // Fase F untuk Kelas XI-XII SMA/SMK
        }

          return {
            muridId: murid.id,
            namaMurid: murid.name,
            nisn: murid.nisn || '',
            kelas: kelas.name,
            fase,
            semester: parseInt(semester),
            tahunAjaran,
            namaOrangTua,
            nilaiMataPelajaran,
            kokulikuler: kokulikulerText,
            nilaiEkstrakulikuler: nilaiEkstrakulikulerArray,
            kehadiran,
            catatanWaliKelas,
            keteranganKenaikanKelas,
          };
        } catch (err) {
          console.error(`Error processing murid ${murid.id}:`, err);
          // Return minimal data for this student
          return {
            muridId: murid.id,
            namaMurid: murid.name,
            nisn: murid.nisn || '',
            kelas: kelas.name,
            fase: '',
            semester: parseInt(semester),
            tahunAjaran,
            namaOrangTua: murid.whatsappOrtu || '',
            nilaiMataPelajaran: [],
            kokulikuler: '',
            nilaiEkstrakulikuler: [],
            kehadiran: { sakit: 0, izin: 0, alfa: 0 },
            catatanWaliKelas: 'Data tidak lengkap',
            keteranganKenaikanKelas: '',
          };
        }
      })
    );

    const now = new Date().toISOString();
    const semesterNum = parseInt(semester);

    // Check if E-Raport already exists
    const existing = await ERaport.findOne({
      kelasId,
      tahunAjaran,
      semester: semesterNum,
    });

    let eraport;
    if (existing) {
      // Update existing
      existing.waliKelasId = waliKelasId;
      existing.kelas = {
        nama: kelas.name,
        tingkat: kelas.tingkat,
      };
      existing.waliKelas = {
        namaGuru: waliKelas.name,
        nip: waliKelas.nip || '',
      };
      existing.sekolah = {
        namaSekolah: profilSekolah.namaSekolah,
        alamatSekolah: profilSekolah.alamat || '',
      };
      existing.kepalaSekolah = {
        namaKepalaSekolah: dataKepsek.nama,
        nip: dataKepsek.nip || '',
      };
      existing.muridData = muridDataArray;
      existing.updatedAt = now;
      await existing.save();
      eraport = existing;
    } else {
      // Create new
      const eraportId = `eraport-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      eraport = new ERaport({
        id: eraportId,
        kelasId,
        waliKelasId,
        tahunAjaran,
        semester: semesterNum,
        kelas: {
          nama: kelas.name,
          tingkat: kelas.tingkat,
        },
        waliKelas: {
          namaGuru: waliKelas.name,
          nip: waliKelas.nip || '',
        },
        sekolah: {
          namaSekolah: profilSekolah.namaSekolah,
          alamatSekolah: profilSekolah.alamat || '',
        },
        kepalaSekolah: {
          namaKepalaSekolah: dataKepsek.nama,
          nip: dataKepsek.nip || '',
        },
        muridData: muridDataArray,
        createdAt: now,
        updatedAt: now,
      });
      await eraport.save();
    }

    return res.json({
      success: true,
      message: 'E-Raport berhasil di-generate',
      eraport: eraport.toObject(),
    });
  } catch (error) {
    console.error('Generate E-Raport error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat generate E-Raport',
      error: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// Get E-Raport by kelas, tahun ajaran, and semester
export const getERaport = async (req, res) => {
  try {
    const { kelasId, tahunAjaran, semester } = req.query;

    if (!kelasId || !tahunAjaran || !semester) {
      return res.status(400).json({
        success: false,
        message: 'kelasId, tahunAjaran, dan semester wajib diisi',
      });
    }

    const eraport = await ERaport.findOne({
      kelasId,
      tahunAjaran,
      semester: parseInt(semester),
    });

    if (!eraport) {
      return res.json({
        success: true,
        eraport: null,
        message: 'Data E-Raport tidak ditemukan',
      });
    }

    return res.json({
      success: true,
      eraport: eraport.toObject(),
    });
  } catch (error) {
    console.error('Get E-Raport error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data E-Raport',
    });
  }
};

// Get E-Raport data for a specific student
export const getERaportByMurid = async (req, res) => {
  try {
    const { kelasId, tahunAjaran, semester, muridId } = req.query;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!kelasId || !tahunAjaran || !semester || !muridId) {
      return res.status(400).json({
        success: false,
        message: 'kelasId, tahunAjaran, semester, dan muridId wajib diisi',
      });
    }

    // Security check: If user is a student (murid), they can only view their own E-Raport
    if (userRole === 'murid' && muridId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk melihat E-Raport murid lain',
      });
    }

    const eraport = await ERaport.findOne({
      kelasId,
      tahunAjaran,
      semester: parseInt(semester),
    });

    if (!eraport) {
      return res.status(404).json({
        success: false,
        message: 'Data E-Raport tidak ditemukan',
      });
    }

    const muridData = eraport.muridData.find(m => m.muridId === muridId);
    if (!muridData) {
      return res.status(404).json({
        success: false,
        message: 'Data murid tidak ditemukan dalam E-Raport',
      });
    }

    return res.json({
      success: true,
      eraport: {
        ...eraport.toObject(),
        muridData: [muridData], // Return only this student's data
      },
    });
  } catch (error) {
    console.error('Get E-Raport by murid error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data E-Raport',
    });
  }
};

