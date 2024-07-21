export const processPayment = async (amount: number) => {
    const transactionId = `txn_${Math.random().toString(36).substr(2, 9)}`;
    return { status: "completed", transactionId };
  };
  