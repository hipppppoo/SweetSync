import mongoose, { Document, Schema } from 'mongoose';

export interface IAnniversary extends Document {
  title: string;
  date: Date;
  time: string;
  description?: string;
  type: 'anniversary' | 'birthday' | 'other';
  monthlyReminder?: boolean;
  monthlyReminderDay?: number;
  reminderEnabled: boolean;
  reminderDays: number;
  userId: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const anniversarySchema: Schema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['anniversary', 'birthday', 'other'],
    default: 'anniversary'
  },
  monthlyReminder: {
    type: Boolean,
    default: false
  },
  monthlyReminderDay: {
    type: Number,
    min: 1,
    max: 31
  },
  reminderEnabled: {
    type: Boolean,
    default: true,
  },
  reminderDays: {
    type: Number,
    default: 7,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, { timestamps: true });

anniversarySchema.pre<IAnniversary>('save', function(next) {
  if (this.isModified('monthlyReminder') && this.monthlyReminder && !this.monthlyReminderDay) {
    const date = new Date(this.date);
    this.monthlyReminderDay = date.getDate();
  }
  next();
});

const Anniversary = mongoose.model<IAnniversary>('Anniversary', anniversarySchema);

export default Anniversary; 