import mongoose from 'mongoose';

const fotoMengajarSchema = new mongoose.Schema({
  id: { type: String, required: true },
  jadwalId: { type: String, required: true },
  mataPelajaranId: { type: String, required: true },
  kelasId: { type: String, required: true },
  fotoBase64: { type: String, required: true },
  waktuFoto: { type: String, required: true },
  keterangan: { type: String },
}, { _id: false });

// Schema for guru attendance data
const guruAbsensiSchema = new mongoose.Schema({
  guruId: { type: String, required: true },
  jamMasuk: { type: String },
  jamKeluar: { type: String },
  statusMasuk: { 
    type: String, 
    enum: ['tepat_waktu', 'terlambat', 'tidak_masuk', 'izin', 'sakit', 'alfa']
  },
  statusKeluar: { 
    type: String, 
    enum: ['tepat_waktu', 'pulang_awal', 'tidak_keluar', 'izin', 'sakit', 'alfa'] 
  },
  keterangan: { type: String },
  keteranganAbsensi: { type: String, enum: ['Hadir', 'Izin', 'Sakit', 'Bolos', 'Dispen', 'Alfa'] },
  fotoMengajar: [fotoMengajarSchema],
}, { _id: false });

// Main absensi guru schema - structured by date, academic year, semester, with array of gurus
const absensiGuruSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Format: tanggal-tahunAjaranId-semester
  tanggal: { type: String, required: true }, // 'YYYY-MM-DD'
  tahunAjaranId: { type: String, required: true },
  semester: { type: Number, required: true },
  guru: [guruAbsensiSchema],
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { 
  timestamps: false,
});

// Indexes for faster queries
absensiGuruSchema.index({ tanggal: 1 });
absensiGuruSchema.index({ tahunAjaranId: 1, semester: 1 });
absensiGuruSchema.index({ tanggal: 1, tahunAjaranId: 1, semester: 1 });

absensiGuruSchema.pre('save', function(next) {
  this.updatedAt = new Date().toISOString();
  next();
});

const AbsensiGuru = mongoose.model('AbsensiGuru', absensiGuruSchema);

export default AbsensiGuru;

