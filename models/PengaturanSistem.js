import mongoose from 'mongoose';

const pengaturanSistemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: 'pengaturan-sistem' },
  enableEarlyDeparture: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

pengaturanSistemSchema.pre('save', function(next) {
  this.updatedAt = new Date().toISOString();
  next();
});

// Ensure only one document exists
pengaturanSistemSchema.statics.getSettings = async function() {
  let settings = await this.findOne({ id: 'pengaturan-sistem' });
  if (!settings) {
    settings = await this.create({
      id: 'pengaturan-sistem',
      enableEarlyDeparture: false,
    });
  }
  return settings;
};

const PengaturanSistem = mongoose.model('PengaturanSistem', pengaturanSistemSchema);

export default PengaturanSistem;

