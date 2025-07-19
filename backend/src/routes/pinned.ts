import express, { Request, Response } from "express";
import verifyToken from "../middlewear/auth";
import PinnedArena from "../models/pinned-arena";
import Arena from "../models/ground";

const router = express.Router();

//no bugs

// Pin an arena
router.post("/:arenaId", verifyToken, async (req: Request, res: Response) => {
  const { arenaId } = req.params;

  try {
    const existing = await PinnedArena.findOne({ userId: req.userId, arenaId });
    if (existing) {
      return res.status(409).json({ message: "Already pinned" });
    }

    const pin = new PinnedArena({ userId: req.userId, arenaId });
    await pin.save();
    res.status(201).json(pin);
  } catch (error) {
    console.error("Error pinning arena:", error);
    res.status(500).json({ message: "Failed to pin arena" });
  }
});

// Get pinned arenas for a user
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const pinned = await PinnedArena.find({ userId: req.userId }).sort({ pinnedAt: -1 });
    const arenaIds = pinned.map(p => p.arenaId);
    const arenas = await Arena.find({ _id: { $in: arenaIds } });

    // Sort arenas based on pinned order
    const sortedArenas = arenaIds.map(id =>
        arenas.find((a: any) => a._id.toString() === id.toString())
      );
    res.status(200).json(sortedArenas);
  } catch (error) {
    console.error("Error getting pinned arenas:", error);
    res.status(500).json({ message: "Failed to load pinned arenas" });
  }
});

export default router;
