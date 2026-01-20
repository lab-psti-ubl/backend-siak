import mongoose from 'mongoose';

const sesiAbsensiTahfizSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  jadwalId: { type: String, required: true },
  tanggal: { type: String, required: true }, // 'YYYY-MM-DD'
  jamBuka: { type: String, required: true },
  jamTutup: { type: String },
  status: { type: String, enum: ['dibuka', 'ditutup'], required: true, default: 'dibuka' },
  createdBy: { type: String, required: true },
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
  tahun: { type: String, required: true }, // Only year, no semester
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { 
  timestamps: false // We use createdAt/updatedAt strings instead
});

sesiAbsensiTahfizSchema.pre('save', function(next) {
  this.updatedAt = new Date().toISOString();
  next();
});

// Index for faster queries
sesiAbsensiTahfizSchema.index({ jadwalId: 1, tanggal: 1 });
sesiAbsensiTahfizSchema.index({ tanggal: 1 });
sesiAbsensiTahfizSchema.index({ tahun: 1 });

const SesiAbsensiTahfiz = mongoose.model('SesiAbsensiTahfiz', sesiAbsensiTahfizSchema);

export default SesiAbsensiTahfiz;

