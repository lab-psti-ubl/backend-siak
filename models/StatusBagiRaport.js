import mongoose from 'mongoose';

const statusBagiRaportSchema = new mongoose.Schema({
  kelasId: {
    type: String,
    required: true
  },
  tahunAjaran: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedBy: {
    type: String
  },
  publishedAt: {
    type: String
  },
  createdAt: {
    type: String,
    default: () => new Date().toISOString()
  }
});

// Compound index for unique constraint
statusBagiRaportSchema.index({ kelasId: 1, tahunAjaran: 1, semester: 1 }, { unique: true });

export default mongoose.model('StatusBagiRaport', statusBagiRaportSchema);
