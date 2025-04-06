export interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  from: string;
  to: string;
  description: string;
  status: "pending" | "completed" | "failed";
  date: Date;
  paymentId?: string;
  category?: string;
  productDetails?: {
    type: string;
    name: string;
    interestRate?: string;
    term?: string;
    provider?: string;
  };
}

export interface PaymentRequest {
  to: string;
  amount: number;
  description: string;
}

export interface CreditScoreData {
  score: number;
  maxScore: number;
  lastUpdated: Date;
  paymentHistory: {
    onTimePayments: number;
    latePayments: number;
    missedPayments: number;
  };
  creditUtilization: number;
  factors: {
    positive: string[];
    negative: string[];
  };
  loanInformation?: {
    activeLoans: number;
    totalLoanAmount: number;
    onTimeLoanPayments: number;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  balance: number;
  creditScore: CreditScoreData;
  walletAddress?: string;
  chainId?: string;
  recentTransactions: Transaction[];
}
