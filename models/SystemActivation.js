import mongoose from 'mongoose';

const systemActivationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  isSystemActive: {
    type: Boolean,
    required: true,
    default: false,
  },
  /** Kode aktivasi untuk mengaktifkan sistem.
   * Nilai default 'gst' disimpan dalam bentuk hash dan diatur dari controller.
   */
  activationCode: {
    type: String,
  },
  activatedAt: String,
  activatedBy: String,
  createdAt: {
    type: String,
    required: true,
  },
}, {
  timestamps: false,
});

const SystemActivation = mongoose.model('SystemActivation', systemActivationSchema);

export default SystemActivation;

