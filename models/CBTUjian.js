import mongoose from 'mongoose';

const cbtUjianSchema = new mongoose.Schema(
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
    // Referensi ke kombinasi tingkat + mapel + tahun ajaran + semester (CBTKelas)
    cbtKelasId: {
      type: String,
      required: true,
    },
    // Referensi ke kelas konkret (misal: X IPA 1)
    kelasId: {
      type: String,
      required: true,
    },
    // Simpan juga mata pelajaran untuk memudahkan filter
    mataPelajaranId: {
      type: String,
      required: true,
    },
    bankSoalId: {
      type: String,
      required: true,
    },
    bankSoalJudul: {
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
    // Menandai apakah komponen nilai ini bertipe ganda (memiliki nilai ke-1, ke-2, dst)
    kategoriHasNilai: {
      type: Boolean,
      default: false,
    },
    // Untuk Tugas / komponen dinamis ganda: ke-1, ke-2, dst
    kategoriKe: {
      type: Number,
      default: null,
    },
    // Nama ujian yang tampil untuk guru/murid
    judulUjian: {
      type: String,
      required: true,
    },
    tahunAjaran: {
      type: String,
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    // Waktu ujian (sebagai string agar konsisten dengan model lain)
    tanggalMulai: {
      type: String,
      required: true,
    },
    jamMulai: {
      type: String,
      required: true,
    },
    tanggalSelesai: {
      type: String,
      required: true,
    },
    jamSelesai: {
      type: String,
      required: true,
    },
    // Durasi efektif ujian sejak murid mulai (dalam menit)
    durasiMenit: {
      type: Number,
      required: true,
      min: 1,
    },
    acakSoal: {
      type: Boolean,
      default: false,
    },
    tunjukanHasilNilai: {
      type: Boolean,
      default: false,
    },
    // Jika true, ujian dapat dimulai kapan saja (tanpa menunggu tanggal/jam mulai)
    isPublished: {
      type: Boolean,
      default: false,
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

cbtUjianSchema.index({ guruId: 1 });
cbtUjianSchema.index({ cbtKelasId: 1 });
cbtUjianSchema.index({ kelasId: 1 });
cbtUjianSchema.index({ bankSoalId: 1 });

const CBTUjian = mongoose.model('CBTUjian', cbtUjianSchema);

export default CBTUjian;

