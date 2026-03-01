import mongoose from 'mongoose';

const alatRFIDSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  namaAlat: { type: String, required: true },
  lokasi: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  /**
   * Jenis absen:
   * - 'rfid'            → mode kartu RFID / QR (saat ini)
   * - 'facerecognition' → mode verifikasi wajah (kamera kiosk)
   */
  jenisAbsen: {
    type: String,
    enum: ['rfid', 'facerecognition'],
    default: 'rfid',
  },
  status: { type: String, enum: ['aktif', 'nonaktif'], required: true, default: 'aktif' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

alatRFIDSchema.pre('save', function(next) {
  this.updatedAt = new Date().toISOString();
  next();
});

const AlatRFID = mongoose.model('AlatRFID', alatRFIDSchema);

export default AlatRFID;

