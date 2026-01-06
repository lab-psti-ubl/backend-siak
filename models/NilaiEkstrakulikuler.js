import mongoose from 'mongoose';

// Schema for nilai ekstrakulikuler per murid (nested structure)
const nilaiEkstraItemSchema = new mongoose.Schema({
  ekstrakulikulerId: {
    type: String,
    required: true,
  },
  nilai: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  predikat: {
    type: String,
    required: true,
  },
  keterangan: {
    type: String,
    required: true,
  },
}, { _id: false });

// Schema for murid data (nested structure)
const muridDataSchema = new mongoose.Schema({
  muridId: {
    type: String,
    required: true,
  },
  nilaiEkstrakulikuler: {
    type: [nilaiEkstraItemSchema],
    default: [],
  },
}, { _id: false });

const nilaiEkstrakulikulerSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  // Old structure (flat) - for backward compatibility
  muridId: {
    type: String,
    required: false, // Optional for new structure
  },
  ekstrakulikulerId: {
    type: String,
    required: false, // Optional for new structure
  },
  nilai: {
    type: Number,
    required: false, // Optional for new structure
    min: 0,
    max: 100,
  },
  predikat: {
    type: String,
    required: false, // Optional for new structure
  },
  keterangan: {
    type: String,
    required: false, // Optional for new structure
  },
  // New structure (nested) - per kelas
  kelasId: {
    type: String,
    required: false, // Optional for old structure
  },
  waliKelasId: {
    type: String,
    required: false, // Optional for old structure
  },
  muridData: {
    type: [muridDataSchema],
    default: [],
  },
  semester: {
    type: Number,
    required: true,
  },
  tahunAjaran: {
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
}, {
  timestamps: false,
});

// Index for faster queries - old structure
nilaiEkstrakulikulerSchema.index({ muridId: 1, semester: 1, tahunAjaran: 1 });
nilaiEkstrakulikulerSchema.index({ ekstrakulikulerId: 1 });
nilaiEkstrakulikulerSchema.index({ muridId: 1, ekstrakulikulerId: 1, semester: 1, tahunAjaran: 1 }, { unique: true, sparse: true });

// Index for new structure
nilaiEkstrakulikulerSchema.index({ kelasId: 1, tahunAjaran: 1, semester: 1 }, { unique: true, sparse: true });
nilaiEkstrakulikulerSchema.index({ waliKelasId: 1 });

const NilaiEkstrakulikuler = mongoose.model('NilaiEkstrakulikuler', nilaiEkstrakulikulerSchema);

export default NilaiEkstrakulikuler;

