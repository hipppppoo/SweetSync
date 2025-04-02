import { Schema, model } from 'mongoose';

interface ICycle {
  startDate: Date;
  endDate: Date;
  symptoms: string[];
  moods: string[];
  notes: string;
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
}, {
  timestamps: true,
});

export default model<ICycle>('Cycle', cycleSchema); 