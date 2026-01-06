import mongoose from 'mongoose';

const guruMapelSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  guruId: {
    type: String,
    required: true,
  },
  mataPelajaranId: {
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
}, {
  timestamps: false,
});

// Index for faster queries
guruMapelSchema.index({ guruId: 1, mataPelajaranId: 1 });
guruMapelSchema.index({ guruId: 1, isActive: 1 });
guruMapelSchema.index({ mataPelajaranId: 1, isActive: 1 });

const GuruMapel = mongoose.model('GuruMapel', guruMapelSchema);

export default GuruMapel;

