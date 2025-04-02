import mongoose from 'mongoose';

const favoriteThingSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    default: 5,
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  isShared: {
    type: Boolean,
    default: true,
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

favoriteThingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const FavoriteThing = mongoose.model('FavoriteThing', favoriteThingSchema);

export default FavoriteThing; 