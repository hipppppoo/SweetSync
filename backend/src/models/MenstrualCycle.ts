import mongoose from 'mongoose';

const menstrualCycleSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  flow: {
    type: String,
    enum: ['light', 'medium', 'heavy'],
    default: 'medium',
  },
  symptoms: [{
    type: String,
    enum: ['cramps', 'headache', 'fatigue', 'bloating', 'mood_swings', 'other'],
  }],
  mood: {
    type: String,
    enum: ['happy', 'sad', 'angry', 'anxious', 'neutral'],
    default: 'neutral',
  },
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

menstrualCycleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const MenstrualCycle = mongoose.model('MenstrualCycle', menstrualCycleSchema);

export default MenstrualCycle; 