import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart, CreditCard, Heart, PiggyBank } from "lucide-react";
import { Transaction } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { updateCreditScoreFromTransaction } from "@/utils/creditScoreUtils";
import { toast } from "sonner";

const FinancePage = () => {
  const navigate = useNavigate();
  
  const handleFinanceOptionClick = (option: string) => {
    switch(option) {
      case "Check Personal Loan Offers":
        navigate("/finance/personal-loan");
        break;
      case "Apply for Credit Card":
        // Create a credit card application transaction
        const creditCardTransaction: Transaction = {
          id: uuidv4(),
          type: "credit",
          amount: 50000, // Credit limit
          description: "Credit Card Application",
          from: "Pay Swift Bank",
          to: "You",
          date: new Date(),
          status: "pending",
          category: "credit-card",
          productDetails: {
            type: "credit-card",
            name: "Platinum Rewards Credit Card",
            interestRate: "18.5%",
            provider: "Pay Swift Bank"
          }
        };
        updateCreditScoreFromTransaction(creditCardTransaction);
        toast.success("Credit card application submitted", {
          description: "Your application is under review. We'll notify you once it's approved."
        });
        navigate("/credit-score");
        break;
      case "Investment Options":
        // Create an investment application transaction
        const investmentTransaction: Transaction = {
          id: uuidv4(),
          type: "debit",
          amount: 10000,
          description: "Mutual Fund Investment",
          from: "You",
          to: "Growth Plus Fund",
          date: new Date(),
          status: "completed",
          category: "investment",
          productDetails: {
            type: "investment",
            name: "Growth Plus Mutual Fund",
            provider: "Investment Partners"
          }
        };
        updateCreditScoreFromTransaction(investmentTransaction);
        toast.success("Investment successful", {
          description: "Your investment in Growth Plus Mutual Fund has been processed."
        });
        navigate("/credit-score");
        break;
      case "Insurance Plans":
        // Create an insurance application transaction
        const insuranceTransaction: Transaction = {
          id: uuidv4(),
          type: "debit",
          amount: 5000,
          description: "Health Insurance Premium",
          from: "You",
          to: "InsureCo Health",
          date: new Date(),
          status: "completed",
          category: "insurance",
          productDetails: {
            type: "insurance",
            name: "Comprehensive Health Plan",
            term: "1 year",
            provider: "InsureCo"
          }
        };
        updateCreditScoreFromTransaction(insuranceTransaction);
        toast.success("Insurance plan activated", {
          description: "Your health insurance plan is now active."
        });
        navigate("/credit-score");
        break;
      default:
        break;
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="mb-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-2">Finance Options</h1>
        </div>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Explore Financial Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex items-center justify-start gap-2 w-full"
              onClick={() => handleFinanceOptionClick("Check Personal Loan Offers")}
            >
              <PiggyBank className="h-5 w-5 text-primary" />
              <span>Check Personal Loan Offers</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 flex items-center justify-start gap-2 w-full"
              onClick={() => handleFinanceOptionClick("Apply for Credit Card")}
            >
              <CreditCard className="h-5 w-5 text-secondary" />
              <span>Apply for Credit Card</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 flex items-center justify-start gap-2 w-full"
              onClick={() => handleFinanceOptionClick("Investment Options")}
            >
              <BarChart className="h-5 w-5 text-green-600" />
              <span>Investment Options</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 flex items-center justify-start gap-2 w-full"
              onClick={() => handleFinanceOptionClick("Insurance Plans")}
            >
              <Heart className="h-5 w-5 text-red-500" />
              <span>Insurance Plans</span>
            </Button>
          </div>
          <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancePage;
