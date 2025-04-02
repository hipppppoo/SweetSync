import mongoose from 'mongoose';

const sharedGoalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'on_hold'],
    default: 'planned',
  },
  startDate: {
    type: Date,
    required: true,
  },
  targetDate: {
    type: Date,
    required: true,
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  milestones: [{
    title: String,
    completed: {
      type: Boolean,
      default: false,
    },
    targetDate: Date,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

sharedGoalSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const SharedGoal = mongoose.model('SharedGoal', sharedGoalSchema);

export default SharedGoal; 