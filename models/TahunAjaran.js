import mongoose from 'mongoose';

const tahunAjaranSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  tahun: {
    type: String,
    required: true,
  },
  semester: {
    type: Number,
    required: true,
    enum: [1, 2],
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  tanggalMulai: {
    type: String,
    required: false, // Boleh kosong jika isAutoCreated = true
    default: '',
  },
  tanggalSelesai: {
    type: String,
    required: false, // Boleh kosong jika isAutoCreated = true
    default: '',
  },
  isAutoCreated: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: false,
});

// Index for faster queries
tahunAjaranSchema.index({ isActive: 1 });
tahunAjaranSchema.index({ tahun: 1, semester: 1 });

const TahunAjaran = mongoose.model('TahunAjaran', tahunAjaranSchema);

export default TahunAjaran;

