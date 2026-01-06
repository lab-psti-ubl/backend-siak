import mongoose from 'mongoose';

const guruSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: String,
  password: String,
  avatar: String,
  profileImage: String,
  // Guru specific fields
  nip: {
    type: String,
    unique: true,
    sparse: true, // Allow null/undefined but enforce uniqueness when present
  },
  subject: String,
  isWaliKelas: Boolean,
  kelasWali: String,
  isActive: Boolean,
  rfidGuid: {
    type: String,
    unique: true,
    sparse: true, // Allow null/undefined but enforce uniqueness when present
  },
  riwayatKelasWali: [{
    kelasId: String,
    tahunAjaran: String,
    semester: Number,
  }],
  createdAt: {
    type: String,
    required: true,
  },
}, {
  timestamps: false, // We use createdAt string instead
});

// Index for faster queries
// Note: nip and rfidGuid already have indexes from unique: true and sparse: true
guruSchema.index({ kelasWali: 1 });
guruSchema.index({ isActive: 1 });

const Guru = mongoose.model('Guru', guruSchema);

export default Guru;

