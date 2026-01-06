import mongoose from 'mongoose';

const pengaturanSKSSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  durasiPerSKS: {
    type: Number,
    required: true,
    default: 45, // dalam menit
  },
  istirahatAntarSKS: {
    type: Number,
    required: true,
    default: 0, // dalam menit
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
  },
  createdAt: {
    type: String,
    required: true,
  },
}, {
  timestamps: false,
});

const PengaturanSKS = mongoose.model('PengaturanSKS', pengaturanSKSSchema);

export default PengaturanSKS;


