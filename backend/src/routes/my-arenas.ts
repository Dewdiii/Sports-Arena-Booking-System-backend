import express, { Request, Response } from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import Arena from "../models/ground";
import verifyToken from "../middlewear/auth";
import { body } from "express-validator";
import { ArenaType, AvailableTimeSlot, CourtType } from "../shared/types";
import { log } from "console";
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();


cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

//Create a new Arena
router.post(
  "/",
  verifyToken,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("city").notEmpty().withMessage("City is required"),
    body("address").notEmpty().withMessage("Address is required"),
    body("location").notEmpty().withMessage("Location is required"),
  ],
  upload.array("imageFiles", 6),
  async (req: Request, res: Response) => {
    try {
      const imageFiles = req.files as Express.Multer.File[];
      const newArena: ArenaType = req.body;

      const imageUrls = await uploadImages(imageFiles);

      newArena.imageUrls = imageUrls;
      newArena.lastUpdated = new Date();
      newArena.userId = req.userId;

      const arena = new Arena(newArena);
      await arena.save();

      res.status(201).send(arena);
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

// Add a Court to an Arena
router.post(
  "/:arenaId/courts",
  verifyToken,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("sports").notEmpty().withMessage("Sports is required"),
    body("availableTime").notEmpty().withMessage("Available time is required"),
  ],
  upload.array("imageFiles", 6),
  async (req: Request, res: Response) => {
    try {
      const arenaId = req.params.arenaId;
  let sports: string[], availableTime: AvailableTimeSlot[];
      try {
        sports = JSON.parse(req.body.sports);
        availableTime = JSON.parse(req.body.availableTime);

        if (!Array.isArray(availableTime)) {
          return res.status(400).json({ message: "availableTime must be an array" });
        }

        const isValid = availableTime.every(slot =>
          slot.day && slot.openTime && slot.closeTime
        );

        if (!isValid) {
          return res.status(400).json({ message: "Each time slot must include day, openTime, and closeTime" });
        }

      } catch {
        return res.status(400).json({ message: "sports and availableTime must be valid JSON arrays" });
      }

      // Build the new court object explicitly
      const newCourt: CourtType = {
        name: req.body.name,
        sports,
        availableTime: [],
        description: req.body.description || "",
        pricePerHour: req.body.pricePerHour ? Number(req.body.pricePerHour) : 0,
        type: req.body.type || "",
        imageUrls: [],
        lastUpdated: new Date(),
        userId: req.userId,
      };

      // Upload images if any
      const imageFiles = req.files as Express.Multer.File[] || [];
      if (imageFiles.length > 0) {
        newCourt.imageUrls = await uploadImages(imageFiles);
      }

      // Find arena and add court
      const arena = await Arena.findById(arenaId);
      if (!arena) {
        return res.status(404).json({ message: "Arena not found" });
      }

      arena.courts.push(newCourt as any);
      await arena.save();

      res.status(201).json(arena);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);


// Get all arenas for the authenticated user
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const arenas = await Arena.find({ userId: req.userId });
    res.json(arenas);
  } catch (error) {
    res.status(500).json({ message: "Error fetching arenas" });
  }
});

// Get a specific arena by its ID
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  const id = req.params.id.toString();
  try {
    const arena = await Arena.findOne({
      _id: id,
      userId: req.userId,
    });
    res.json(arena);
  } catch (error) {
    res.status(500).json({ message: "Error fetching arenas" });
  }
});

// Get courts of a specific arena
router.get("/:arenaId/courts", verifyToken, async (req: Request, res: Response) => {
  try {
    const arenaId = req.params.arenaId.toString();
    const arena = await Arena.findOne({ _id: arenaId, userId: req.userId });
    res.json(arena?.courts || []);
  } catch (error) {
    res.status(500).json({ message: "Error fetching courts" });
  }
});

// Update an existing arena and its image files
router.put(
  "/:arenaId",
  verifyToken,
  upload.array("imageFiles"),
  async (req: Request, res: Response) => {
    try {
      const updatedArena: ArenaType = req.body;
      updatedArena.lastUpdated = new Date();

      const arena = await Arena.findOneAndUpdate(
        {
          _id: req.params.arenaId,
          userId: req.userId,
        },
        updatedArena,
        { new: true }
      );

      if (!arena) {
        return res.status(404).json({ message: "Arena not found" });
      }

      const files = req.files as Express.Multer.File[];
      const updatedImageUrls = await uploadImages(files);

      arena.imageUrls = [
        ...updatedImageUrls,
        ...(updatedArena.imageUrls || []),
      ];

      await arena.save();
      res.status(201).json(arena);
    } catch (error) {
      res.status(500).json({ message: "Something went throw" });
    }
  }
);

// Get available time slots for a specific court in a specific arena-empty array
router.get("/:arenaId/courts/:courtId/timeslots", verifyToken, async (req: Request, res: Response) => {
  try {
    const { arenaId, courtId } = req.params;

    const arena = await Arena.findOne({ _id: arenaId, userId: req.userId });
    if (!arena) {
      return res.status(404).json({ message: "Arena not found" });
    }

    const court = arena.courts.find((c: any) => c._id.toString() === courtId);
    if (!court) {
      return res.status(404).json({ message: "Court not found" });
    }

    res.status(200).json({ availableTime: court.availableTime });
  } catch (error) {
    res.status(500).json({ message: "Error fetching time slots" });
  }
});


// Update a specific court of a specific arena
router.put(
  "/:arenaId/courts/:courtId",
  verifyToken,
  upload.array("imageFiles"),
  async (req: Request, res: Response) => {
    try {
      const { arenaId, courtId } = req.params;
      const updatedCourtData: CourtType = req.body;
      const files = req.files as Express.Multer.File[];

      const arena = await Arena.findOne({
        _id: arenaId,
        userId: req.userId,
      });

      if (!arena) {
        return res.status(404).json({ message: "Arena not found" });
      }

      const court = arena.courts.find(
        (c) => c._id.toString() === courtId
      );

      if (!court) {
        return res.status(404).json({ message: "Court not found" });
      }

      // Upload new images if provided
      let newImageUrls: string[] = [];
      if (files && files.length > 0) {
        newImageUrls = await uploadImages(files);
      }

      // Update court fields
      court.name = updatedCourtData.name || court.name;
      court.type = updatedCourtData.type || court.type;
      court.pricePerHour = updatedCourtData.pricePerHour || court.pricePerHour;
      court.description = updatedCourtData.description || court.description;
      court.lastUpdated = new Date();

      // Merge new image URLs with existing ones (optional: limit total count)
      court.imageUrls = [...newImageUrls, ...(updatedCourtData.imageUrls || [])];

      await arena.save();

      res.status(200).json(court);
    } catch (error) {
      console.error("Error updating court:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

// Helper function to upload images to Cloudinary
async function uploadImages(imageFiles: Express.Multer.File[]) {
  const uploadPromises = imageFiles.map(async (image) => {
    const b64 = Buffer.from(image.buffer).toString("base64");
    const dataURI = "data:" + image.mimetype + ";base64," + b64;
    const res = await cloudinary.v2.uploader.upload(dataURI);
    return res.url;
  });

  const imageUrls = await Promise.all(uploadPromises);
  return imageUrls;
}

//Update timeslots for a specific court-not working 
router.patch(
  "/:arenaId/courts/:courtId/timeslots",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { arenaId, courtId } = req.params;
      const { newTimeSlots } = req.body; // Array of new time slots

      if (!Array.isArray(newTimeSlots) || newTimeSlots.length === 0) {
        return res.status(400).json({ message: "newTimeSlots must be a non-empty array" });
      }

      const arena = await Arena.findOne({ _id: arenaId, userId: req.userId });
      if (!arena) {
        return res.status(404).json({ message: "Arena not found" });
      }

      const court = arena.courts.find((c: any) => c._id.toString() === courtId);
      if (!court) {
        return res.status(404).json({ message: "Court not found" });
      }

      // Avoid adding duplicate time slots
      court.availableTime = Array.from(new Set([...court.availableTime, ...newTimeSlots]));
      court.lastUpdated = new Date();

      await arena.save();

      res.status(200).json({ message: "Time slots added successfully", availableTime: court.availableTime });
    } catch (error) {
      res.status(500).json({ message: "Error adding time slots" });
    }
  }
);


//Delete Arena by ID
router.delete("/:arenaId", verifyToken, async (req: Request, res: Response) => {
  try {
    const arena = await Arena.findOneAndDelete({
      _id: req.params.arenaId,
      userId: req.userId,
    });

    if (!arena) {
      return res.status(404).json({ message: "Arena not found" });
    }

    res.status(200).json({ message: "Arena deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting arena" });
  }
});

//Delete Court by Court ID within an Arena
router.delete("/:arenaId/courts/:courtId", verifyToken, async (req: Request, res: Response) => {
  try {
    const arena = await Arena.findOne({
      _id: req.params.arenaId,
      userId: req.userId,
    });

    if (!arena) {
      return res.status(404).json({ message: "Arena not found" });
    }

    const courtIndex = arena.courts.findIndex(
      (court: any) => court._id.toString() === req.params.courtId
    );

    if (courtIndex === -1) {
      return res.status(404).json({ message: "Court not found" });
    }

    arena.courts.splice(courtIndex, 1);
    await arena.save();

    res.status(200).json({ message: "Court deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting court" });
  }
});


export default router;