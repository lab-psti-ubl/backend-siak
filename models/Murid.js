import mongoose from 'mongoose';

const muridSchema = new mongoose.Schema({
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
  password: String,
  avatar: String,
  profileImage: String,
  // Murid specific fields
  nisn: {
    type: String,
    unique: true,
    sparse: true, // Allow null/undefined but enforce uniqueness when present
  },
  kelasId: String,
  qrCode: String,
  whatsappOrtu: String,
  isActive: Boolean,
  rfidGuid: {
    type: String,
    unique: true,
    sparse: true, // Allow null/undefined but enforce uniqueness when present
  },
  createdAt: {
    type: String,
    required: true,
  },
}, {
  timestamps: false, // We use createdAt string instead
});

// Index for faster queries
// Note: nisn and rfidGuid already have indexes from unique: true and sparse: true
muridSchema.index({ kelasId: 1 });
muridSchema.index({ isActive: 1 });

const Murid = mongoose.model('Murid', muridSchema);

export default Murid;

