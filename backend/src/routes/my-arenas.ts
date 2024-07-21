import express, { Request, Response } from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import Arena from "../models/ground";
import verifyToken from "../middlewear/auth";
import { body } from "express-validator";
import { ArenaType, CourtType } from "../shared/types";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

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


router.post(
  "/:arenaId/courts",
  verifyToken,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("sports")
      .notEmpty()
      .isArray()
      .withMessage("Sports are required"),
    body("availableTime")
      .notEmpty()
      .isArray()
      .withMessage("Available time is required"),
  ],
  upload.array("imageFiles", 6),
  async (req: Request, res: Response) => {
    try {
      const arenaId = req.params.arenaId.toString();
      const newCourt: CourtType = req.body;

      const imageFiles = req.files as Express.Multer.File[];
      const imageUrls = await uploadImages(imageFiles);
      newCourt.imageUrls = imageUrls;
      newCourt.lastUpdated = new Date();
      newCourt.userId = req.userId;

      const arena = await Arena.findById(arenaId);
      if (!arena) {
        return res.status(404).json({ message: "Arena not found" });
      }

      arena.courts.push(newCourt as any); // Type casting to bypass TypeScript issue
      await arena.save();

      res.status(201).send(arena);
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const arenas = await Arena.find({ userId: req.userId });
    res.json(arenas);
  } catch (error) {
    res.status(500).json({ message: "Error fetching arenas" });
  }
});

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

router.get("/:arenaId/courts", verifyToken, async (req: Request, res: Response) => {
  try {
    const arenaId = req.params.arenaId.toString();
    const courts = await Arena.find({ arenaId, userId: req.userId });
    res.json(courts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching courts" });
  }
});

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

router.put(
  "/:arenaId/courts/:courtId",
  verifyToken,
  upload.array("imageFiles"),
  async (req: Request, res: Response) => {
    try {
      const updatedCourt: CourtType = req.body;
      updatedCourt.lastUpdated = new Date();

      const court = await Arena.findOneAndUpdate(
        {
          _id: req.params.courtId,
          userId: req.userId,
        },
        updatedCourt,
        { new: true }
      );

      if (!court) {
        return res.status(404).json({ message: "Court not found" });
      }

      const files = req.files as Express.Multer.File[];
      const updatedImageUrls = await uploadImages(files);

      court.imageUrls = [
        ...updatedImageUrls,
        ...(updatedCourt.imageUrls || []),
      ];

      await court.save();
      res.status(201).json(court);
    } catch (error) {
      res.status(500).json({ message: "Something went throw" });
    }
  }
);

async function uploadImages(imageFiles: Express.Multer.File[]) {
  const uploadPromises = imageFiles.map(async (image) => {
    const b64 = Buffer.from(image.buffer).toString("base64");
    let dataURI = "data:" + image.mimetype + ";base64," + b64;
    const res = await cloudinary.v2.uploader.upload(dataURI);
    return res.url;
  });

  const imageUrls = await Promise.all(uploadPromises);
  return imageUrls;
}

export default router;