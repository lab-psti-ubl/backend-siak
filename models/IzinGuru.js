import mongoose from 'mongoose';

const izinGuruSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  guruId: { type: String, required: true },
  jenis: { type: String, enum: ['izin', 'sakit', 'cuti', 'izin_dispen'], required: true },
  alasan: { type: String, required: true },
  tanggalMulai: { type: String, required: true },
  tanggalSelesai: { type: String, required: true },
  jamMulai: { type: String },
  jamSelesai: { type: String },
  bukti: { type: String },
  guruPenggantiList: [{
    jadwalId: { type: String },
    guruPenggantiId: { type: String },
  }],
  status: { type: String, enum: ['menunggu', 'diterima', 'ditolak'], required: true, default: 'menunggu' },
  keterangan: { type: String },
  verifiedBy: { type: String },
  verifiedAt: { type: String },
  tahunAjaranId: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { _id: false });

izinGuruSchema.pre('save', function(next) {
  this.updatedAt = new Date().toISOString();
  next();
});

const IzinGuru = mongoose.model('IzinGuru', izinGuruSchema);

export default IzinGuru;

