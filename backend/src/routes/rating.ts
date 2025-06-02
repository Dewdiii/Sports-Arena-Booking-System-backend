import express, { Request, Response } from "express";
import verifyToken from "../middlewear/auth";
import Rating from "../models/rating";

const router = express.Router();

// Add rating/review
router.post("/", verifyToken, async (req: Request, res: Response) => {
  const { arenaId, sportType, rating, review } = req.body;

  try {
    const newRating = new Rating({
      userId: req.userId,
      arenaId,
      sportType,
      rating,
      review,
    });

    await newRating.save();
    res.status(201).json(newRating);
  } catch (error) {
    console.error("Error adding rating:", error);
    res.status(500).json({ message: "Failed to add rating" });
  }
});

// View all ratings/reviews for an arena and sport
router.get("/:arenaId/:sportType", async (req: Request, res: Response) => {
  const { arenaId, sportType } = req.params;

  try {
    const ratings = await Rating.find({ arenaId, sportType }).populate("userId", "name");
    res.status(200).json(ratings);
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ message: "Failed to get ratings" });
  }
});

export default router;
