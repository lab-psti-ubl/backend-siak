import mongoose from 'mongoose';

const pertemuanSchema = new mongoose.Schema({
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
}, { _id: false });

const jurnalSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  jadwalId: { type: String, required: true },
  kelasId: { type: String, required: true },
  pertemuan: [pertemuanSchema], // Array of pertemuan
  tahunAjaranId: { type: String, required: true },
  semester: { type: Number, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { 
  timestamps: false // We use createdAt/updatedAt strings instead
});

jurnalSchema.pre('save', function(next) {
  this.updatedAt = new Date().toISOString();
  next();
});

// Index for faster queries
jurnalSchema.index({ jadwalId: 1, kelasId: 1 });
jurnalSchema.index({ kelasId: 1 });
jurnalSchema.index({ jadwalId: 1 });

const Jurnal = mongoose.model('Jurnal', jurnalSchema);

export default Jurnal;

