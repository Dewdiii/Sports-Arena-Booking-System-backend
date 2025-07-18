import stripe from "./stripe"; // Import the real Stripe client

export const processPayment = async (amount: number) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Stripe uses cents
    currency: "lkr",       // change to your currency
    metadata: {
      purpose: "court booking"
    }
  });

  return {
    status: paymentIntent.status,
    transactionId: paymentIntent.id
  };
};
 