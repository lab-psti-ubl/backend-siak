import mongoose from 'mongoose';

const jadwalTahfizSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    kelasId: {
      type: String,
      required: true,
    },
    hari: {
      type: String,
      required: true,
      enum: ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'],
    },
    jamMulai: {
      type: String,
      required: true,
    },
    jamSelesai: {
      type: String,
      required: true,
    },
    createdAt: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

// Indeks untuk pencarian cepat per kelas dan hari
jadwalTahfizSchema.index({ kelasId: 1, hari: 1 });

const JadwalTahfiz = mongoose.model('JadwalTahfiz', jadwalTahfizSchema);

export default JadwalTahfiz;

