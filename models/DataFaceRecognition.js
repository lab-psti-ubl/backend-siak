import mongoose from 'mongoose';

/**
 * Collection: datafacerecognation
 * Menyimpan descriptor wajah guru (base64 string) untuk keperluan face recognition.
 */
const dataFaceRecognitionSchema = new mongoose.Schema(
  {
    guruId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    /** Array descriptor wajah (base64 Float32Array) */
    faceDescriptors: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false,
    collection: 'datafacerecognation',
  }
);

dataFaceRecognitionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const DataFaceRecognition = mongoose.model('DataFaceRecognition', dataFaceRecognitionSchema);

export default DataFaceRecognition;

