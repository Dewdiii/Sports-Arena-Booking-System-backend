import express, { Request, Response } from 'express';
import cors from 'cors';
import "dotenv/config";
import mongoose from 'mongoose';
import userRoutes from './routes/users';
import authRoutes from './routes/auth';
import myArenaRoutes from './routes/my-arenas';
import customerRoutes from './routes/customer';
import arenaOwnerRoutes from './routes/arena-owner';
import bookingRoutes from "./routes/booking";
import bookingsRoute from "./routes/bookings";
import cookieParser from "cookie-parser";
import {v2 as cloudinary} from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string)

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/my-arenas", myArenaRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/arena-owner", arenaOwnerRoutes);
app.use("/booking", bookingRoutes);
app.use("/bookings", bookingsRoute);

app.listen(7000, ()=> {
    console.log("server running on localhost:7000");
})