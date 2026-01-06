import mongoose from 'mongoose';

const waliKelasSettingsSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: 'wali-kelas-settings-1' },
  system: { type: String, enum: ['otomatis', 'tetap', 'hapus'], required: true, default: 'otomatis' },
  lastUpdated: { type: String, default: () => new Date().toISOString() },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

waliKelasSettingsSchema.pre('save', function(next) {
  this.lastUpdated = new Date().toISOString();
  next();
});

const WaliKelasSettings = mongoose.model('WaliKelasSettings', waliKelasSettingsSchema);

export default WaliKelasSettings;

