import mongoose, { Document, Schema } from 'mongoose';

export interface IFlowerGift extends Document {
  flowerType: string;
  date: Date;
  occasion?: string;
  notes?: string;
  reaction?: string;
  price?: number;
  estimatedExpiryDate?: Date;
  userId: mongoose.Schema.Types.ObjectId;
}

const flowerSchema = new Schema({
  flowerType: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  occasion: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  reaction: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    min: 0,
  },
  source: {
    type: String,
    default: '',
  },
  estimatedExpiryDate: {
    type: Date,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

flowerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const FlowerGift = mongoose.model<IFlowerGift>('FlowerGift', flowerSchema);

export default FlowerGift; 