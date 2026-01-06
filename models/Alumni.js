import mongoose from 'mongoose';

// Schema for murid data (student data within a class)
const muridAlumniSchema = new mongoose.Schema({
  muridId: {
    type: String,
    required: true,
  },
  nama: {
    type: String,
    required: true,
  },
  nisn: {
    type: String,
    required: true,
  },
  nilaiAkhir: {
    type: Number,
    required: true,
  },
  tingkatKehadiran: {
    type: Number,
    required: true,
  },
  peringkatKelas: {
    type: Number,
    required: true,
  },
  peringkatSekolah: {
    type: Number,
    required: true,
  },
  tanggalLulus: {
    type: String,
    required: true,
  },
  waliKelasSebelumnya: String,
  namaWaliKelasSebelumnya: String,
  nipWaliKelasSebelumnya: String,
}, { _id: false });

// Schema for kelas data (class data)
const kelasAlumniSchema = new mongoose.Schema({
  kelasId: {
    type: String,
    required: true,
  },
  namaKelas: {
    type: String,
    required: true,
  },
  murid: [muridAlumniSchema],
}, { _id: false });

// Schema for jurusan data (major data for SMA/SMK)
const jurusanAlumniSchema = new mongoose.Schema({
  jurusanId: {
    type: String,
    required: true,
  },
  namaJurusan: {
    type: String,
    required: true,
  },
  kelas: [kelasAlumniSchema],
}, { _id: false });

// Main alumni schema - structure based on jenjang
const alumniSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  tahunLulus: {
    type: String,
    required: true,
  },
  jenjang: {
    type: String,
    required: true,
    enum: ['SD', 'SMP', 'SMA/SMK'],
  },
  // For SMA/SMK: array of jurusan, each containing array of kelas, each containing array of murid
  jurusan: [jurusanAlumniSchema],
  // For SD/SMP: array of kelas, each containing array of murid
  kelas: [kelasAlumniSchema],
  createdAt: {
    type: String,
    required: true,
  },
}, {
  timestamps: false,
});

// Indexes for faster queries
alumniSchema.index({ tahunLulus: 1 });
alumniSchema.index({ jenjang: 1 });
// Index for searching murid by muridId (nested field)
alumniSchema.index({ 'jurusan.kelas.murid.muridId': 1 });
alumniSchema.index({ 'kelas.murid.muridId': 1 });

const Alumni = mongoose.model('Alumni', alumniSchema);

export default Alumni;
