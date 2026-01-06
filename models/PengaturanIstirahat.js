import mongoose from 'mongoose';

const pengaturanIstirahatSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  jamMulai: {
    type: String,
    required: true,
    default: '12:00',
  },
  jamSelesai: {
    type: String,
    required: true,
    default: '13:00',
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

const PengaturanIstirahat = mongoose.model('PengaturanIstirahat', pengaturanIstirahatSchema);

export default PengaturanIstirahat;


