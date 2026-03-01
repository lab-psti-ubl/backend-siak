import mongoose from 'mongoose';

const pengaturanSistemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  enableEarlyDeparture: { type: Boolean, default: false },
  language: { type: String, default: 'id', enum: ['id', 'ms'] },
  systemType: { type: String, default: 'sekolah_umum_tahfiz', enum: ['sekolah_umum', 'sekolah_umum_tahfiz', 'tahfiz'] },
  // Nama perusahaan yang ditampilkan di footer aplikasi
  footerCompanyName: { type: String, default: 'iSchola - Garnusa Studio Technologi' },
  // Pengaturan visibilitas modul CBT & SPMB (default aktif)
  cbtEnabled: { type: Boolean, default: true },
  spmbEnabled: { type: Boolean, default: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

pengaturanSistemSchema.pre('save', function(next) {
  // Generate unique ID if not provided (using MongoDB ObjectId)
  if (!this.id) {
    this.id = new mongoose.Types.ObjectId().toString();
  }
  this.updatedAt = new Date().toISOString();
  next();
});

// Ensure only one document exists (singleton pattern)
pengaturanSistemSchema.statics.getSettings = async function() {
  // Try to find any existing settings document (since only one should exist)
  let settings = await this.findOne().sort({ createdAt: -1 });
  // Don't create default - return null if not exists
  // This allows the app to show SystemTypeSetupModal on first run or after reset
  return settings;
};

const PengaturanSistem = mongoose.model('PengaturanSistem', pengaturanSistemSchema);

export default PengaturanSistem;

