import express, { Request, Response } from "express";
import verifyToken from "../middlewear/auth";

const router = express.Router();

router.get("/dashboard", verifyToken, (req: Request, res: Response) => {
  if (req.userType !== "customer") {
    return res.status(403).send("Access denied.");
  }
  res.send("Welcome to the customer dashboard!");
});

export default router;
