import IzinGuru from '../models/IzinGuru.js';
import TahunAjaran from '../models/TahunAjaran.js';
import AbsensiGuru from '../models/AbsensiGuru.js';
import Guru from '../models/Guru.js';

export const getAllIzinGuru = async (req, res) => {
  try {
    const izinGuru = await IzinGuru.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      izinGuru: izinGuru.map(i => i.toObject()),
    });
  } catch (error) {
    console.error('Error getting izin guru:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data izin guru',
      error: error.message,
    });
  }
};

export const getIzinGuruById = async (req, res) => {
  try {
    const { id } = req.params;
    const izinGuru = await IzinGuru.findOne({ id });
    if (!izinGuru) {
      return res.status(404).json({
        success: false,
        message: 'Izin guru tidak ditemukan',
      });
    }

    const izinData = izinGuru.toObject();

    // Include related data for verification
    const Guru = (await import('../models/Guru.js')).default;

    // Get guru data
    const guru = await Guru.findOne({ id: izinData.guruId });
    if (guru) {
      izinData.guru = guru.toObject();
    }

    return res.json({
      success: true,
      izinGuru: izinData,
    });
  } catch (error) {
    console.error('Error getting izin guru:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data izin guru',
      error: error.message,
    });
  }
};

export const getIzinGuruByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Parameter status diperlukan',
      });
    }
    const izinGuru = await IzinGuru.find({ status }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      izinGuru: izinGuru.map(i => i.toObject()),
    });
  } catch (error) {
    console.error('Error getting izin guru by status:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data izin guru',
      error: error.message,
    });
  }
};

export const createIzinGuru = async (req, res) => {
  try {
    const {
      id,
      guruId,
      jenis,
      alasan,
      tanggalMulai,
      tanggalSelesai,
      jamMulai,
      jamSelesai,
      bukti,
      guruPenggantiList,
      status,
      keterangan,
      tahunAjaranId,
    } = req.body;

    if (!id || !guruId || !jenis || !alasan || !tanggalMulai || !tanggalSelesai) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap',
      });
    }

    const existingIzin = await IzinGuru.findOne({ id });
    if (existingIzin) {
      return res.status(400).json({
        success: false,
        message: 'Izin guru dengan ID tersebut sudah ada',
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

    const izinData = {
      id,
      guruId,
      jenis,
      alasan,
      tanggalMulai,
      tanggalSelesai,
      jamMulai,
      jamSelesai,
      bukti,
      guruPenggantiList: guruPenggantiList || [],
      status: status || 'menunggu',
      keterangan,
      tahunAjaranId: finalTahunAjaranId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Use insertOne() directly from collection when _id: false
    // This avoids the Mongoose _id requirement
    await IzinGuru.collection.insertOne(izinData);
    
    // Fetch the created document
    const newIzin = await IzinGuru.findOne({ id });
    
    return res.status(201).json({
      success: true,
      message: 'Izin guru berhasil dibuat',
      izinGuru: newIzin.toObject(),
    });
  } catch (error) {
    console.error('Error creating izin guru:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat izin guru',
      error: error.message,
    });
  }
};

// Helper function: Get all gurus
const getAllGurus = async () => {
  const gurus = await Guru.find({
    isActive: { $ne: false }
  }).sort({ name: 1 });
  
  // Filter out any gurus without valid id
  return gurus
    .map(g => g && g.id)
    .filter(id => id); // Filter out undefined/null values
};

// Helper function: Get or create absensi guru document for a date/tahunAjaran/semester
const getOrCreateAbsensiGuruDoc = async (tanggal, tahunAjaranId, semester) => {
  const absensiGuruId = `${tanggal}-${tahunAjaranId}-${semester}`;
  
  let absensiGuruDoc = await AbsensiGuru.findOne({ id: absensiGuruId });
  
  if (!absensiGuruDoc) {
    absensiGuruDoc = new AbsensiGuru({
      id: absensiGuruId,
      tanggal,
      tahunAjaranId,
      semester,
      guru: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await absensiGuruDoc.save();
  }
  
  return absensiGuruDoc;
};

// Helper function: Update or create guru attendance
const updateOrCreateGuruAbsensi = async (absensiGuruDoc, guruId, attendanceData, allGuruIds) => {
  // Ensure guru array exists
  if (!absensiGuruDoc.guru) {
    absensiGuruDoc.guru = [];
  }
  
  // Filter out any invalid entries (with undefined/null guruId)
  absensiGuruDoc.guru = absensiGuruDoc.guru.filter(g => g && g.guruId);
  
  // Ensure all gurus are present in the guru array
  const existingGuruIds = absensiGuruDoc.guru
    .map(g => g && g.guruId)
    .filter(id => id); // Filter out undefined/null values
  
  for (const guruIdInList of allGuruIds) {
    if (guruIdInList && !existingGuruIds.includes(guruIdInList)) {
      // Add guru with default empty attendance
      absensiGuruDoc.guru.push({
        guruId: guruIdInList,
      });
    }
  }
  
  // Now update the specific guru's attendance
  const guruIndex = absensiGuruDoc.guru.findIndex(g => g && g.guruId === guruId);
  
  if (guruIndex === -1) {
    // This shouldn't happen if all gurus were added above, but handle it anyway
    absensiGuruDoc.guru.push({
      guruId,
      ...attendanceData
    });
  } else {
    // Update existing attendance, merge with existing data
    // Ensure guruId is preserved
    const existing = absensiGuruDoc.guru[guruIndex];
    absensiGuruDoc.guru[guruIndex] = {
      ...existing,
      ...attendanceData,
      guruId: existing.guruId || guruId // Ensure guruId is always present
    };
  }
  
  return absensiGuruDoc;
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

// Helper function to map status
const mapStatus = (status) => {
  if (status === 'izin') return 'izin';
  if (status === 'sakit') return 'sakit';
  if (status === 'cuti') return 'izin'; // Cuti mapped to izin for statusMasuk/statusKeluar
  return 'tepat_waktu';
};

export const updateIzinGuru = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const izinGuru = await IzinGuru.findOne({ id });
    if (!izinGuru) {
      return res.status(404).json({
        success: false,
        message: 'Izin guru tidak ditemukan',
      });
    }

    const oldStatus = izinGuru.status;
    const newStatus = updateData.status;

    delete updateData.id; // Prevent ID change
    updateData.updatedAt = new Date().toISOString();

    await IzinGuru.updateOne({ id }, updateData);
    const updatedIzin = await IzinGuru.findOne({ id });

    // If status changed to 'diterima', update attendance records
    if (newStatus === 'diterima' && oldStatus !== 'diterima') {
      try {
        // Get active tahun ajaran
        const activeTahunAjaran = await TahunAjaran.findOne({ isActive: true });
        if (!activeTahunAjaran) {
          console.warn('No active tahun ajaran found, skipping attendance update');
        } else {
          // Skip izin_dispen (handled separately if needed)
          if (updatedIzin.jenis !== 'izin_dispen') {
            const attendanceStatus = updatedIzin.jenis === 'sakit' ? 'sakit' : 
                                   updatedIzin.jenis === 'cuti' ? 'izin' : 'izin';
            const keteranganAbsensi = `${updatedIzin.jenis === 'sakit' ? 'Sakit' : 
                                      updatedIzin.jenis === 'cuti' ? 'Cuti' : 'Izin'} disetujui admin`;

            const dateRange = generateDateRange(updatedIzin.tanggalMulai, updatedIzin.tanggalSelesai);
            
            // Get all gurus for the helper function
            const allGuruIds = await getAllGurus();

            // Update absensi for each date in range
            for (const tanggal of dateRange) {
              // Get or create the daily absensi guru document (one document per date)
              const absensiGuruDoc = await getOrCreateAbsensiGuruDoc(
                tanggal,
                activeTahunAjaran.id,
                activeTahunAjaran.semester
              );

              // Find existing guru attendance data in the document
              const existingGuruData = absensiGuruDoc.guru?.find(g => g && g.guruId === updatedIzin.guruId);

              // Check if guru has already checked in (masuk)
              const hasMasukHadirTerlambat = existingGuruData && (
                existingGuruData.statusMasuk === 'tepat_waktu' ||
                existingGuruData.statusMasuk === 'terlambat' ||
                existingGuruData.jamMasuk
              );

              const now = new Date().toISOString();
              const mappedStatus = mapStatus(attendanceStatus);

              // Prepare attendance data based on whether guru has checked in
              let attendanceData = {
                keterangan: keteranganAbsensi,
                keteranganAbsensi: updatedIzin.jenis === 'sakit' ? 'Sakit' : 
                                  updatedIzin.jenis === 'cuti' ? 'Izin' : 'Izin',
              };

              if (!hasMasukHadirTerlambat) {
                // Guru hasn't checked in yet: set both masuk and keluar to izin/sakit/cuti
                attendanceData.jamMasuk = now;
                attendanceData.statusMasuk = mappedStatus;
                attendanceData.jamKeluar = now;
                attendanceData.statusKeluar = mappedStatus;
              } else {
                // Guru has already checked in: keep masuk, set keluar to izin/sakit/cuti
                // Preserve existing masuk data
                if (existingGuruData.jamMasuk) {
                  attendanceData.jamMasuk = existingGuruData.jamMasuk;
                }
                if (existingGuruData.statusMasuk) {
                  attendanceData.statusMasuk = existingGuruData.statusMasuk;
                }
                // Update keluar to izin/sakit/cuti (set jamKeluar to now when izin is approved)
                attendanceData.jamKeluar = now;
                attendanceData.statusKeluar = mappedStatus;
              }

              // Update or create guru attendance in the document
              await updateOrCreateGuruAbsensi(
                absensiGuruDoc,
                updatedIzin.guruId,
                attendanceData,
                allGuruIds
              );
              
              // Save the document
              await absensiGuruDoc.save();
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
      message: 'Izin guru berhasil diperbarui',
      izinGuru: updatedIzin.toObject(),
    });
  } catch (error) {
    console.error('Error updating izin guru:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui izin guru',
      error: error.message,
    });
  }
};

export const deleteIzinGuru = async (req, res) => {
  try {
    const { id } = req.params;
    const izinGuru = await IzinGuru.findOne({ id });
    if (!izinGuru) {
      return res.status(404).json({
        success: false,
        message: 'Izin guru tidak ditemukan',
      });
    }

    await IzinGuru.deleteOne({ id });
    return res.json({
      success: true,
      message: 'Izin guru berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting izin guru:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus izin guru',
      error: error.message,
    });
  }
};

