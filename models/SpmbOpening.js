import mongoose from 'mongoose';

const spmbOpeningSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  tahunAjaran: {
    type: String,
    required: true,
  },
  judul: {
    type: String,
    required: true,
  },
  tanggalMulai: {
    type: String,
    required: true,
  },
  tanggalSelesai: {
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

// Indexes for faster queries
spmbOpeningSchema.index({ tahunAjaran: 1 });
spmbOpeningSchema.index({ tanggalMulai: 1, tanggalSelesai: 1 });

const SpmbOpening = mongoose.model('SpmbOpening', spmbOpeningSchema);

export default SpmbOpening;

