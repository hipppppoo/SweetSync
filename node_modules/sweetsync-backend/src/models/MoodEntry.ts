import mongoose, { Document, Schema } from 'mongoose';

export interface IMoodEntry extends Document {
  date: Date;
  energy?: number;
  stressLevel?: number;
  physicalHealth?: number;
  notes?: string;
  sleepHours?: number;
  sleepQuality?: number;
  happinessLevel?: number;
  activities?: string[];
  userId: mongoose.Schema.Types.ObjectId;
}

const moodEntrySchema: Schema = new Schema({
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

moodEntrySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const MoodEntry = mongoose.model<IMoodEntry>('MoodEntry', moodEntrySchema);

export default MoodEntry; 