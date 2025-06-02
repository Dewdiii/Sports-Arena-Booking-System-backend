import mongoose from "mongoose";

export type UserType = {
    _id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    mobile: string;
    stateProvince: string;
    zipCode: string;
    userType: "customer" | "arena_owner";
    resetPasswordToken: string | null;
    resetPasswordExpires: number | null;


  };
  
  export interface ArenaType {
    name: string;
    city: string;
    address: string;
    location: string;
    imageUrls?: string[];
    lastUpdated?: Date;
    userId: string;
    pricePerHour: number;
    courts?: CourtType[];
  }

  export interface AvailableTimeSlot {
    day: string;
    openTime: string;
    closeTime: string;
  }
  
  export interface CourtType {
    _id?: mongoose.Types.ObjectId;
    name: string;
    type: string;
    sports: string[];
    pricePerHour: number;
    description: string;
    availableTime: AvailableTimeSlot[];
    imageUrls: string[];
    lastUpdated?: Date;
    userId: string;
  }
  
  
  export type BookingType = {
    userId: string;
    date: Date;
    startTime: string;
    duration: number;
    court: string;
    status: "active" | "cancelled" | "completed";
    paymentStatus: "completed" |"pending"| "not_required";
    paymentDetails: {
      amount: number;
    transactionId: string;
  } | null;
  
};
  
  export type ArenaSearchResponse = {
    data: ArenaType[];
    pagination: {
      total: number;
      page: number;
      pages: number;
    };
  };
  
  export type PaymentIntentResponse = {
    paymentIntentId: string;
    clientSecret: string;
    totalCost: number;
  };

  export interface Rating {
    userId: string;
    arenaId: string;
    sportType: string;
    rating: number; // 1 to 5
    review?: string;
    createdAt?: Date;
  }
  
  export interface PinnedArena {
    userId: string;
    arenaId: string;
    pinnedAt?: string;
  }
  