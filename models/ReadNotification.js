import mongoose from 'mongoose';

const readNotificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  readNotificationIds: {
    type: [String],
    default: [],
    required: true
  },
  updatedAt: {
    type: String,
    default: () => new Date().toISOString()
  }
}, {
  timestamps: false // We use updatedAt string instead
});

// Unique index to ensure one document per user (index is automatically created, no need for index: true in field)
readNotificationSchema.index({ userId: 1 }, { unique: true });

export default mongoose.model('ReadNotification', readNotificationSchema);

