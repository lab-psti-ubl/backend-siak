import mongoose from 'mongoose';

const komponenNilaiSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  nama: {
    type: String,
    required: true,
  },
  persentase: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  hasNilai: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: String,
    required: true,
  },
}, {
  timestamps: false,
});

const PengaturanKomponenNilai = mongoose.model('PengaturanKomponenNilai', komponenNilaiSchema);

export default PengaturanKomponenNilai;


