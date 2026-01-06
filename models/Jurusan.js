import mongoose from 'mongoose';

const jurusanSchema = new mongoose.Schema({
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
  description: String,
  isActive: {
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

// Index for faster queries
// Note: code index is automatically created by unique: true, so we don't need to add it manually
jurusanSchema.index({ isActive: 1 });

const Jurusan = mongoose.model('Jurusan', jurusanSchema);

export default Jurusan;

