import mongoose from "mongoose";
import { BookingType } from "../shared/types";


const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  duration: { type: Number, required: true }, // duration in hours
  court: { type: String, required: true },
  paymentStatus: { type: String, enum: ["pending", "completed"], required: true },
  paymentDetails: {
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true },
  },
});
const Booking = mongoose.model<BookingType>("Booking", bookingSchema);
export default Booking;
