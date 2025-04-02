import mongoose from 'mongoose';

const moodSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  energy: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 5,
  },
  sleepHours: {
    type: Number,
    required: true,
    min: 0,
    max: 24,
    default: 8,
  },
  sleepQuality: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 5,
  },
  stressLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 5,
  },
  physicalHealth: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 5,
  },
  happinessLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 5,
  },
  activities: [{
    type: String,
  }],
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

moodSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Mood = mongoose.model('Mood', moodSchema);

export default Mood; 