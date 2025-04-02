import mongoose from 'mongoose';

const flowerSchema = new mongoose.Schema({
  flowerType: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  reaction: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    default: 0,
  },
  source: {
    type: String,
    default: '',
  },
  estimatedExpiryDate: {
    type: Date,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

flowerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const FlowerGift = mongoose.model('FlowerGift', flowerSchema);

export default FlowerGift; 