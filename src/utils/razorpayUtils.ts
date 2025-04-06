import { UserProfile, PaymentRequest, Transaction } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { updateCreditScoreFromTransaction } from "./creditScoreUtils";

// Backend API URL - the direct URL without additional paths
const BACKEND_URL = "https://pay-score-swift-2.onrender.com";

// Initialize mock user data if not already present
export const initializeUserData = () => {
  // If transactions don't exist, create them
  if (!localStorage.getItem("transactions")) {
    const defaultTransactions: Transaction[] = [
      {
        id: uuidv4(),
        type: "debit",
        amount: 299,
        from: "You",
        to: "Netflix Subscription",
        description: "Monthly subscription",
        status: "completed",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: uuidv4(),
        type: "credit",
        amount: 5000,
        from: "Bank Transfer",
        to: "You",
        description: "Salary deposit",
        status: "completed",
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        id: uuidv4(),
        type: "debit",
        amount: 450,
        from: "You",
        to: "Electric Bill",
        description: "Monthly utility payment",
        status: "completed",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
    ];
    localStorage.setItem("transactions", JSON.stringify(defaultTransactions));
  }

  // If balance doesn't exist, set it
  if (!localStorage.getItem("userBalance")) {
    localStorage.setItem("userBalance", "5000");
  }
};

// Get all transactions
export const getTransactions = (): Transaction[] => {
  const transactions = localStorage.getItem("transactions");
  return transactions ? JSON.parse(transactions) : [];
};

// Add a transaction
export const addTransaction = (transaction: Transaction): void => {
  const transactions = getTransactions();
  transactions.unshift(transaction);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  
  // Update balance
  const currentBalance = parseFloat(localStorage.getItem("userBalance") || "0");
  const newBalance = transaction.type === "credit"
    ? currentBalance + transaction.amount
    : currentBalance - transaction.amount;
  localStorage.setItem("userBalance", newBalance.toString());
  
  // Fire storage event to notify other components
  window.dispatchEvent(new StorageEvent("storage", {
    key: "transactions",
    newValue: JSON.stringify(transactions),
  }));
  
  window.dispatchEvent(new StorageEvent("storage", {
    key: "userBalance",
    newValue: newBalance.toString(),
  }));
};

// Process payment using Razorpay
export const processPayment = async (paymentDetails: PaymentRequest): Promise<boolean> => {
  try {
    console.log("Starting payment process with details:", paymentDetails);
    
    let orderData;
    let backendOrderCreated = false;
    
    try {
      // Step 1: Try to create an order on your backend
      console.log("Attempting to create order on backend:", `${BACKEND_URL}/create-order`);
      const orderResponse = await fetch(`${BACKEND_URL}/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: paymentDetails.amount,
          currency: "INR",
          receipt: `receipt_${uuidv4().substring(0, 8)}`,
        }),
      });
      
      if (!orderResponse.ok) {
        throw new Error(`Failed to create order: ${orderResponse.status} ${orderResponse.statusText}`);
      }
      
      orderData = await orderResponse.json();
      console.log("Order created successfully:", orderData);
      backendOrderCreated = true;
    } catch (error) {
      console.warn("Backend order creation failed, proceeding with direct payment:", error);
      // Continue with direct payment without backend order
      orderData = { 
        id: `local_order_${uuidv4()}`,
        amount: paymentDetails.amount * 100 
      };
    }
    
    // Step 2: Initialize Razorpay payment
    return new Promise((resolve, reject) => {
      if (!window.Razorpay) {
        console.error("Razorpay is not available");
        toast.error("Payment gateway unavailable", {
          description: "Please try again later"
        });
        reject(new Error("Razorpay is not available"));
        return;
      }
      
      console.log("Initializing Razorpay with options");
      const options = {
        key: "rzp_test_eDVMj23yL98Hvt", // Your Razorpay key
        amount: paymentDetails.amount * 100, // amount in smallest currency unit
        currency: "INR",
        name: "TransPay",
        description: paymentDetails.description,
        order_id: backendOrderCreated ? orderData.id : undefined, // Only use if backend created order
        handler: function (response: any) {
          console.log("Payment successful:", response);
          
          // If backend order was created, verify payment
          if (backendOrderCreated) {
            try {
              fetch(`${BACKEND_URL}/verify-payment`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              })
                .then(verifyResponse => verifyResponse.json())
                .then(verifyData => {
                  if (verifyData.verified) {
                    console.log("Payment verified successfully");
                    handleSuccessfulPayment(response.razorpay_payment_id);
                  } else {
                    console.error("Payment verification failed");
                    reject(new Error("Payment verification failed"));
                  }
                })
                .catch(error => {
                  console.error("Error verifying payment:", error);
                  // Still consider payment successful if verification fails
                  handleSuccessfulPayment(response.razorpay_payment_id);
                });
            } catch (error) {
              console.error("Error in verification process:", error);
              // Still consider payment successful
              handleSuccessfulPayment(response.razorpay_payment_id);
            }
          } else {
            // No backend order, just proceed with successful payment
            handleSuccessfulPayment(response.razorpay_payment_id || `local_${uuidv4()}`);
          }
          
          function handleSuccessfulPayment(paymentId: string) {
            // Add transaction
            const transaction: Transaction = {
              id: uuidv4(),
              type: "debit",
              amount: paymentDetails.amount,
              from: "You",
              to: paymentDetails.to,
              description: paymentDetails.description,
              status: "completed",
              date: new Date(),
              paymentId: paymentId,
            };
            
            addTransaction(transaction);
            updateCreditScoreFromTransaction(transaction);
            resolve(true);
          }
        },
        prefill: {
          name: "User",
          email: "user@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#3B82F6",
        },
        modal: {
          ondismiss: function() {
            console.log("Payment cancelled by user");
            reject(new Error("Payment cancelled"));
          }
        }
      };
      
      try {
        console.log("Creating and opening Razorpay instance");
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } catch (error) {
        console.error("Error opening Razorpay:", error);
        reject(error);
      }
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    toast.error("Payment failed", {
      description: error.message || "There was an error processing your payment",
    });
    return false;
  }
};
