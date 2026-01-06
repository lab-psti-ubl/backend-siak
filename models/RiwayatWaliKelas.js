import mongoose from 'mongoose';

const riwayatWaliKelasSchema = new mongoose.Schema({
  guruId: {
    type: String,
    required: true
  },
  kelasId: {
    type: String,
    required: true
  },
  namaKelas: {
    type: String,
    required: true
  },
  tahunAjaran: {
    type: String,
    required: true
  },
  jumlahMuridLulus: {
    type: Number,
    default: 0
  },
  jumlahMuridTidakLulus: {
    type: Number,
    default: 0
  },
  tanggalKelulusan: {
    type: String
  },
  createdAt: {
    type: String,
    default: () => new Date().toISOString()
  }
});

export default mongoose.model('RiwayatWaliKelas', riwayatWaliKelasSchema);
