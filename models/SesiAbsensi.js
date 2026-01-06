import mongoose from 'mongoose';

const sesiAbsensiSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  jadwalId: { type: String, required: true },
  tanggal: { type: String, required: true }, // 'YYYY-MM-DD'
  jamBuka: { type: String, required: true },
  jamTutup: { type: String },
  status: { type: String, enum: ['dibuka', 'ditutup'], required: true, default: 'dibuka' },
  createdBy: { type: String, required: true },
  jurnal: {
    judul: { type: String },
    deskripsi: { type: String },
    waktuInput: { type: String },
    file: {
      name: { type: String },
      type: { type: String },
      data: { type: String },
      size: { type: Number },
    },
  },
  dataAbsensi: [{
    id: { type: String, required: true },
    muridId: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['hadir', 'izin', 'sakit', 'alfa', 'terlambat', 'pulang_cepat'], 
      required: true 
    },
    waktu: { type: String, required: true }, // ISO timestamp
    keterangan: { type: String },
    method: { type: String, enum: ['qr', 'manual', 'admin-qr'], required: true },
    statusAbsen: { type: String, enum: ['hadir', 'terlambat', 'pulang_cepat', 'tepat_waktu'] },
    keteranganAbsensi: { type: String, enum: ['Hadir', 'Izin', 'Sakit', 'Bolos', 'Dispen', 'Alfa'] },
  }],
  tahunAjaranId: { type: String, required: true },
  semester: { type: Number, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { 
  timestamps: false // We use createdAt/updatedAt strings instead
});

sesiAbsensiSchema.pre('save', function(next) {
  this.updatedAt = new Date().toISOString();
  next();
});

// Index for faster queries
sesiAbsensiSchema.index({ jadwalId: 1, tanggal: 1 });
sesiAbsensiSchema.index({ tanggal: 1 });

const SesiAbsensi = mongoose.model('SesiAbsensi', sesiAbsensiSchema);

export default SesiAbsensi;

