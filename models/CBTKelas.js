import mongoose from 'mongoose';

const cbtKelasSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    guruId: {
      type: String,
      required: true,
    },
    // Tingkat kelas (misal: 7, 8, 9, 10, 11, 12)
    tingkat: {
      type: Number,
      required: true,
    },
    mataPelajaranId: {
      type: String,
      required: true,
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
  },
  {
    timestamps: false,
  }
);

// Satu kombinasi guru + tingkat + mapel + semester + tahunAjaran hanya boleh satu kelas CBT
cbtKelasSchema.index(
  {
    guruId: 1,
    tingkat: 1,
    mataPelajaranId: 1,
    semester: 1,
    tahunAjaran: 1,
  },
  {
    unique: true,
  }
);

const CBTKelas = mongoose.model('CBTKelas', cbtKelasSchema);

export default CBTKelas;

