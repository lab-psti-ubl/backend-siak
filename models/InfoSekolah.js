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
    enum: ['semua', 'guru', 'murid', 'kelas_12']
  },
  kelasId: {
    type: String
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

