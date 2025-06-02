import express, { Request, Response } from "express";
import verifyToken from "../middlewear/auth";
import Booking from "../models/booking";
import Arena from "../models/ground";
import { processPayment } from "../utils/payment";

const router = express.Router();

// @route   GET /bookings
// @desc    Get all bookings for the authenticated user
// @access  Private
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find({ userId: req.userId });
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Unable to fetch bookings" });
  }
});

// @route   GET /bookings/history
// @desc    Get active and past bookings separately
// @access  Private
router.get("/history", verifyToken, async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find({ userId: req.userId });

    const currentDateTime = new Date();

    const active = bookings.filter((b: any) =>
      b.status === "active" &&
      new Date(`${b.date}T${b.startTime}`) > currentDateTime
    );

    const past = bookings.filter((b: any) =>
      b.status === "cancelled" ||
      b.status === "completed" ||
      new Date(`${b.date}T${b.startTime}`) <= currentDateTime
    );

    res.status(200).json({ active, past });
  } catch (error) {
    console.error("Error fetching booking history:", error);
    res.status(500).json({ message: "Unable to fetch booking history" });
  }
});

// @route   PATCH /bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.patch("/:id/cancel", verifyToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const booking = await Booking.findOne({ _id: id, userId: req.userId });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "active") {
      return res.status(400).json({ message: "Only active bookings can be cancelled" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.status(200).json({ message: "Booking cancelled", booking });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ message: "Unable to cancel booking" });
  }
});

// @route   POST /bookings
// @desc    Create a new booking (payment optional)
// @access  Private
router.post("/", verifyToken, async (req: Request, res: Response) => {
  const { date, startTime, duration, court, amount } = req.body;

  if (!date || !startTime || !duration || !court) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const startHour = parseInt(startTime.split(":")[0], 10);
    const endHour = startHour + parseInt(duration, 10);

    const existingBookings = await Booking.find({ date, court });

    const hasConflict = existingBookings.some((b: any) => {
      const bStart = parseInt(b.startTime.split(":")[0], 10);
      const bEnd = bStart + parseInt(b.duration, 10);
      return (startHour < bEnd && endHour > bStart);
    });

    if (hasConflict) {
      return res.status(409).json({ message: "Court already booked for the selected time range" });
    }

    let paymentStatus = "not_required";
    let paymentDetails: { amount: number; transactionId: string } | null = null;

    if (amount && amount > 0) {
      const paymentResult = await processPayment(amount);
      if (paymentResult.status !== "completed") {
        return res.status(400).json({ message: "Payment failed" });
      }

      paymentStatus = "completed";
      paymentDetails = {
        amount,
        transactionId: paymentResult.transactionId,
      };
    }

    const newBooking = new Booking({
      userId: req.userId,
      date,
      startTime,
      duration,
      court,
      paymentStatus,
      paymentDetails,
      status: "active", // default booking status
    });

    await newBooking.save();

    const arena = await Arena.findOneAndUpdate(
      { "courts._id": court },
      { $push: { bookings: newBooking._id } }
    );

    if (!arena) {
      return res.status(404).json({ message: "Arena or court not found" });
    }

    res.status(201).json(newBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Unable to create booking" });
  }
});

export default router;
