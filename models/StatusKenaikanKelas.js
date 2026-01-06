import mongoose from 'mongoose';

const statusKenaikanKelasSchema = new mongoose.Schema({
  kelasIds: {
    type: [String],
    required: true,
    default: []
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
  publishedKelasIds: {
    type: [String],
    default: []
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

// Compound index for unique constraint - one document per tahunAjaran + semester
statusKenaikanKelasSchema.index({ tahunAjaran: 1, semester: 1 }, { unique: true });

export default mongoose.model('StatusKenaikanKelas', statusKenaikanKelasSchema);
