import express, { Request, Response } from "express";
import verifyToken from "../middlewear/auth";
import Booking from "../models/booking";
import Arena from "../models/ground";
import { processPayment } from "../utils/payment";

const router = express.Router();

// Get user's bookings
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find({ userId: req.userId });
    res.status(200).send(bookings);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to fetch bookings" });
  }
});

// Create a new booking
router.post("/", verifyToken, async (req: Request, res: Response) => {
  const { date, startTime, duration, court, amount } = req.body;

  try {
    const paymentResult = await processPayment(amount);
    if (paymentResult.status !== "completed") {
      return res.status(400).json({ message: "Payment failed" });
    }

    const newBooking = new Booking({
      userId: req.userId,
      date,
      startTime,
      duration,
      court,
      paymentStatus: "completed",
      paymentDetails: {
        amount,
        transactionId: paymentResult.transactionId,
      },
    });

    await newBooking.save();

    await Arena.updateOne(
      { courts: court },
      { $push: { bookings: newBooking._id } }
    );

    res.status(201).send(newBooking);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to create booking" });
  }
});

export default router;
