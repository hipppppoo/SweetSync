import mongoose, { Document, Schema } from 'mongoose';

export interface ISeasonalEvent extends Document {
  title: string;
  date: Date;
  type: string;
  description?: string;
  isRecurring: boolean;
  reminderDays: number;
  userId: mongoose.Schema.Types.ObjectId;
}

const SeasonalEventSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  isRecurring: {
    type: Boolean,
    required: true,
    default: false,
  },
  reminderDays: {
    type: Number,
    required: true,
    min: 0,
    default: 7,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
}, {
  timestamps: true,
});

export default mongoose.model<ISeasonalEvent>('SeasonalEvent', SeasonalEventSchema); 