import mongoose from 'mongoose';

const moodEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  energy: {
    type: Number,
    min: 1,
    max: 10,
    required: true,
  },
  activities: [{
    type: String,
  }],
  notes: {
    type: String,
    default: '',
  },
  sleepHours: {
    type: Number,
    min: 0,
    max: 24,
    default: 8,
  },
  sleepQuality: {
    type: Number,
    min: 1,
    max: 10,
    default: 5,
  },
  stressLevel: {
    type: Number,
    min: 1,
    max: 10,
    default: 5,
  },
  physicalHealth: {
    type: Number,
    min: 1,
    max: 10,
    default: 5,
  },
  happinessLevel: {
    type: Number,
    min: 1,
    max: 10,
    default: 5,
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

moodEntrySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const MoodEntry = mongoose.model('MoodEntry', moodEntrySchema);

export default MoodEntry; 