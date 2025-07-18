import express, { Request, Response } from "express";
import verifyToken from "../middlewear/auth";
import Booking from "../models/booking";
import Arena from "../models/ground";
import { processPayment } from "../utils/payment";
import stripe from "../utils/stripe";

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
// @access  Private - 500 error
router.get("/history", verifyToken, async (req: Request, res: Response) => {
  try {
    console.log("User ID from token:", req.userId); // ✅ Check if user ID exists

    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const bookings = await Booking.find({ userId: req.userId });
    console.log("Found bookings:", bookings.length);

    const currentDateTime = new Date();

    const active = bookings.filter((b: any) => {
      const bookingDateTime = new Date(`${b.date}T${b.startTime}`);
      return (
        b.status === "active" &&
        bookingDateTime > currentDateTime
      );
    });

    const past = bookings.filter((b: any) => {
      const bookingDateTime = new Date(`${b.date}T${b.startTime}`);
      return (
        b.status === "cancelled" ||
        b.status === "completed" ||
        bookingDateTime <= currentDateTime
      );
    });

    res.status(200).json({ active, past });
  } catch (error) {
    console.error("Error fetching booking history:", error);
    res.status(500).json({ message: "Unable to fetch booking history" });
  }
});


//Get booking details by its ID
router.get("/:bookingId", verifyToken, async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await Booking.findOne({ _id: bookingId, userId: req.userId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: "Error fetching booking" });
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

router.post("/:arenaId/courts/:courtId", verifyToken, async (req: Request, res: Response) => {
  const { arenaId, courtId } = req.params;
  const { date, startTime, duration, paymentIntentId, amount } = req.body;

  if (!date || !startTime || !duration) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // 1. Find Arena and Court
    const arena = await Arena.findOne({ _id: arenaId, "courts._id": courtId });
    if (!arena) {
      return res.status(404).json({ message: "Arena or court not found" });
    }

    // 2. Check for Time Conflicts
    const startHour = parseInt(startTime.split(":")[0], 10);
    const endHour = startHour + parseInt(duration, 10);

    const existingBookings = await Booking.find({ date, court: courtId });

    const hasConflict = existingBookings.some((b: any) => {
      const bStart = parseInt(b.startTime.split(":")[0], 10);
      const bEnd = bStart + parseInt(b.duration, 10);
      return startHour < bEnd && endHour > bStart;
    });

    if (hasConflict) {
      return res.status(409).json({ message: "Court already booked for the selected time range" });
    }

    // 3. Payment Handling
    let paymentStatus = "not_required";
    let paymentDetails: { amount: number; transactionId: string } | undefined;

    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (!paymentIntent) {
        return res.status(400).json({ message: "Payment intent not found" });
      }

      if (
        paymentIntent.metadata.arenaId !== arenaId ||
        paymentIntent.metadata.userId !== req.userId
      ) {
        return res.status(400).json({ message: "Payment intent metadata mismatch" });
      }

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          message: `Payment not completed. Status: ${paymentIntent.status}`,
        });
      }

      paymentStatus = "completed";
      paymentDetails = {
        amount: paymentIntent.amount / 100,
        transactionId: paymentIntent.id,
      };
    }

    // 4. Create Booking Data
    const bookingData: any = {
      userId: req.userId,
      date,
      startTime,
      duration,
      court: courtId,
      paymentStatus,
      status: "active",
    };

    if (paymentDetails) {
      bookingData.paymentDetails = paymentDetails;
    }

    // 5. Save Booking
    const booking = new Booking(bookingData);
    await booking.save();

    // 6. Link to Arena
    await Arena.findOneAndUpdate(
      { _id: arenaId, "courts._id": courtId },
      { $push: { bookings: booking._id } }
    );

    return res.status(201).json({ message: "Booking successful", booking });
  } catch (err) {
    console.error("Booking Error:", err);
    return res.status(500).json({ message: "Booking failed" });
  }
});


export default router;
