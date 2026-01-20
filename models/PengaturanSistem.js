import mongoose from 'mongoose';

const pengaturanSistemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  enableEarlyDeparture: { type: Boolean, default: false },
  language: { type: String, default: 'id', enum: ['id', 'ms'] },
  systemType: { type: String, default: 'sekolah_umum_tahfiz', enum: ['sekolah_umum', 'sekolah_umum_tahfiz', 'tahfiz'] },
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
  if (!settings) {
    // Create new with unique ID
    settings = await this.create({
      id: new mongoose.Types.ObjectId().toString(),
      enableEarlyDeparture: false,
      language: 'id',
      systemType: 'sekolah_umum_tahfiz',
    });
  }
  return settings;
};

const PengaturanSistem = mongoose.model('PengaturanSistem', pengaturanSistemSchema);

export default PengaturanSistem;

