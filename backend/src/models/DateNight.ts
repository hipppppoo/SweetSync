import mongoose from 'mongoose';

const dateNightSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  location: {
    type: String,
    required: true,
  },
  cost: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    default: 5,
  },
  photos: [{
    type: String, // URLs to photos
  }],
  notes: {
    type: String,
    default: '',
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

dateNightSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const DateNight = mongoose.model('DateNight', dateNightSchema);

export default DateNight; 