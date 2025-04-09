import mongoose, { Document, Schema } from 'mongoose';

export interface ICycle extends Document {
  startDate: Date;
  endDate: Date;
  symptoms: string[];
  moods: string[];
  notes?: string;
  userId: mongoose.Schema.Types.ObjectId;
}

const cycleSchema = new Schema<ICycle>({
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  symptoms: [{
    type: String,
  }],
  moods: [{
    type: String,
  }],
  notes: {
    type: String,
    default: '',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, {
  timestamps: true,
});

export default mongoose.model<ICycle>('Cycle', cycleSchema); 