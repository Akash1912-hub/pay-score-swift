import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditScoreData, Transaction } from "@/types";
import { getCreditScore, getTransactions } from "@/utils/creditScoreUtils";
import { TrendingUp, Clock, AlertTriangle, CheckCircle, AlertCircle, DollarSign, CreditCard } from "lucide-react";

const CreditScore = () => {
  const [creditScore, setCreditScore] = useState<CreditScoreData | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [financeProducts, setFinanceProducts] = useState<Transaction[]>([]);

  useEffect(() => {
    // Get credit score data
    const score = getCreditScore();
    setCreditScore(score);
    
    // Get financial products from transactions
    const transactions = getTransactions();
    const products = transactions.filter(
      t => t.productDetails && t.status !== 'failed'
    );
    setFinanceProducts(products);
    
    // Listen for credit score updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "creditScore") {
        const updatedScore = getCreditScore();
        setCreditScore(prevScore => {
          if (prevScore && updatedScore.score !== prevScore.score) {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 2000);
          }
          return updatedScore;
        });
      }
      
      if (e.key === "transactions") {
        const transactions = getTransactions();
        const products = transactions.filter(
          t => t.productDetails && t.status !== 'failed'
        );
        setFinanceProducts(products);
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  if (!creditScore) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 rounded w-3/4 mx-auto"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate score percentage for progress bar
  const scorePercentage = (creditScore.score / creditScore.maxScore) * 100;
  
  // Determine score rating
  const getScoreRating = (score: number) => {
    if (score >= 750) return { text: "Excellent", color: "bg-green-500", textColor: "text-green-600" };
    if (score >= 700) return { text: "Good", color: "bg-emerald-500", textColor: "text-emerald-600" };
    if (score >= 650) return { text: "Fair", color: "bg-yellow-500", textColor: "text-yellow-600" };
    if (score >= 600) return { text: "Poor", color: "bg-orange-500", textColor: "text-orange-600" };
    return { text: "Very Poor", color: "bg-red-500", textColor: "text-red-600" };
  };
  
  const scoreRating = getScoreRating(creditScore.score);
  
  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Group finance products by type
  const groupedProducts = financeProducts.reduce((acc, product) => {
    if (product.productDetails) {
      const type = product.productDetails.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(product);
    }
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-2 border-primary/20">
        <div className={`absolute inset-0 bg-primary/5 ${isAnimating ? 'animate-pulse' : ''}`}></div>
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Your Credit Score
            </span>
            <Badge className={scoreRating.color + " text-white"}>
              {scoreRating.text}
            </Badge>
          </CardTitle>
          <CardDescription>
            Updated on {formatDate(creditScore.lastUpdated)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-8 text-center">
            <div className="relative pt-2 pb-8">
              <Progress 
                value={scorePercentage} 
                className="h-4 w-full" 
              />
              <div className={`text-4xl font-bold mt-4 ${isAnimating ? 'animate-scale-in' : ''} ${scoreRating.textColor}`}>
                {creditScore.score}
                <span className="text-sm text-muted-foreground font-normal ml-2">
                  of {creditScore.maxScore}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                Payment History
              </h3>
              <p className="text-lg font-bold">{creditScore.paymentHistory.onTimePayments} on-time</p>
              {creditScore.paymentHistory.latePayments > 0 && (
                <p className="text-sm text-orange-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {creditScore.paymentHistory.latePayments} late
                </p>
              )}
              {creditScore.paymentHistory.missedPayments > 0 && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {creditScore.paymentHistory.missedPayments} missed
                </p>
              )}
            </div>
            <div className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-1 text-blue-500" />
                Credit Utilization
              </h3>
              <p className="text-lg font-bold">{creditScore.creditUtilization.toFixed(1)}%</p>
              <Progress 
                value={creditScore.creditUtilization} 
                className="h-2 mt-2" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                {creditScore.creditUtilization < 30 
                  ? "Good - Below 30%" 
                  : creditScore.creditUtilization < 50 
                    ? "Fair - Below 50%" 
                    : "High - Consider reducing"}
              </p>
            </div>
          </div>

          {creditScore.loanInformation && (
            <div className="mb-6">
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Loan Status
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-blue-700">Active Loans</p>
                    <p className="text-lg font-bold">{creditScore.loanInformation.activeLoans}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700">On-time Payments</p>
                    <p className="text-lg font-bold">{creditScore.loanInformation.onTimeLoanPayments}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator className="my-4" />
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-green-600 mb-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Positive Factors
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {creditScore.factors.positive.map((factor, index) => (
                  <div key={index} className="text-sm flex items-center gap-2 p-2 bg-green-50 rounded-md">
                    <span className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {creditScore.factors.negative.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-red-600 mb-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Areas for Improvement
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {creditScore.factors.negative.map((factor, index) => (
                    <div key={index} className="text-sm flex items-center gap-2 p-2 bg-red-50 rounded-md">
                      <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {Object.keys(groupedProducts).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Your Financial Products
            </CardTitle>
            <CardDescription>
              Active loans and financial services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(groupedProducts).map(([type, products]) => (
              <div key={type} className="space-y-2">
                <h3 className="text-sm font-medium capitalize">
                  {type.replace(/-/g, ' ')}
                </h3>
                {products.map((product) => (
                  <div 
                    key={product.id} 
                    className="border rounded-lg p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {product.productDetails?.name || product.description}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Applied on {formatDate(new Date(product.date))}
                        </div>
                        {product.productDetails?.interestRate && (
                          <div className="text-xs mt-1 text-green-600">
                            Interest: {product.productDetails.interestRate}
                          </div>
                        )}
                        {product.productDetails?.term && (
                          <div className="text-xs text-blue-600">
                            Term: {product.productDetails.term}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0
                        }).format(product.amount)}</div>
                        <Badge className="mt-1">{product.status}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">How Credit Score Works</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your credit score is calculated based on your payment history, 
            credit utilization, length of credit history, and recent activity. 
            Making payments on time and keeping your credit utilization low 
            will help improve your score over time.
          </p>
          <div className="grid grid-cols-4 gap-2 mt-4 text-center text-xs">
            <div className="p-2 bg-primary/10 rounded-lg">
              <div className="font-medium mb-1">Payment History</div>
              <div className="text-muted-foreground">35%</div>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <div className="font-medium mb-1">Credit Usage</div>
              <div className="text-muted-foreground">30%</div>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <div className="font-medium mb-1">Loan Activity</div>
              <div className="text-muted-foreground">20%</div>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <div className="font-medium mb-1">Credit Age</div>
              <div className="text-muted-foreground">15%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditScore;
