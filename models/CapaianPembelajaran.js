import mongoose from 'mongoose';

const capaianPembelajaranSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  guruId: {
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
    enum: [1, 2],
  },
  tingkatData: [{
    tingkat: {
      type: Number,
      required: true,
    },
    mataPelajaranData: [{
      mataPelajaranId: {
        type: String,
        required: true,
      },
      capaianPembelajaran: {
        type: String,
        required: true,
      },
    }],
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
capaianPembelajaranSchema.index({ guruId: 1, tahunAjaran: 1, semester: 1 }, { unique: true });
capaianPembelajaranSchema.index({ guruId: 1 });
capaianPembelajaranSchema.index({ tahunAjaran: 1, semester: 1 });

const CapaianPembelajaran = mongoose.model('CapaianPembelajaran', capaianPembelajaranSchema);

export default CapaianPembelajaran;

