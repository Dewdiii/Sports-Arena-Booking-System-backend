import mongoose, { Document, Schema, Model } from 'mongoose';
import { ArenaType, CourtType } from '../shared/types';

// --- Extend the CourtType interface if needed ---
export interface CourtDocument extends Omit<CourtType, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

// Create schema for Court (embedded)
const CourtSchema: Schema<CourtDocument> = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // e.g. "Indoor", "Outdoor"
  sports: { type: [String], required: true },
  pricePerHour: { type: Number, required: true },
  description: { type: String },
  availableTime: [
    {
      day: { type: String, required: true },
      openTime: { type: String, required: true },
      closeTime: { type: String, required: true },
    },
  ],
  imageUrls: { type: [String], default: [] },
  lastUpdated: { type: Date, default: Date.now },
  userId: { type: String, required: true },
});

// --- Arena Interface ---
export interface ArenaDocument extends ArenaType, Document {
  courts: CourtDocument[];
}

// --- Arena Schema ---
const ArenaSchema: Schema<ArenaDocument> = new Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  location: { type: String, required: true },
  imageUrls: { type: [String], default: [] },
  lastUpdated: { type: Date, default: Date.now },
  userId: { type: String, required: true },
  courts: [CourtSchema],
}, { timestamps: true });

// --- Arena Model ---
const Arena: Model<ArenaDocument> = mongoose.model('Arena', ArenaSchema);

export default Arena;
