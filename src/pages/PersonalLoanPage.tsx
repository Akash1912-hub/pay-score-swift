import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, DollarSign, Info } from "lucide-react";
import { toast } from "sonner";
import { Transaction } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { updateCreditScoreFromTransaction } from "@/utils/creditScoreUtils";

const PersonalLoanPage = () => {
  const navigate = useNavigate();
  
  const handleApplyClick = (loanAmount: string, interestRate: string, term: string = "36 months") => {
    // Create a new transaction for the loan application
    const numericAmount = parseFloat(loanAmount.replace(/[^\d]/g, ''));
    
    const transaction: Transaction = {
      id: uuidv4(),
      type: "credit",
      amount: numericAmount,
      description: `Personal Loan at ${interestRate}%`,
      from: "Pay Swift Bank",
      to: "You",
      date: new Date(),
      status: "completed",
      category: "loan",
      productDetails: {
        type: "personal-loan",
        name: `Personal Loan - ${loanAmount}`,
        interestRate: `${interestRate}%`,
        term: term,
        provider: "Pay Swift Bank"
      }
    };
    
    // Update credit score with the transaction
    updateCreditScoreFromTransaction(transaction);
    
    // Update user balance
    const currentBalance = parseFloat(localStorage.getItem("userBalance") || "5000");
    localStorage.setItem("userBalance", (currentBalance + numericAmount).toFixed(2));
    
    toast.success("Loan application approved", {
      description: `Your loan of ₹${loanAmount} at ${interestRate}% interest rate has been approved and disbursed.`
    });
    
    // Navigate to credit score page to show the impact
    setTimeout(() => {
      navigate("/credit-score");
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="mb-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/finance")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-2">Personal Loan Offers</h1>
        </div>
      </header>
      
      <div className="space-y-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Pre-approved Offer</span>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-baseline">
              <div className="space-y-1">
                <p className="text-2xl font-bold">₹2,00,000</p>
                <p className="text-sm text-muted-foreground">Up to 36 months</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-green-500">10.5%</p>
                <p className="text-sm text-muted-foreground">Interest p.a.</p>
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleApplyClick("2,00,000", "10.5", "36 months")}
            >
              Apply Now
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Instant Personal Loan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-baseline">
              <div className="space-y-1">
                <p className="text-2xl font-bold">₹5,00,000</p>
                <p className="text-sm text-muted-foreground">Up to 60 months</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">12.25%</p>
                <p className="text-sm text-muted-foreground">Interest p.a.</p>
              </div>
            </div>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handleApplyClick("5,00,000", "12.25", "60 months")}
            >
              Check Eligibility
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Education Loan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-baseline">
              <div className="space-y-1">
                <p className="text-2xl font-bold">₹10,00,000</p>
                <p className="text-sm text-muted-foreground">Up to 84 months</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">8.5%</p>
                <p className="text-sm text-muted-foreground">Interest p.a.</p>
              </div>
            </div>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handleApplyClick("10,00,000", "8.5", "84 months")}
            >
              Check Eligibility
            </Button>
          </CardContent>
        </Card>

        <div className="p-4 bg-blue-50 rounded-lg flex items-start">
          <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
          <p className="text-sm text-blue-800">Actual loan amount and interest rate may vary based on your credit score and eligibility. All applications are subject to approval.</p>
        </div>
      </div>
    </div>
  );
};

export default PersonalLoanPage;
