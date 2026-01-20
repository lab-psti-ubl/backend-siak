import mongoose from 'mongoose';

const santriSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: 'santri-single',
  },
  muridIds: [{
    id: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  }],
  // Store santri data that are not from murid collection
  santriData: [{
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: String,
    avatar: String,
    profileImage: String,
    nisn: {
      type: String,
      sparse: true,
    },
    whatsappOrtu: String,
    isActive: Boolean,
    rfidGuid: {
      type: String,
      sparse: true,
    },
    createdAt: {
      type: String,
      required: true,
    },
  }],
  createdAt: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: String,
    required: true,
  },
}, {
  timestamps: false,
});

// Index for faster queries
santriSchema.index({ muridIds: 1 });

const Santri = mongoose.model('Santri', santriSchema);

export default Santri;

