import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  grade: {
    type: String,
    required: true,
  },
  minNilai: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  maxNilai: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  deskripsi: String,
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: String,
    required: true,
  },
}, {
  timestamps: false,
});

const PengaturanGrade = mongoose.model('PengaturanGrade', gradeSchema);

export default PengaturanGrade;


