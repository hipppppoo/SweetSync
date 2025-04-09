import mongoose, { Document, Schema } from 'mongoose';

interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface IChatHistory extends Document {
  title: string;
  messages: IMessage[];
  userId: mongoose.Schema.Types.ObjectId;
}

const MessageSchema: Schema = new Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ChatHistorySchema: Schema = new Schema(
  {
  title: {
    type: String,
    required: true,
      trim: true,
      default: 'New Chat',
  },
    messages: {
      type: [MessageSchema],
      default: [],
  },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    }
  },
  { timestamps: true } 
);

export default mongoose.model<IChatHistory>('ChatHistory', ChatHistorySchema); 