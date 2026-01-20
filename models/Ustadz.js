import mongoose from 'mongoose';

const ustadzSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: 'ustadz-single',
  },
  guruIds: [{
    id: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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
ustadzSchema.index({ guruIds: 1 });

const Ustadz = mongoose.model('Ustadz', ustadzSchema);

export default Ustadz;

