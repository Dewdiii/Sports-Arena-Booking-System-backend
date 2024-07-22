/*import express, { Request, Response } from "express";
import Arena from "../models/ground";
import Booking from "../models/booking";
import { BookingType, ArenaSearchResponse } from "../shared/types";
import { param, validationResult } from "express-validator";
import Stripe from "stripe";
import verifyToken from "../middlewear/auth";

const stripe = new Stripe(process.env.STRIPE_API_KEY as string);
const router = express.Router();

router.get("/search", async (req: Request, res: Response) => {
  try {
    const query = constructSearchQuery(req.query);

    let sortOptions = {};
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
    const pageNumber = parseInt(req.query.page ? req.query.page.toString() : "1");
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

router.get("/", async (req: Request, res: Response) => {
  try {
    const arenas = await Arena.find().sort("-lastUpdated");
    res.json(arenas);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Error fetching arenas" });
  }
});

router.get(
  "/:id",
  [param("id").notEmpty().withMessage("Arena ID is required")],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = req.params.id.toString();

    try {
      const arena = await Arena.findById(id);
      res.json(arena);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error fetching arena" });
    }
  }
);

router.post(
  "/:arenaId/bookings/payment-intent",
  verifyToken,
  async (req: Request, res: Response) => {
    const { duration } = req.body;
    const arenaId = req.params.arenaId;

    const arena = await Arena.findById(arenaId);
    if (!arena) {
      return res.status(400).json({ message: "Arena not found" });
    }

    const totalCost = arena.pricePerHour * duration;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCost * 100,
      currency: "lkr",
      metadata: {
        arenaId,
        userId: req.userId,
      },
    });

    if (!paymentIntent.client_secret) {
      return res.status(500).json({ message: "Error creating payment intent" });
    }

    const response = {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret.toString(),
      totalCost,
    };

    res.send(response);
  }
);

router.post(
  "/:arenaId/bookings",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const paymentIntentId = req.body.paymentIntentId;

      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId as string
      );

      if (!paymentIntent) {
        return res.status(400).json({ message: "payment intent not found" });
      }

      if (
        paymentIntent.metadata.arenaId !== req.params.arenaId ||
        paymentIntent.metadata.userId !== req.userId
      ) {
        return res.status(400).json({ message: "payment intent mismatch" });
      }

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          message: `payment intent not succeeded. Status: ${paymentIntent.status}`,
        });
      }

      const newBooking: BookingType = {
        ...req.body,
        userId: req.userId,
      };

      const arena = await Arena.findOneAndUpdate(
        { _id: req.params.arenaId },
        {
          $push: { bookings: newBooking },
        }
      );

      if (!arena) {
        return res.status(400).json({ message: "arena not found" });
      }

      await arena.save();
      res.status(200).send();
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "something went wrong" });
    }
  }
);

const constructSearchQuery = (queryParams: any) => {
  let constructedQuery: any = {};

  if (queryParams.location) {
    constructedQuery.location = new RegExp(queryParams.location, "i");
  }

  if (queryParams.courtType) {
    constructedQuery.courts = new RegExp(queryParams.courtType, "i");
  }

  if (queryParams.maxPrice) {
    constructedQuery.pricePerHour = {
      $lte: parseInt(queryParams.maxPrice).toString(),
    };
  }

  return constructedQuery;
};

export default router;
*/