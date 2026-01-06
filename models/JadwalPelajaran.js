import mongoose from 'mongoose';

const jadwalPelajaranSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  kelasId: {
    type: String,
    required: true,
  },
  mataPelajaranId: {
    type: String,
    required: true,
  },
  guruId: {
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
  semester: {
    type: Number,
    required: true,
    enum: [1, 2],
  },
  tahunAjaran: {
    type: String,
    required: true,
  },
}, {
  timestamps: false,
});

// Index for faster queries
jadwalPelajaranSchema.index({ kelasId: 1, tahunAjaran: 1, semester: 1 });
jadwalPelajaranSchema.index({ guruId: 1, hari: 1, tahunAjaran: 1, semester: 1 });
jadwalPelajaranSchema.index({ mataPelajaranId: 1 });

const JadwalPelajaran = mongoose.model('JadwalPelajaran', jadwalPelajaranSchema);

export default JadwalPelajaran;

