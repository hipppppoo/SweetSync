import mongoose, { Document, Schema } from 'mongoose';

export interface IFavoriteThing extends Document {
  name: string;
  category: string;
  description?: string;
  rating?: number;
  dateAdded: Date;
  isShared?: boolean;
  tags?: string[];
  userId: mongoose.Schema.Types.ObjectId;
}

const FavoriteThingSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  dateAdded: {
    type: Date,
    required: true,
    default: Date.now,
  },
  isShared: {
    type: Boolean,
    default: false,
  },
  tags: {
    type: [String],
    default: [],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, { timestamps: true });

FavoriteThingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const FavoriteThing = mongoose.model<IFavoriteThing>('FavoriteThing', FavoriteThingSchema);

export default FavoriteThing; 