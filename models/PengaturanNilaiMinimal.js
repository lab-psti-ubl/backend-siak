import mongoose from 'mongoose';

const pengaturanNilaiMinimalSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: 'pengaturan-nilai-minimal-1',
  },
  nilaiAkhirMinimal: {
    type: Number,
    required: true,
    default: 70,
    min: 0,
    max: 100,
  },
  tingkatKehadiranMinimal: {
    type: Number,
    required: true,
    default: 75,
    min: 0,
    max: 100,
  },
  createdAt: {
    type: String,
    required: true,
  },
  updatedAt: String,
}, {
  timestamps: false,
});

const PengaturanNilaiMinimal = mongoose.model('PengaturanNilaiMinimal', pengaturanNilaiMinimalSchema);

export default PengaturanNilaiMinimal;


