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
  
  export interface CourtType {
    name: string;
    sports: string[];
    availableTime: {
      day: string;
      openTime: string;
      closeTime: string;
    }[];
    imageUrls?: string[];
    lastUpdated?: Date;
    userId: string;
  }
  
  
  export type BookingType = {
    userId: string;
    date: Date;
    startTime: string;
    duration: number;
    court: string;
    paymentStatus: "pending" | "completed";
    paymentDetails: {
      amount: number;
      transactionId: string;
    };
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