import mongoose, { Document, Schema } from 'mongoose';

export interface IDateNight extends Document {
  title: string;
  date: Date;
  location?: string;
  description?: string;
  activity?: string;
  cost?: number;
  rating?: number;
  photos?: string[];
  mood?: string;
  userId: mongoose.Schema.Types.ObjectId;
}

const DateNightSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  location: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  activity: {
    type: String,
    trim: true,
  },
  cost: {
    type: Number,
    min: 0,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  photos: {
    type: [String],
    default: [],
  },
  mood: {
    type: String,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, { timestamps: true });

DateNightSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const DateNight = mongoose.model<IDateNight>('DateNight', DateNightSchema);

export default DateNight; 