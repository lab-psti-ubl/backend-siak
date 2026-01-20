import mongoose from 'mongoose';

const mataPelajaranSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  sks: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
  },
  keterangan: {
    type: String,
    required: true,
    enum: ['umum', 'jurusan', 'agama'],
  },
  jurusanId: {
    type: String,
    required: function() {
      return this.keterangan === 'jurusan';
    },
  },
  semester: {
    type: String,
    required: true,
    enum: ['ganjil', 'genap', 'keduanya'],
  },
  tingkatKelas: {
    type: [Number],
    required: true,
  },
}, {
  timestamps: false,
});

// Index for faster queries
// Note: code index is automatically created by unique: true, so we don't need to add it manually
mataPelajaranSchema.index({ keterangan: 1 });
mataPelajaranSchema.index({ jurusanId: 1 });

const MataPelajaran = mongoose.model('MataPelajaran', mataPelajaranSchema);

export default MataPelajaran;

