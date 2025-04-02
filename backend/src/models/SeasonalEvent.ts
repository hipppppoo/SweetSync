import mongoose from 'mongoose';

const seasonalEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  reminderDays: {
    type: Number,
    default: 7,
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

const SeasonalEvent = mongoose.model('SeasonalEvent', seasonalEventSchema);

export default SeasonalEvent; 