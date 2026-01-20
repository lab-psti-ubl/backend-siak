import mongoose from 'mongoose';

const fotoMengajarSchema = new mongoose.Schema({
  id: { type: String, required: true },
  fotoBase64: { type: String, required: true },
  waktuFoto: { type: String, required: true },
  keterangan: { type: String },
}, { _id: false });

const pertemuanTahfizSchema = new mongoose.Schema({
  tanggal: { type: String, required: true }, // 'YYYY-MM-DD'
  judul: { type: String, required: true },
  deskripsi: { type: String, required: true },
  waktuInput: { type: String, required: true },
  file: {
    name: { type: String },
    type: { type: String },
    data: { type: String },
    size: { type: Number },
  },
  fotoMengajar: { type: fotoMengajarSchema }, // One photo per pertemuan
}, { _id: false });

const jurnalTahfizSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  jadwalId: { type: String, required: true },
  kelasId: { type: String, required: true },
  pertemuan: [pertemuanTahfizSchema], // Array of pertemuan
  tahun: { type: String, required: true }, // Only year, no semester
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { 
  timestamps: false // We use createdAt/updatedAt strings instead
});

jurnalTahfizSchema.pre('save', function(next) {
  this.updatedAt = new Date().toISOString();
  next();
});

// Index for faster queries
jurnalTahfizSchema.index({ jadwalId: 1, kelasId: 1 });
jurnalTahfizSchema.index({ kelasId: 1 });
jurnalTahfizSchema.index({ jadwalId: 1 });
jurnalTahfizSchema.index({ tahun: 1 });

const JurnalTahfiz = mongoose.model('JurnalTahfiz', jurnalTahfizSchema);

export default JurnalTahfiz;

