import mongoose from 'mongoose';

const kelasTahfizSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  namaKelas: {
    type: String,
    required: true,
  },
  ruangan: {
    type: String,
    required: true,
  },
  ustadzId: {
    type: String,
    required: true,
  },
  santriIds: [{
    type: String,
  }],
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

const KelasTahfiz = mongoose.model('KelasTahfiz', kelasTahfizSchema);

export default KelasTahfiz;

