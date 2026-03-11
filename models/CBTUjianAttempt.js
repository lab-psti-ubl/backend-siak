import mongoose from 'mongoose';

const ujianResponseSchema = new mongoose.Schema(
  {
    soalId: { type: String, required: true },
    tipe: { type: String, required: true },
    selectedOptionIds: { type: [String], default: [] },
    jawabanBoolean: { type: Boolean, default: null },
    jawabanEssay: { type: String, default: '' },
    poinAuto: { type: Number, default: 0 },
    isCorrectAuto: { type: Boolean, default: false },
    // Untuk penilaian manual (khususnya essay)
    isCorrect: { type: Boolean, default: null },
  },
  { _id: false }
);

const cbtUjianAttemptSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    ujianId: {
      type: String,
      required: true,
    },
    muridId: {
      type: String,
      required: true,
    },
    kelasId: {
      type: String,
      required: true,
    },
    mataPelajaranId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['belum_mulai', 'sedang', 'selesai'],
      default: 'sedang',
    },
    startedAt: {
      type: String,
      required: true,
    },
    finishedAt: {
      type: String,
      default: null,
    },
    durasiMenit: {
      type: Number,
      required: true,
      min: 1,
    },
    skorAuto: {
      type: Number,
      default: 0,
    },
    skorEssayManual: {
      type: Number,
      default: null,
    },
    skorTotal: {
      type: Number,
      default: null,
    },
    responses: {
      type: [ujianResponseSchema],
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

cbtUjianAttemptSchema.index({ ujianId: 1, muridId: 1 }, { unique: true });
cbtUjianAttemptSchema.index({ muridId: 1 });

const CBTUjianAttempt = mongoose.model('CBTUjianAttempt', cbtUjianAttemptSchema);

export default CBTUjianAttempt;

