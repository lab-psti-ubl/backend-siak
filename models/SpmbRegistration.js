import mongoose from 'mongoose';

const spmbRegistrationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  openingId: {
    type: String,
    required: true,
  },
  tahunAjaran: {
    type: String,
    required: true,
  },
  namaLengkap: {
    type: String,
    required: true,
  },
  jenisKelamin: {
    type: String,
    required: false,
    enum: ['L', 'P'],
    default: '',
  },
  umur: {
    type: Number,
    required: false,
  },
  nisn: {
    type: String,
    required: false,
    default: '',
  },
  email: {
    type: String,
    required: false,
    default: '',
  },
  noWhatsappOrtu: {
    type: String,
    required: true,
  },
  asalSekolah: {
    type: String,
    required: true,
  },
  alamat: {
    type: String,
    required: true,
  },
  pilihanJurusan: {
    type: String,
    required: false,
    default: '',
  },
  // Data tambahan sesuai jenjang
  nikAnak: {
    type: String,
    required: false,
    default: '',
  },
  nomorKk: {
    type: String,
    required: false,
    default: '',
  },
  tempatLahir: {
    type: String,
    required: false,
    default: '',
  },
  tanggalLahir: {
    type: String,
    required: false,
    default: '',
  },
  namaOrangTua: {
    type: String,
    required: false,
    default: '',
  },
  nikOrangTua: {
    type: String,
    required: false,
    default: '',
  },
  pekerjaanOrangTua: {
    type: String,
    required: false,
    default: '',
  },
  noHpOrangTua: {
    type: String,
    required: false,
    default: '',
  },
  ringkasanNilaiRapor: {
    type: Number,
    required: false,
    default: null,
  },
  // Dokumen (disimpan sebagai base64 atau URL)
  dokumenKk: {
    type: String,
    required: false,
    default: '',
  },
  dokumenAktaKelahiran: {
    type: String,
    required: false,
    default: '',
  },
  dokumenKtpOrangTua: {
    type: String,
    required: false,
    default: '',
  },
  dokumenKartuImunisasi: {
    type: String,
    required: false,
    default: '',
  },
  dokumenPasFoto: {
    type: String,
    required: false,
    default: '',
  },
  dokumenIjazahAtauSkL: {
    type: String,
    required: false,
    default: '',
  },
  dokumenRapor: {
    type: String,
    required: false,
    default: '',
  },
  dokumenKip: {
    type: String,
    required: false,
    default: '',
  },
  dokumenSertifikatPrestasi: {
    type: String,
    required: false,
    default: '',
  },
  dokumenSuratKeteranganSehat: {
    type: String,
    required: false,
    default: '',
  },
  // Penanda apakah pendaftar sudah dimasukkan ke koleksi murid/kelas tertentu
  assignedToClass: {
    type: Boolean,
    required: false,
    default: false,
  },
  assignedClassId: {
    type: String,
    required: false,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'diterima', 'ditolak'],
    default: 'pending',
  },
  createdAt: {
    type: String,
    required: true,
  },
}, {
  timestamps: false,
  collection: 'spmb',
});

// Indexes
spmbRegistrationSchema.index({ tahunAjaran: 1 });
spmbRegistrationSchema.index({ status: 1 });

const SpmbRegistration = mongoose.model('SpmbRegistration', spmbRegistrationSchema);

export default SpmbRegistration;

