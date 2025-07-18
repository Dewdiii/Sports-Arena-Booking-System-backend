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

// @route   POST /bookings
// @desc    Create a new booking (payment optional)
// @access  Private
// Route: POST /api/bookings/:arenaId/courts/:courtId
router.post("/:arenaId/courts/:courtId", verifyToken, async (req: Request, res: Response) => {
  const { arenaId, courtId } = req.params;
  const { date, startTime, duration, amount } = req.body;

  if (!date || !startTime || !duration) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const startHour = parseInt(startTime.split(":")[0], 10);
    const endHour = startHour + parseInt(duration, 10);

    // Check if the court exists in the arena
    const arena = await Arena.findOne({ _id: arenaId, "courts._id": courtId });
    if (!arena) {
      return res.status(404).json({ message: "Arena or court not found" });
    }

    // Check existing bookings for that court on that date
    const existingBookings = await Booking.find({ date, court: courtId });

    const hasConflict = existingBookings.some((b: any) => {
      const bStart = parseInt(b.startTime.split(":")[0], 10);
      const bEnd = bStart + parseInt(b.duration, 10);
      return (startHour < bEnd && endHour > bStart);
    });

    if (hasConflict) {
      return res.status(409).json({ message: "Court already booked for the selected time range" });
    }

    // Payment processing if required
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

    // Create the booking
    const newBooking = new Booking({
      userId: req.userId,
      date,
      startTime,
      duration,
      court: courtId,
      paymentStatus,
      paymentDetails,
      status: "active",
    });

    await newBooking.save();

    // Attach the booking to the arena
    await Arena.findOneAndUpdate(
      { _id: arenaId, "courts._id": courtId },
      { $push: { bookings: newBooking._id } }
    );

    res.status(201).json(newBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Unable to create booking" });
  }
});

export default router;
