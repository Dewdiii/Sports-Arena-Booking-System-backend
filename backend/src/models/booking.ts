import mongoose, { Schema, Document } from "mongoose";
import { BookingType } from "../shared/types";

export interface BookingDocument extends BookingType, Document {
  isPaymentRequired: () => boolean;
}

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  duration: { type: Number, required: true }, // duration in hours
  court: { type: String, required: true },
  paymentStatus: {
  type: String,
  enum: ['pending', 'completed', 'cancelled', 'not_required'],
  default: 'pending',
},
  transactionId: {
  type: String,
  required: function (this: any) {
    return this.paymentStatus !== 'not_required';
  },
},
  amount: {
  type: Number,
  required: function (this: any) {
    return this.paymentStatus !== 'not_required';
  },
},
  status: {
    type: String,
    enum: ["active", "cancelled", "completed"],
    default: "active",
  },
});

bookingSchema.methods.isPaymentRequired = function () {
  return this.paymentStatus !== "not_required";
};

const Booking = mongoose.model<BookingType>("Booking", bookingSchema);
export default Booking;
