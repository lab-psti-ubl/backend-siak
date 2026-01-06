import mongoose from 'mongoose';

// Schema untuk tugas individual
const nilaiTugasSchema = new mongoose.Schema({
  id: { type: String, required: true },
  nama: { type: String, required: true },
  nilai: { type: Number, required: true, min: 0, max: 100 },
  tanggal: { type: String, required: true },
  keterangan: { type: String },
}, { _id: false });

// Schema untuk komponen dinamis
const nilaiKomponenSchema = new mongoose.Schema({
  id: { type: String, required: true },
  komponenId: { type: String, required: true },
  komponenNama: { type: String, required: true },
  nilai: { type: Number, required: true, min: 0, max: 100 },
  tanggal: { type: String, required: true },
  keterangan: { type: String },
}, { _id: false });

// Schema untuk nilai per murid (embedded dalam array)
const nilaiMuridSchema = new mongoose.Schema({
  muridId: { type: String, required: true },
  tugas: { type: [nilaiTugasSchema], default: [] },
  uts: { type: Number, default: null },
  uas: { type: Number, default: null },
  nilaiAkhir: { type: Number, default: null },
  grade: { type: String, default: null },
  komponenDinamis: { type: [nilaiKomponenSchema], default: [] },
  updatedAt: { type: String },
}, { _id: false });

// Schema utama - satu dokumen per kombinasi mapel/kelas/semester/tahunAjaran
const nilaiSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  mataPelajaranId: {
    type: String,
    required: true,
  },
  kelasId: {
    type: String,
    required: true,
  },
  guruId: {
    type: String,
    required: true,
  },
  semester: {
    type: Number,
    required: true,
  },
  tahunAjaran: {
    type: String,
    required: true,
  },
  // Array nilai semua murid dalam kelas ini
  dataNilai: {
    type: [nilaiMuridSchema],
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
nilaiSchema.index({ mataPelajaranId: 1, kelasId: 1, semester: 1, tahunAjaran: 1 }, { unique: true });
nilaiSchema.index({ guruId: 1 });
nilaiSchema.index({ kelasId: 1 });
nilaiSchema.index({ 'dataNilai.muridId': 1 });

const Nilai = mongoose.model('Nilai', nilaiSchema);

export default Nilai;
