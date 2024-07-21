import express, { Request, Response } from "express";
import verifyToken from "../middlewear/auth";

const router = express.Router();

router.get("/dashboard", verifyToken, (req: Request, res: Response) => {
  if (req.userType !== "arena_owner") {
    return res.status(403).send("Access denied.");
  }
  res.send("Welcome to the arena owner dashboard!");
});

export default router;
