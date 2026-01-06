import mongoose from 'mongoose';

const backgroundKTASchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  backgroundDepanBase64: String,
  backgroundBelakangBase64: String,
  backgroundDepanMuridBase64: String,
  backgroundBelakangMuridBase64: String,
  backgroundDepanGuruBase64: String,
  backgroundBelakangGuruBase64: String,
  createdAt: {
    type: String,
    required: true,
  },
  updatedAt: String,
}, {
  timestamps: false,
});

const BackgroundKTA = mongoose.model('BackgroundKTA', backgroundKTASchema);

export default BackgroundKTA;


