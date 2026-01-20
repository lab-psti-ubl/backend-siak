import SuratIzin from '../models/SuratIzin.js';
import Absensi from '../models/Absensi.js';
import SesiAbsensi from '../models/SesiAbsensi.js';
import JadwalPelajaran from '../models/JadwalPelajaran.js';
import TahunAjaran from '../models/TahunAjaran.js';
import Guru from '../models/Guru.js';
import Murid from '../models/Murid.js';
import Santri from '../models/Santri.js';
import KelasTahfiz from '../models/KelasTahfiz.js';

export const getAllSuratIzin = async (req, res) => {
  try {
    const suratIzin = await SuratIzin.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      suratIzin: suratIzin.map(s => s.toObject()),
    });
  } catch (error) {
    console.error('Error getting surat izin:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data surat izin',
      error: error.message,
    });
  }
};

export const getSuratIzinById = async (req, res) => {
  try {
    const { id } = req.params;
    const suratIzin = await SuratIzin.findOne({ id });
    if (!suratIzin) {
      return res.status(404).json({
        success: false,
        message: 'Surat izin tidak ditemukan',
      });
    }

    const suratData = suratIzin.toObject();

    // Include related data for verification
    const Kelas = (await import('../models/Kelas.js')).default;

    // Get murid data
    const murid = await Murid.findOne({ id: suratData.muridId });
    if (murid) {
      suratData.murid = murid.toObject();
      
      // Get kelas data
      if (murid.kelasId) {
        const kelas = await Kelas.findOne({ id: murid.kelasId });
        if (kelas) {
          suratData.kelas = kelas.toObject();
          
          // Get wali kelas if exists
          if (kelas.waliKelasId) {
            const waliKelas = await Guru.findOne({ id: kelas.waliKelasId });
            if (waliKelas) {
              suratData.waliKelas = waliKelas.toObject();
            }
          }
        }
      }
    }

    return res.json({
      success: true,
      suratIzin: suratData,
    });
  } catch (error) {
    console.error('Error getting surat izin:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data surat izin',
      error: error.message,
    });
  }
};

export const getSuratIzinByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Parameter status diperlukan',
      });
    }
    const suratIzin = await SuratIzin.find({ status }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      suratIzin: suratIzin.map(s => s.toObject()),
    });
  } catch (error) {
    console.error('Error getting surat izin by status:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data surat izin',
      error: error.message,
    });
  }
};

export const getSuratIzinByUstadzId = async (req, res) => {
  try {
    const { ustadzId } = req.query;
    if (!ustadzId) {
      return res.status(400).json({
        success: false,
        message: 'Parameter ustadzId diperlukan',
      });
    }
    const suratIzin = await SuratIzin.find({ ustadzId }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      suratIzin: suratIzin.map(s => s.toObject()),
    });
  } catch (error) {
    console.error('Error getting surat izin by ustadzId:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data surat izin',
      error: error.message,
    });
  }
};

export const createSuratIzin = async (req, res) => {
  try {
    const {
      id,
      muridId,
      jenis,
      alasan,
      tanggalMulai,
      tanggalSelesai,
      jamMulai,
      jamSelesai,
      bukti,
      status,
      keterangan,
      tahunAjaranId,
    } = req.body;

    if (!id || !muridId || !jenis || !alasan || !tanggalMulai || !tanggalSelesai) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap',
      });
    }

    const existingSurat = await SuratIzin.findOne({ id });
    if (existingSurat) {
      return res.status(400).json({
        success: false,
        message: 'Surat izin dengan ID tersebut sudah ada',
      });
    }

    // Get active tahun ajaran if not provided
    let finalTahunAjaranId = tahunAjaranId;
    if (!finalTahunAjaranId) {
      const activeTahunAjaran = await TahunAjaran.findOne({ isActive: true });
      if (!activeTahunAjaran) {
        return res.status(400).json({
          success: false,
          message: 'Tidak ada tahun ajaran aktif. Silakan set tahun ajaran aktif terlebih dahulu',
        });
      }
      finalTahunAjaranId = activeTahunAjaran.id;
    }

    // Check if santri is a class member (murid kelas)
    const murid = await Murid.findOne({ id: muridId });
    let ustadzId = null;

    // If murid not found or murid doesn't have kelasId, check if it's a santri in tahfiz class
    if (!murid || !murid.kelasId) {
      // Check if this is a santri (either from muridIds or santriData)
      const santriDoc = await Santri.findOne({ id: 'santri-single' });
      
      if (santriDoc) {
        // Check if muridId is in muridIds or santriData
        const isInMuridIds = santriDoc.muridIds.some(item => {
          const id = typeof item === 'string' ? item : item.id;
          return id === muridId;
        });
        const isInSantriData = santriDoc.santriData?.some(s => s.id === muridId);

        if (isInMuridIds || isInSantriData) {
          // Find the tahfiz class that contains this santri
          const kelasTahfiz = await KelasTahfiz.findOne({
            santriIds: { $in: [muridId] }
          });

          if (kelasTahfiz && kelasTahfiz.ustadzId) {
            ustadzId = kelasTahfiz.ustadzId;
          }
        }
      }
    }

    const suratData = {
      id,
      muridId,
      jenis,
      alasan,
      tanggalMulai,
      tanggalSelesai,
      jamMulai,
      jamSelesai,
      bukti,
      status: status || 'menunggu',
      keterangan,
      ustadzId: ustadzId || undefined,
      tahunAjaranId: finalTahunAjaranId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Use insertOne() directly from collection when _id: false
    // This avoids the Mongoose _id requirement
    await SuratIzin.collection.insertOne(suratData);
    
    // Fetch the created document
    const newSurat = await SuratIzin.findOne({ id });
    
    return res.status(201).json({
      success: true,
      message: 'Surat izin berhasil dibuat',
      suratIzin: newSurat.toObject(),
    });
  } catch (error) {
    console.error('Error creating surat izin:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat surat izin',
      error: error.message,
    });
  }
};

export const updateSuratIzin = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const suratIzin = await SuratIzin.findOne({ id });
    if (!suratIzin) {
      return res.status(404).json({
        success: false,
        message: 'Surat izin tidak ditemukan',
      });
    }

    delete updateData.id; // Prevent ID change
    updateData.updatedAt = new Date().toISOString();

    await SuratIzin.updateOne({ id }, updateData);
    const updatedSurat = await SuratIzin.findOne({ id });

    return res.json({
      success: true,
      message: 'Surat izin berhasil diperbarui',
      suratIzin: updatedSurat.toObject(),
    });
  } catch (error) {
    console.error('Error updating surat izin:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui surat izin',
      error: error.message,
    });
  }
};

export const deleteSuratIzin = async (req, res) => {
  try {
    const { id } = req.params;
    const suratIzin = await SuratIzin.findOne({ id });
    if (!suratIzin) {
      return res.status(404).json({
        success: false,
        message: 'Surat izin tidak ditemukan',
      });
    }

    await SuratIzin.deleteOne({ id });
    return res.json({
      success: true,
      message: 'Surat izin berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting surat izin:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus surat izin',
      error: error.message,
    });
  }
};

// Helper function to check time overlap
const isTimeOverlapping = (start1, end1, start2, end2) => {
  const [h1, m1] = start1.split(':').map(Number);
  const [h2, m2] = end1.split(':').map(Number);
  const [h3, m3] = start2.split(':').map(Number);
  const [h4, m4] = end2.split(':').map(Number);

  const time1Start = h1 * 60 + m1;
  const time1End = h2 * 60 + m2;
  const time2Start = h3 * 60 + m3;
  const time2End = h4 * 60 + m4;

  return time1Start < time2End && time2Start < time1End;
};

// Helper function to generate date range
const generateDateRange = (startDateStr, endDateStr) => {
  const dates = [];
  const currentDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

// Helper function to get day name from date
const getHariFromDate = (tanggal) => {
  const date = new Date(tanggal);
  const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
  return days[date.getDay()];
};

// Helper function to map status
const mapStatus = (status) => {
  if (status === 'izin') return 'izin';
  if (status === 'sakit') return 'sakit';
  if (status === 'alfa') return 'alfa';
  return 'tepat_waktu';
};

// Helper function: Get all students in a class
const getAllStudentsInClass = async (kelasId) => {
  const students = await Murid.find({
    kelasId: kelasId,
    isActive: { $ne: false }
  }).sort({ name: 1 });
  
  // Filter out any students without valid id
  return students
    .map(s => s && s.id)
    .filter(id => id); // Filter out undefined/null values
};

// Helper function: Get or create absensi document for a date/tahunAjaran/semester
const getOrCreateAbsensiDoc = async (tanggal, tahunAjaranId, semester) => {
  const absensiId = `${tanggal}-${tahunAjaranId}-${semester}`;
  
  let absensiDoc = await Absensi.findOne({ id: absensiId });
  
  if (!absensiDoc) {
    absensiDoc = new Absensi({
      id: absensiId,
      tanggal,
      tahunAjaranId,
      semester,
      kelas: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await absensiDoc.save();
  }
  
  return absensiDoc;
};

// Helper function: Update or create murid attendance in a kelas
const updateOrCreateMuridAbsensi = async (absensiDoc, kelasId, muridId, attendanceData, allMuridIds) => {
  let kelasIndex = absensiDoc.kelas.findIndex(k => k.kelasId === kelasId);
  
  // If kelas doesn't exist, create it
  if (kelasIndex === -1) {
    absensiDoc.kelas.push({
      kelasId,
      murid: []
    });
    kelasIndex = absensiDoc.kelas.length - 1;
  }
  
  // Ensure murid array exists
  if (!absensiDoc.kelas[kelasIndex].murid) {
    absensiDoc.kelas[kelasIndex].murid = [];
  }
  
  // Filter out any invalid entries (with undefined/null muridId)
  absensiDoc.kelas[kelasIndex].murid = absensiDoc.kelas[kelasIndex].murid.filter(m => m && m.muridId);
  
  // Ensure all students in class are present in the murid array
  const existingMuridIds = absensiDoc.kelas[kelasIndex].murid
    .map(m => m && m.muridId)
    .filter(id => id); // Filter out undefined/null values
  
  for (const muridIdInClass of allMuridIds) {
    if (muridIdInClass && !existingMuridIds.includes(muridIdInClass)) {
      // Add student with default empty attendance
      absensiDoc.kelas[kelasIndex].murid.push({
        muridId: muridIdInClass,
      });
    }
  }
  
  // Now update the specific student's attendance
  const muridIndex = absensiDoc.kelas[kelasIndex].murid.findIndex(m => m && m.muridId === muridId);
  
  if (muridIndex === -1) {
    // This shouldn't happen if all students were added above, but handle it anyway
    absensiDoc.kelas[kelasIndex].murid.push({
      muridId,
      ...attendanceData
    });
  } else {
    // Update existing attendance, merge with existing data
    // Ensure muridId is preserved
    const existing = absensiDoc.kelas[kelasIndex].murid[muridIndex];
    absensiDoc.kelas[kelasIndex].murid[muridIndex] = {
      ...existing,
      ...attendanceData,
      muridId: existing.muridId || muridId // Ensure muridId is always present
    };
  }
  
  return absensiDoc;
};

// Verify surat izin and update attendance records
export const verifySuratIzin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, keterangan, verifiedBy, kelasWali } = req.body;

    if (!status || !['diterima', 'ditolak'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status harus diterima atau ditolak',
      });
    }

    const suratIzin = await SuratIzin.findOne({ id });
    if (!suratIzin) {
      return res.status(404).json({
        success: false,
        message: 'Surat izin tidak ditemukan',
      });
    }

    // Update surat izin status
    suratIzin.status = status;
    suratIzin.keterangan = keterangan || suratIzin.keterangan;
    suratIzin.verifiedBy = verifiedBy || req.user?.id;
    suratIzin.verifiedAt = new Date().toISOString();
    suratIzin.updatedAt = new Date().toISOString();

    await suratIzin.save();

    // If approved, update attendance records
    if (status === 'diterima') {
      try {
        // Get active tahun ajaran
        const activeTahunAjaran = await TahunAjaran.findOne({ isActive: true });
        if (!activeTahunAjaran) {
          console.warn('No active tahun ajaran found, skipping attendance update');
        } else {
          // Get murid data to get kelasId
          const murid = await Murid.findOne({ id: suratIzin.muridId });
          const finalKelasWali = kelasWali || murid?.kelasId;

          if (!finalKelasWali) {
            console.warn('No kelasId found, skipping attendance update');
          } else {
            // Get all sesi absensi and jadwal pelajaran
            const sesiAbsensi = await SesiAbsensi.find({});
            const jadwalPelajaran = await JadwalPelajaran.find({});
            const absensi = await Absensi.find({});

            // Untuk izin dispen, hanya update jadwal pelajaran yang overlap dengan waktu dispen
            if (suratIzin.jenis === 'izin_dispen') {
              if (!suratIzin.jamMulai || !suratIzin.jamSelesai) {
                console.warn('Izin dispen harus ada jam mulai dan selesai');
              } else {
                const tanggal = suratIzin.tanggalMulai;

                // Hanya update jadwal pelajaran yang overlap dengan waktu izin dispen
                const sessionsOnDate = sesiAbsensi.filter(sesi => {
                  const sesiDate = sesi.tanggal;
                  const jadwal = jadwalPelajaran.find(j => j.id === sesi.jadwalId);

                  return jadwal &&
                         jadwal.kelasId === finalKelasWali &&
                         sesiDate === tanggal;
                });

                // Update absensi for each session
                for (const sesi of sessionsOnDate) {
                  const jadwal = jadwalPelajaran.find(j => j.id === sesi.jadwalId);
                  if (!jadwal) continue;

                  // Cek apakah jadwal overlap dengan waktu izin dispen
                  const isOverlapping = isTimeOverlapping(
                    suratIzin.jamMulai,
                    suratIzin.jamSelesai,
                    jadwal.jamMulai,
                    jadwal.jamSelesai
                  );

                  if (!isOverlapping) {
                    continue; // Skip jadwal yang tidak overlap
                  }

                  const existingSesiAbsensi = absensi.find(a =>
                    a.sesiId === sesi.id && a.muridId === suratIzin.muridId
                  );

                  // Untuk izin dispen, hanya update jika belum ada atau status bukan 'hadir'
                  if (sesi.status === 'ditutup' || existingSesiAbsensi?.status === 'hadir') {
                    continue;
                  }

                  const keteranganAbsensi = `Izin dispen disetujui (${suratIzin.jamMulai} - ${suratIzin.jamSelesai})`;
                  const now = new Date().toISOString();

                  if (!existingSesiAbsensi) {
                    // Create new absensi for session
                    const sesiAbsensiId = `absensi${Date.now()}-${sesi.id}-${suratIzin.muridId}`;
                    const newAbsensi = new Absensi({
                      id: sesiAbsensiId,
                      sesiId: sesi.id,
                      muridId: suratIzin.muridId,
                      tanggal: sesi.tanggal,
                      kelasId: finalKelasWali,
                      statusMasuk: 'izin',
                      statusKeluar: 'izin',
                      jamMasuk: now,
                      jamKeluar: now,
                      keterangan: keteranganAbsensi,
                      method: 'manual',
                      tahunAjaranId: activeTahunAjaran.id,
                      semester: activeTahunAjaran.semester,
                      // Legacy fields
                      tipeAbsen: 'masuk',
                      status: 'izin',
                      waktu: now,
                    });
                    await newAbsensi.save();
                  } else {
                    // Update existing absensi
                    existingSesiAbsensi.status = 'izin';
                    existingSesiAbsensi.statusMasuk = 'izin';
                    existingSesiAbsensi.statusKeluar = 'izin';
                    existingSesiAbsensi.keterangan = keteranganAbsensi;
                    existingSesiAbsensi.updatedAt = new Date().toISOString();
                    await existingSesiAbsensi.save();
                  }
                }
              }
            } else {
              // Logika untuk izin/sakit biasa (tidak izin dispen)
              const attendanceStatus = suratIzin.jenis === 'izin' ? 'izin' : 'sakit';
              const keteranganAbsensi = `Surat ${suratIzin.jenis} disetujui`;

              const dateRange = generateDateRange(suratIzin.tanggalMulai, suratIzin.tanggalSelesai);
              
              // Get all students in class for the helper function
              const allMuridIds = await getAllStudentsInClass(finalKelasWali);

              // Update absensi for each date in range
              for (const tanggal of dateRange) {
                // Get or create the daily absensi document (one document per date)
                const absensiDoc = await getOrCreateAbsensiDoc(
                  tanggal,
                  activeTahunAjaran.id,
                  activeTahunAjaran.semester
                );

                // Find existing murid attendance data in the document
                const kelasData = absensiDoc.kelas.find(k => k.kelasId === finalKelasWali);
                const existingMuridData = kelasData?.murid?.find(m => m && m.muridId === suratIzin.muridId);

                // Check if student has already checked in (masuk)
                const hasMasukHadirTerlambat = existingMuridData && (
                  existingMuridData.statusMasuk === 'tepat_waktu' ||
                  existingMuridData.statusMasuk === 'terlambat' ||
                  existingMuridData.statusMasuk === 'hadir' ||
                  existingMuridData.jamMasuk
                );

                const now = new Date().toISOString();
                const mappedStatus = mapStatus(attendanceStatus);

                // Prepare attendance data based on whether student has checked in
                let attendanceData = {
                  keterangan: keteranganAbsensi,
                  method: 'manual',
                  // Legacy fields
                  tipeAbsen: 'masuk',
                  status: attendanceStatus,
                  waktu: now,
                };

                if (!hasMasukHadirTerlambat) {
                  // Student hasn't checked in yet: set both masuk and pulang to izin/sakit
                  attendanceData.jamMasuk = now;
                  attendanceData.statusMasuk = mappedStatus;
                  attendanceData.jamKeluar = now;
                  attendanceData.statusKeluar = mappedStatus;
                } else {
                  // Student has already checked in: keep masuk, set pulang to izin/sakit
                  // Preserve existing masuk data
                  if (existingMuridData.jamMasuk) {
                    attendanceData.jamMasuk = existingMuridData.jamMasuk;
                  }
                  if (existingMuridData.statusMasuk) {
                    attendanceData.statusMasuk = existingMuridData.statusMasuk;
                  }
                  // Update pulang to izin/sakit (set jamKeluar to now when izin is approved)
                  attendanceData.jamKeluar = now;
                  attendanceData.statusKeluar = mappedStatus;
                }

                // Update or create murid attendance in the document
                await updateOrCreateMuridAbsensi(
                  absensiDoc,
                  finalKelasWali,
                  suratIzin.muridId,
                  attendanceData,
                  allMuridIds
                );
                
                // Save the document
                await absensiDoc.save();
              }
            }
          }
        }
      } catch (attendanceError) {
        console.error('Error updating attendance records:', attendanceError);
        // Don't fail the request if attendance update fails, just log it
      }
    }

    return res.json({
      success: true,
      message: `Surat izin berhasil ${status === 'diterima' ? 'diterima' : 'ditolak'}`,
      suratIzin: suratIzin.toObject(),
    });
  } catch (error) {
    console.error('Error verifying surat izin:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memverifikasi surat izin',
      error: error.message,
    });
  }
};

