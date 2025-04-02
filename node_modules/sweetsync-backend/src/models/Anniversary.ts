import mongoose from 'mongoose';

const anniversarySchema = new mongoose.Schema({
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
    enum: ['relationship', 'birthday', 'wedding', 'first_date', 'other'],
    default: 'other',
  },
  description: {
    type: String,
    default: '',
  },
  reminderEnabled: {
    type: Boolean,
    default: true,
  },
  reminderDays: {
    type: Number,
    default: 7,
  },
  monthlyReminder: {
    type: Boolean,
    default: false,
  },
  monthlyReminderDay: {
    type: Number,
    default: null,
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

anniversarySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.monthlyReminder && !this.monthlyReminderDay) {
    const date = new Date(this.date);
    this.monthlyReminderDay = date.getDate();
  }
  next();
});

const Anniversary = mongoose.model('Anniversary', anniversarySchema);

export default Anniversary; 