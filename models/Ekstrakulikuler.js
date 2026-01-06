import mongoose from 'mongoose';

const ekstrakulikulerSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  nama: {
    type: String,
    required: true,
  },
  deskripsi: {
    type: String,
  },
  pembinaId: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
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
ekstrakulikulerSchema.index({ pembinaId: 1 });
ekstrakulikulerSchema.index({ isActive: 1 });

const Ekstrakulikuler = mongoose.model('Ekstrakulikuler', ekstrakulikulerSchema);

export default Ekstrakulikuler;

