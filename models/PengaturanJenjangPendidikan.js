import mongoose from 'mongoose';

const pengaturanJenjangPendidikanSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  jenjang: {
    type: String,
    enum: ['SD', 'SMP', 'SMA/SMK'],
    required: true,
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true, // Always true since only one record exists
  },
  // Tingkat awal dan akhir berdasarkan jenjang
  // SD: awal=1, akhir=6
  // SMP: awal=7, akhir=9
  // SMA/SMK: awal=10, akhir=12
  tingkatAwal: {
    type: Number,
    required: false, // Akan dihitung otomatis berdasarkan jenjang
  },
  tingkatAkhir: {
    type: Number,
    required: false, // Akan dihitung otomatis berdasarkan jenjang
  },
  createdAt: {
    type: String,
    required: true,
  },
}, {
  timestamps: false,
});

const PengaturanJenjangPendidikan = mongoose.model('PengaturanJenjangPendidikan', pengaturanJenjangPendidikanSchema);

export default PengaturanJenjangPendidikan;

