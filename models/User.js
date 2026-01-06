import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: String,
  password: String,
  role: {
    type: String,
    enum: ['admin', 'kepala_sekolah'],
    required: true,
  },
  avatar: String,
  profileImage: String,
  createdAt: {
    type: String,
    required: true,
  },
}, {
  timestamps: false, // We use createdAt string instead
});

// Index for faster queries
// Note: email index is automatically created by unique: true, so we don't need to add it manually
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

export default User;

