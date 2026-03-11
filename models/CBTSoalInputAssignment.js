import mongoose from 'mongoose';

const cbtSoalInputAssignmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },

    guruId: { type: String, required: true },

    // Komponen nilai (khusus UTS/UAS)
    kategoriId: { type: String, required: true },
    kategoriNama: { type: String, required: true },

    mataPelajaranId: { type: String, required: true },
    tingkat: { type: Number, required: true },
    // Khusus SMA/SMK: penunjukan berlaku per jurusan
    // Untuk SD/SMP: diset string kosong supaya index tetap konsisten
    jurusanId: { type: String, default: '' },

    // Berlaku per semester (tahun ajaran aktif)
    tahunAjaran: { type: String, required: true },
    semester: { type: Number, required: true, enum: [1, 2] },

    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: false }
);

// Satu kombinasi (semester + kategori + mapel + tingkat) hanya boleh punya satu guru penginput
cbtSoalInputAssignmentSchema.index(
  {
    tahunAjaran: 1,
    semester: 1,
    kategoriId: 1,
    mataPelajaranId: 1,
    tingkat: 1,
    jurusanId: 1,
  },
  { unique: true }
);

cbtSoalInputAssignmentSchema.index({ guruId: 1, tahunAjaran: 1, semester: 1 });

const CBTSoalInputAssignment = mongoose.model(
  'CBTSoalInputAssignment',
  cbtSoalInputAssignmentSchema
);

export default CBTSoalInputAssignment;

