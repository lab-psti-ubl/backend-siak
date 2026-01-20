import mongoose from 'mongoose';

const pengaturanAbsenSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  jamMasuk: {
    type: String,
    required: true,
  },
  toleransiMasuk: {
    type: Number,
    required: true,
    default: 15, // dalam menit
  },
  jamPulang: {
    type: String,
    required: true,
  },
  toleransiPulang: {
    type: Number,
    required: true,
    default: 15, // dalam menit
  },
  hariSekolah: {
    type: [Number],
    required: true, // Required - must be set by user
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0 && v.every(day => [0, 1, 2, 3, 4, 5, 6].includes(day));
      },
      message: 'Hari sekolah harus array dengan minimal 1 hari (0-6)'
    }
  },
  hariKerja: {
    type: [Number],
    required: true, // Required - must be set by user
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0 && v.every(day => [0, 1, 2, 3, 4, 5, 6].includes(day));
      },
      message: 'Hari kerja harus array dengan minimal 1 hari (0-6)'
    }
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
  },
  enableManualAbsen: {
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

const PengaturanAbsen = mongoose.model('PengaturanAbsen', pengaturanAbsenSchema);

export default PengaturanAbsen;


