import mongoose from 'mongoose';

const hasGivenKenaikanKelasInfoSchema = new mongoose.Schema({
  tahunAjaran: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  hasGiven: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: String,
    default: () => new Date().toISOString()
  },
  updatedAt: {
    type: String,
    default: () => new Date().toISOString()
  }
});

// Compound index for unique constraint
hasGivenKenaikanKelasInfoSchema.index({ tahunAjaran: 1, semester: 1 }, { unique: true });

export default mongoose.model('HasGivenKenaikanKelasInfo', hasGivenKenaikanKelasInfoSchema);

