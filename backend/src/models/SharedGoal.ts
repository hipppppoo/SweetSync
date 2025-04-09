import mongoose, { Document, Schema } from 'mongoose';

export interface ISharedGoal extends Document {
  title: string;
  description?: string;
  category?: string;
  targetDate?: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold';
  progress?: number;
  notes?: string;
  userId: mongoose.Schema.Types.ObjectId;
}

const sharedGoalSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    trim: true,
  },
  targetDate: {
    type: Date,
  },
  status: {
    type: String,
    required: true,
    enum: ['planned', 'in_progress', 'completed', 'on_hold'],
    default: 'planned',
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  notes: {
    type: String,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  startDate: {
    type: Date,
    required: true,
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
}, { timestamps: true });

sharedGoalSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const SharedGoal = mongoose.model<ISharedGoal>('SharedGoal', sharedGoalSchema);

export default SharedGoal; 