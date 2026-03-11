import mongoose from 'mongoose';

const cbtOptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const matchingPairSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    left: { type: String, required: true },
    right: { type: String, required: true },
  },
  { _id: false }
);

// Satu item soal di dalam array bank (tanpa duplikasi cbtKelasId, bankId, dll.)
const soalItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    tipe: {
      type: String,
      enum: [
        'pilihan_ganda',
        'pilihan_ganda_kompleks',
        'benar_salah',
        'menjodohkan',
        'essay',
      ],
      required: true,
    },
    pertanyaan: { type: String, required: true },
    poin: { type: Number, default: 1, min: 0 },
    opsi: { type: [cbtOptionSchema], default: [] },
    jawabanBenar: { type: mongoose.Schema.Types.Mixed, default: null },
    pasanganMenjodohkan: { type: [matchingPairSchema], default: [] },
    menjodohkanScoring: {
      type: String,
      enum: ['semua_benar', 'minimal_benar'],
      default: 'semua_benar',
    },
    menjodohkanMinimalBenar: { type: Number, default: 1, min: 1 },
    gambar: { type: String, default: null },
  },
  { _id: false }
);

const cbtBankSoalSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    cbtKelasId: {
      type: String,
      required: true,
    },
    guruId: {
      type: String,
      required: true,
    },
    judul: {
      type: String,
      required: true,
    },
    kategoriId: {
      type: String,
      required: true,
    },
    kategoriNama: {
      type: String,
      required: true,
    },
    tipe: {
      type: String,
      enum: [
        'pilihan_ganda',
        'pilihan_ganda_kompleks',
        'benar_salah',
        'menjodohkan',
        'essay',
        'custom',
      ],
      required: true,
    },
    totalSoal: { type: Number, default: null, min: 1 },
    customKuota: {
      type: Object,
      default: {},
    },
    // Array semua soal di bank ini (50 soal pilihan ganda = 50 item di sini)
    soal: {
      type: [soalItemSchema],
      default: [],
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

cbtBankSoalSchema.index({ cbtKelasId: 1 });
cbtBankSoalSchema.index({ guruId: 1 });

const CBTBankSoal = mongoose.model('CBTBankSoal', cbtBankSoalSchema);

export default CBTBankSoal;

