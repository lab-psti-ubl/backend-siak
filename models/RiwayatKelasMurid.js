import mongoose from 'mongoose';

const riwayatKelasMuridSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  muridId: { type: String, required: true },
  kelasId: { type: String, required: true },
  tahunAjaran: { type: String, required: true }, // tahunAjaran ID
  semester: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['aktif', 'naik', 'tidak_naik', 'lulus', 'tidak_lulus'], 
    required: true,
    default: 'aktif'
  },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { 
  timestamps: false,
});

// Indexes for faster queries
riwayatKelasMuridSchema.index({ muridId: 1, tahunAjaran: 1, semester: 1 });
riwayatKelasMuridSchema.index({ kelasId: 1, tahunAjaran: 1 });
riwayatKelasMuridSchema.index({ muridId: 1 });

const RiwayatKelasMurid = mongoose.model('RiwayatKelasMurid', riwayatKelasMuridSchema);

export default RiwayatKelasMurid;

