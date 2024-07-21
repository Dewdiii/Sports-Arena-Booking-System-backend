import mongoose, { Document, Schema, Model } from 'mongoose';
import { ArenaType, CourtType } from '../shared/types';

// Define the interface for the Court document
export interface CourtDocument extends CourtType, Document {}

// Create the schema for the Court subdocument
const CourtSchema: Schema<CourtDocument> = new Schema({
  name: { type: String, required: true },
  sports: { type: [String], required: true },
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

// Define the interface for the Arena document
export interface ArenaDocument extends ArenaType, Document {
  courts: CourtDocument[];
}

// Create the schema for the Arena model
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

// Create the Arena model
const Arena: Model<ArenaDocument> = mongoose.model('Arena', ArenaSchema);

export default Arena;
