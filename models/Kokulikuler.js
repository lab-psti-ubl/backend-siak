import mongoose from 'mongoose';

const kokulikulerSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  kelasId: {
    type: String,
    required: true,
  },
  waliKelasId: {
    type: String,
    required: true,
  },
  tahunAjaran: {
    type: String,
    required: true,
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 2,
  },
  muridData: [{
    muridId: {
      type: String,
      required: true,
    },
    kokulikuler: {
      type: String,
      default: '',
    },
  }],
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
kokulikulerSchema.index({ kelasId: 1, tahunAjaran: 1, semester: 1 }, { unique: true });
kokulikulerSchema.index({ waliKelasId: 1 });
kokulikulerSchema.index({ tahunAjaran: 1, semester: 1 });

const Kokulikuler = mongoose.model('Kokulikuler', kokulikulerSchema);

export default Kokulikuler;


