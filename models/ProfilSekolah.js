import mongoose from 'mongoose';

const profilSekolahSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  namaSekolah: {
    type: String,
    required: true,
  },
  npsn: String,
  alamat: {
    type: String,
    required: true,
  },
  kota: String,
  provinsi: String,
  kodePos: String,
  email: String,
  nomorTelepon: String,
  website: String,
  logoSekolah: String,
  deskripsi: String,
  misiSekolah: String,
  visiSekolah: String,
  latitude: Number,
  longitude: Number,
  createdAt: {
    type: String,
    required: true,
  },
  updatedAt: String,
}, {
  timestamps: false,
});

const ProfilSekolah = mongoose.model('ProfilSekolah', profilSekolahSchema);

export default ProfilSekolah;


