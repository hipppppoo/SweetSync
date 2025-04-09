import mongoose, { Document, Schema } from 'mongoose';

export interface IMenstrualCycle extends Document {
  startDate: Date;
  endDate: Date;
  flow: string;
  symptoms: string[];
  mood: string;
  notes?: string;
  userId: mongoose.Schema.Types.ObjectId;
}

const menstrualCycleSchema: Schema = new Schema({
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

menstrualCycleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const MenstrualCycle = mongoose.model<IMenstrualCycle>('MenstrualCycle', menstrualCycleSchema);

export default MenstrualCycle; 