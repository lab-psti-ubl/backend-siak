import mongoose from 'mongoose';

const progressHafalanSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  santriId: {
    type: String,
    required: true,
  },
  juz: {
    type: Number,
    required: true,
    min: 1,
    max: 30,
  },
  surat: {
    type: String,
    required: true,
  },
  ayatDari: {
    type: Number,
    required: true,
  },
  ayatSampai: {
    type: Number,
    required: true,
  },
  tanggal: {
    type: String,
    required: true, // 'YYYY-MM-DD'
  },
  keterangan: {
    type: String,
  },
  // Hasil tes hafalan
  hasilTes: {
    type: String,
    enum: ['Mumtaz', 'Jayid Jiddan', 'Jayid', 'Maqbul'],
  },
  tanggalTes: {
    type: String, // 'YYYY-MM-DD'
  },
  tesOleh: {
    type: String, // ustadzId yang melakukan tes
  },
  lafadzKesalahan: {
    type: [String], // Array of lafadz keys yang salah (format: "ayatNomor-lafadzIndex")
    default: [],
  },
  catatanPerbaikan: {
    type: String, // Catatan perbaikan untuk Jayid/Maqbul
  },
  poinPerbaikan: {
    type: {
      kelancaranHafalan: String,
      ketepatanAyat: String,
      tajwid: String,
      fashahah: String,
    },
  },
  statusPerbaikan: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
  riwayatTes: {
    type: [{
      hasilTes: String,
      tanggalTes: String,
      tesOleh: String,
      lafadzKesalahan: [String],
      catatanPerbaikan: String,
      createdAt: String,
    }],
    default: [],
  },
  createdBy: {
    type: String,
    required: true, // ustadzId
  },
  tahun: {
    type: String,
    required: true, // 'YYYY'
  },
  createdAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
  updatedAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
}, {
  timestamps: false,
});

progressHafalanSchema.pre('save', function(next) {
  this.updatedAt = new Date().toISOString();
  next();
});

// Index for faster queries
progressHafalanSchema.index({ santriId: 1, tahun: 1 });
progressHafalanSchema.index({ createdBy: 1 });

const ProgressHafalan = mongoose.model('ProgressHafalan', progressHafalanSchema);

export default ProgressHafalan;
