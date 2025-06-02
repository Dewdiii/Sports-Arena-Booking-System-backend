import mongoose, { Document, Schema, Model } from "mongoose";
import { Rating as RatingType } from "../shared/types";

// Define Mongoose-compatible interface
interface RatingDoc extends Omit<RatingType, "userId" | "arenaId" | "createdAt">, Document {
  userId: mongoose.Types.ObjectId;
  arenaId: mongoose.Types.ObjectId;
  createdAt: Date;
}

// Define the schema
const ratingSchema = new Schema<RatingDoc>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  arenaId: { type: Schema.Types.ObjectId, ref: "Arena", required: true },
  sportType: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  review: { type: String },
  createdAt: { type: Date, default: () => new Date() },
});

// Export model with correct typings
const RatingModel: Model<RatingDoc> = mongoose.model<RatingDoc>("Rating", ratingSchema);

export default RatingModel;
