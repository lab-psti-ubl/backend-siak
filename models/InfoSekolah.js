import mongoose from 'mongoose';

const infoSekolahSchema = new mongoose.Schema({
  judul: {
    type: String,
    required: true,
    trim: true
  },
  konten: {
    type: String,
    required: true,
    trim: true
  },
  jenis: {
    type: String,
    required: true,
    enum: ['umum', 'kelulusan', 'kenaikan_kelas', 'bagi_raport']
  },
  target: {
    type: String,
    required: true,
    enum: ['semua', 'guru', 'murid', 'kelas_12'] // 'kelas_12' berarti tingkat akhir sesuai jenjang (SD: 6, SMP: 9, SMA/SMK: 12)
  },
  kelasId: {
    type: String
  },
  gambar: {
    type: String // Base64 image atau URL gambar poster
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: String,
    default: () => new Date().toISOString()
  },
  publishedAt: {
    type: String,
    default: () => new Date().toISOString()
  },
  readBy: {
    type: [String],
    default: []
  },
  readNotifications: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

export default mongoose.model('InfoSekolah', infoSekolahSchema);

