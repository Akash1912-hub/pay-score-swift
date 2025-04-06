import { CreditScoreData, Transaction } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Initialize mock credit score data if not already present
export const initializeCreditScoreData = (): CreditScoreData => {
  const defaultCreditScore: CreditScoreData = {
    score: 750,
    maxScore: 900,
    lastUpdated: new Date(),
    paymentHistory: {
      onTimePayments: 24,
      latePayments: 1,
      missedPayments: 0,
    },
    creditUtilization: 30,
    factors: {
      positive: [
        "Long credit history",
        "Regular on-time payments",
        "Diverse credit mix"
      ],
      negative: [
        "High credit utilization"
      ],
    },
    loanInformation: {
      activeLoans: 1,
      totalLoanAmount: 120000,
      onTimeLoanPayments: 24,
    },
  };

  if (!localStorage.getItem("creditScore")) {
    localStorage.setItem("creditScore", JSON.stringify(defaultCreditScore));
  }

  return getCreditScore();
};

// Get credit score data
export const getCreditScore = (): CreditScoreData => {
  const creditScore = localStorage.getItem("creditScore");
  return creditScore ? JSON.parse(creditScore) : initializeCreditScoreData();
};

// Update credit score
export const updateCreditScore = (updates: Partial<CreditScoreData>): CreditScoreData => {
  const currentScore = getCreditScore();
  const updatedScore: CreditScoreData = {
    ...currentScore,
    ...updates,
    lastUpdated: new Date(),
  };
  
  localStorage.setItem("creditScore", JSON.stringify(updatedScore));
  
  // Dispatch storage event to notify other components
  window.dispatchEvent(new StorageEvent("storage", {
    key: "creditScore",
    newValue: JSON.stringify(updatedScore),
  }));
  
  return updatedScore;
};

// Get transactions from localStorage
export const getTransactions = (): Transaction[] => {
  const transactions = localStorage.getItem("transactions");
  return transactions ? JSON.parse(transactions) : [];
};

// Calculate credit score impact based on transaction
export const calculateCreditScoreImpact = (transaction: Transaction): number => {
  // This is a simplified model - in reality, credit score calculation is complex
  
  // Payment history has the biggest impact on credit score
  if (transaction.type === "debit") {
    // Transaction amount relative to balance can affect credit utilization
    const balance = parseFloat(localStorage.getItem("userBalance") || "0");
    const utilizationImpact = balance > 0 ? (transaction.amount / balance) * 10 : 0;
    
    // If it's a bill payment or loan payment, it positively affects score
    if (
      transaction.description.toLowerCase().includes("bill") ||
      transaction.description.toLowerCase().includes("payment") ||
      transaction.description.toLowerCase().includes("loan") ||
      transaction.description.toLowerCase().includes("emi")
    ) {
      return 2 + Math.min(utilizationImpact, 3); // Max +5 points
    }
    
    // Regular spending slightly affects score
    return 1;
  }
  
  // Credit transactions (income) don't directly impact credit score
  return 0;
};

// Update credit score based on transaction
export const updateCreditScoreFromTransaction = (transaction: Transaction): void => {
  const impact = calculateCreditScoreImpact(transaction);
  
  if (impact > 0) {
    const currentScore = getCreditScore();
    let newScore = currentScore.score + impact;
    
    // Cap at max score
    newScore = Math.min(newScore, currentScore.maxScore);
    
    // Update payment history if it's a bill payment
    let updatedPaymentHistory = { ...currentScore.paymentHistory };
    if (
      transaction.type === "debit" && 
      (transaction.description.toLowerCase().includes("bill") || 
       transaction.description.toLowerCase().includes("payment"))
    ) {
      updatedPaymentHistory.onTimePayments += 1;
    }
    
    // Update credit score
    updateCreditScore({
      score: newScore,
      paymentHistory: updatedPaymentHistory,
    });
  }
};
