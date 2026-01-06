import mongoose from 'mongoose';

// Schema for nilai mata pelajaran
const nilaiMataPelajaranSchema = new mongoose.Schema({
  mataPelajaranId: {
    type: String,
    required: true,
  },
  mataPelajaran: {
    type: String,
    required: true,
  },
  nilaiAkhir: {
    type: Number,
    required: true,
  },
  capaianPembelajaran: {
    type: String,
    default: '',
  },
}, { _id: false });

// Schema for nilai ekstrakulikuler
const nilaiEkstrakulikulerSchema = new mongoose.Schema({
  ekstrakulikulerId: {
    type: String,
    required: true,
  },
  namaEkstrakulikuler: {
    type: String,
    required: true,
  },
  predikat: {
    type: String,
    required: true,
  },
  keterangan: {
    type: String,
    default: '',
  },
}, { _id: false });

// Schema for kehadiran
const kehadiranSchema = new mongoose.Schema({
  sakit: {
    type: Number,
    default: 0,
  },
  izin: {
    type: Number,
    default: 0,
  },
  alfa: {
    type: Number,
    default: 0,
  },
}, { _id: false });

// Schema for data murid dalam E-Raport
const muridDataSchema = new mongoose.Schema({
  muridId: {
    type: String,
    required: true,
  },
  namaMurid: {
    type: String,
    required: true,
  },
  nisn: {
    type: String,
    required: true,
  },
  kelas: {
    type: String,
    required: true,
  },
  fase: {
    type: String,
    default: '',
  },
  semester: {
    type: Number,
    required: true,
  },
  tahunAjaran: {
    type: String,
    required: true,
  },
  namaOrangTua: {
    type: String,
    default: '',
  },
  nilaiMataPelajaran: {
    type: [nilaiMataPelajaranSchema],
    default: [],
  },
  kokulikuler: {
    type: String,
    default: '',
  },
  nilaiEkstrakulikuler: {
    type: [nilaiEkstrakulikulerSchema],
    default: [],
  },
  kehadiran: {
    type: kehadiranSchema,
    default: { sakit: 0, izin: 0, alfa: 0 },
  },
  catatanWaliKelas: {
    type: String,
    default: '',
  },
  keteranganKenaikanKelas: {
    type: String,
    default: '',
  },
}, { _id: false });

// Schema for data sekolah
const sekolahDataSchema = new mongoose.Schema({
  namaSekolah: {
    type: String,
    required: true,
  },
  alamatSekolah: {
    type: String,
    default: '',
  },
}, { _id: false });

// Schema for data kepala sekolah
const kepalaSekolahDataSchema = new mongoose.Schema({
  namaKepalaSekolah: {
    type: String,
    required: true,
  },
  nip: {
    type: String,
    default: '',
  },
}, { _id: false });

// Schema for data wali kelas
const waliKelasDataSchema = new mongoose.Schema({
  namaGuru: {
    type: String,
    required: true,
  },
  nip: {
    type: String,
    default: '',
  },
}, { _id: false });

const eraportSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  kelasId: {
    type: String,
    required: true,
  },
  waliKelasId: {
    type: String,
    required: true,
  },
  tahunAjaran: {
    type: String,
    required: true,
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 2,
  },
  kelas: {
    nama: {
      type: String,
      required: true,
    },
    tingkat: {
      type: Number,
      required: true,
    },
  },
  waliKelas: {
    type: waliKelasDataSchema,
    required: true,
  },
  sekolah: {
    type: sekolahDataSchema,
    required: true,
  },
  kepalaSekolah: {
    type: kepalaSekolahDataSchema,
    required: true,
  },
  muridData: {
    type: [muridDataSchema],
    default: [],
  },
  createdAt: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: String,
    required: true,
  },
}, {
  timestamps: false,
});

// Index for faster queries
eraportSchema.index({ kelasId: 1, tahunAjaran: 1, semester: 1 }, { unique: true });
eraportSchema.index({ waliKelasId: 1 });
eraportSchema.index({ tahunAjaran: 1, semester: 1 });
eraportSchema.index({ 'muridData.muridId': 1 });

const ERaport = mongoose.model('ERaport', eraportSchema);

export default ERaport;

