import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { check, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/user";
import verifyToken from "../middlewear/auth";

const router = express.Router();


// POST /login - User Login
router.post(
  "/login",
  [
    check("email", "Valid email is required").isEmail(),
    check("password", "Password with 6 or more characters is required").isLength({ min: 6 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(400).json({ message: "Invalid email address" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid password" });

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET_KEY as string, {
        expiresIn: "1d",
      });

      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 86400000,
        path: "/",
      });

      res.status(200).json({ userId: user._id });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

// GET /validate-token
router.get("/validate-token", verifyToken, (req: Request, res: Response) => {
  res.status(200).send({ userId: req.userId });
});


// POST /logout
router.post("/logout", (_req: Request, res: Response) => {
  res.cookie("auth_token", "", {
    expires: new Date(0),
    path: "/",
  });
  res.status(200).send({ message: "Logged out successfully" });
});


// POST /forgot-password
router.post("/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "No user with that email" });

  const token = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  const resetUrl = `http://localhost:3000/reset-password/${token}`; // adjust frontend URL

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,    // Replace with App password
    },
  });

  await transporter.sendMail({
    to: user.email,
    subject: "Reset Your Password",
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
  });

  res.status(200).json({ message: "Reset password link sent to email" });
});

// =============================
// POST /reset-password/:token
// =============================
router.post("/reset-password/:token", async (req: Request, res: Response) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ message: "Invalid or expired token" });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.status(200).json({ message: "Password has been reset successfully" });
});

// Get current user info
router.get("/me", verifyToken, async (req: Request, res: Response) => {
    const user = await User.findById(req.userId).select("-password");
    res.status(200).json(user);
  });
  
  // Update current user info
  router.put("/me", verifyToken, async (req: Request, res: Response) => {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select("-password");
    res.status(200).json(user);
  });
  
export default router;
