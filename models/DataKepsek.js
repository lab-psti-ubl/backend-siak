import mongoose from 'mongoose';

const dataKepsekSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  nama: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  nip: String,
  noHP: String,
  createdAt: {
    type: String,
    required: true,
  },
}, {
  timestamps: false,
});

const DataKepsek = mongoose.model('DataKepsek', dataKepsekSchema);

export default DataKepsek;

