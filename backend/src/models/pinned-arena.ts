import mongoose, { Document, Schema, Model } from "mongoose";
import { PinnedArena as PinnedArenaType } from "../shared/types";

// Fix: Extend and override the shared type to allow ObjectId
interface PinnedArenaDoc extends Omit<PinnedArenaType, 'userId' | 'arenaId'>, Document {
  userId: mongoose.Types.ObjectId;
  arenaId: mongoose.Types.ObjectId;
}

const pinnedArenaSchema = new Schema<PinnedArenaDoc>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  arenaId: { type: Schema.Types.ObjectId, ref: "Arena", required: true },
  pinnedAt: { type: Date, default: () => new Date() },
});

const PinnedArenaModel: Model<PinnedArenaDoc> = mongoose.model<PinnedArenaDoc>(
  "PinnedArena",
  pinnedArenaSchema
);

export default PinnedArenaModel;
