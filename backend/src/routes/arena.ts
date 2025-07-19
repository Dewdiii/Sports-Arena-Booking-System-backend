import express, { Request, Response } from "express";
import Arena from "../models/ground";
import Booking from "../models/booking";
import { BookingType, ArenaSearchResponse } from "../shared/types";
import { param, validationResult } from "express-validator";
import Stripe from "stripe";
import verifyToken from "../middlewear/auth";

//no bugs 

const router = express.Router();

/**
 * GET /search
 * Search arenas with optional filters and pagination
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const query = constructSearchQuery(req.query);

    // Sort options based on query
    let sortOptions: any = {};
    switch (req.query.sortOption) {
      case "rating":
        sortOptions = { rating: -1 };
        break;
      case "priceAsc":
        sortOptions = { pricePerHour: 1 };
        break;
      case "priceDesc":
        sortOptions = { pricePerHour: -1 };
        break;
    }

    const pageSize = 5;
    const pageNumber = parseInt(req.query.page?.toString() || "1");
    const skip = (pageNumber - 1) * pageSize;

    const arenas = await Arena.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    const total = await Arena.countDocuments(query);

    const response: ArenaSearchResponse = {
      data: arenas,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
      },
    };

    res.json(response);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

/**
 * GET /
 * Fetch all arenas
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const arenas = await Arena.find().sort("-lastUpdated");
    res.json(arenas);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Error fetching arenas" });
  }
});

/**
 * GET /:id
 * Get a specific arena by ID with validation
 */
router.get(
  "/:id",
  [param("id").notEmpty().withMessage("Arena ID is required")],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const arena = await Arena.findById(req.params.id);
      if (!arena) {
        return res.status(404).json({ message: "Arena not found" });
      }

      res.json(arena);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error fetching arena" });
    }
  }
);

/**
 * Helper: Construct query for arena search
 */
const constructSearchQuery = (queryParams: any) => {
  const constructedQuery: any = {};

  if (queryParams.location) {
    constructedQuery.location = new RegExp(queryParams.location, "i");
  }

  if (queryParams.courtType) {
    constructedQuery["courts.type"] = new RegExp(queryParams.courtType, "i");
  }

  if (queryParams.maxPrice) {
    constructedQuery.pricePerHour = {
      $lte: parseFloat(queryParams.maxPrice),
    };
  }

  return constructedQuery;
};

export default router;
