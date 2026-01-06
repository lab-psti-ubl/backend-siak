import mongoose from 'mongoose';

const pengumumanKelulusanSchema = new mongoose.Schema({
  tahunAjaran: {
    type: String,
    required: true
  },
  tanggalPengumuman: {
    type: String,
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  snapshotMuridIds: {
    type: [String],
    default: []
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
    type: String
  }
});

// Compound index to ensure only one published announcement per academic year
pengumumanKelulusanSchema.index({ tahunAjaran: 1, isPublished: 1 });

export default mongoose.model('PengumumanKelulusan', pengumumanKelulusanSchema);

