import mongoose from 'mongoose';

// Schema for murid attendance data within a class
const muridAbsensiSchema = new mongoose.Schema({
  muridId: { type: String, required: true },
  // Masuk and pulang in one structure
  jamMasuk: { type: String }, // ISO timestamp or time string
  jamKeluar: { type: String }, // ISO timestamp or time string
  statusMasuk: { 
    type: String, 
    enum: ['tepat_waktu', 'terlambat', 'tidak_masuk', 'izin', 'sakit', 'alfa', 'hadir']
  },
  statusKeluar: { 
    type: String, 
    enum: ['tepat_waktu', 'pulang_awal', 'tidak_keluar', 'izin', 'sakit', 'alfa', 'pulang_cepat'] 
  },
  // Legacy fields for backward compatibility (optional)
  tipeAbsen: { type: String, enum: ['masuk', 'pulang'] }, // Deprecated
  status: { 
    type: String, 
    enum: ['hadir', 'izin', 'sakit', 'alfa', 'terlambat', 'pulang_cepat'] 
  },
  waktu: { type: String }, // ISO timestamp - deprecated, use jamMasuk/jamKeluar
  keterangan: { type: String },
  method: { type: String, enum: ['qr', 'manual', 'admin-qr'] },
  statusAbsen: { type: String, enum: ['hadir', 'terlambat', 'pulang_cepat', 'tepat_waktu'] },
  keteranganAbsensi: { type: String, enum: ['Hadir', 'Izin', 'Sakit', 'Bolos', 'Dispen', 'Alfa'] },
  sesiId: { type: String }, // Deprecated, kept for backward compatibility
  // Informasi sumber data (untuk kebutuhan audit/fallback)
  sumberData: { type: String, enum: ['worker', 'server'] },
  sumberDataUpdatedAt: { type: String },
}, { _id: false });

// Schema for session metadata
const sessionMetadataSchema = new mongoose.Schema({
  jamBuka: { type: String },
  jamTutup: { type: String },
  status: { type: String, enum: ['dibuka', 'ditutup'] },
  createdBy: { type: String },
}, { _id: false });

// Schema for kelas data within absensi
const kelasAbsensiSchema = new mongoose.Schema({
  kelasId: { type: String, required: true },
  murid: [muridAbsensiSchema],
  // Session metadata for absen kelas (masuk and pulang)
  sessionMasuk: { type: sessionMetadataSchema },
  sessionPulang: { type: sessionMetadataSchema },
}, { _id: false });

// Main absensi schema - structured by date, academic year, semester, with array of classes
const absensiSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Format: tanggal-tahunAjaranId-semester
  tanggal: { type: String, required: true }, // 'YYYY-MM-DD'
  tahunAjaranId: { type: String, required: true },
  semester: { type: Number, required: true },
  kelas: [kelasAbsensiSchema],
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { 
  timestamps: false,
});

// Indexes for faster queries
absensiSchema.index({ tanggal: 1 });
absensiSchema.index({ tahunAjaranId: 1, semester: 1 });
absensiSchema.index({ tanggal: 1, tahunAjaranId: 1, semester: 1 });

absensiSchema.pre('save', function(next) {
  this.updatedAt = new Date().toISOString();
  next();
});

const Absensi = mongoose.model('Absensi', absensiSchema);

export default Absensi;

