import express, { Request, Response } from "express";
import verifyToken from "../middlewear/auth";
import Booking from "../models/booking";
import Arena from "../models/ground"; // assuming your arena model is here

//bug-access denied
const router = express.Router();

router.get("/dashboard", verifyToken, async (req: Request, res: Response) => {
  if (req.userType !== "arena_owner") {
    return res.status(403).send("Access denied.");
  }

  try {
    // Step 1: Find all arenas owned by the current user
    const arenas = await Arena.find({ owner: req.userId });
    const courtIds = arenas.flatMap((arena: any) =>
      arena.courts.map((court: any) => court._id.toString())
    );

    // Step 2: Find today's date boundaries
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Step 3: Query bookings for today that belong to courts owned by the user
    const todayBookings = await Booking.find({
      court: { $in: courtIds },
      date: {
        $gte: todayStart,
        $lte: todayEnd,
      },
    });

    // Step 4: Calculate number of bookings and total earnings
    const numberOfBookings = todayBookings.length;
    const totalEarnings = todayBookings.reduce((sum, booking) => {
      if (
        booking.paymentStatus === "completed" &&
        booking.paymentDetails?.amount
      ) {
        return sum + booking.paymentDetails.amount;
      }
      return sum;
    }, 0);

    res.status(200).json({
      earnings: totalEarnings,
      bookingsToday: numberOfBookings,
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).json({ message: "Failed to load dashboard data" });
  }
});

export default router;

