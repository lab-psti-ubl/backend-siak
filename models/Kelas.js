import mongoose from 'mongoose';

const kelasSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  tingkat: {
    type: Number,
    required: true,
  },
  jurusanId: String, // Optional, only for SMA/SMK
  waliKelasId: String, // Optional, ID of guru who is wali kelas
  createdAt: {
    type: String,
    required: true,
  },
}, {
  timestamps: false,
});

// Index for faster queries
kelasSchema.index({ tingkat: 1 });
kelasSchema.index({ jurusanId: 1 });
kelasSchema.index({ waliKelasId: 1 });

const Kelas = mongoose.model('Kelas', kelasSchema);

export default Kelas;

