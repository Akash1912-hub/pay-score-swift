import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import CreditScore from "@/components/CreditScore";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, History, ChevronRight, DollarSign, CreditCard, AlertTriangle, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell 
} from "@/components/ui/table";
import { getTransactions, initializeCreditScoreData } from "../utils/creditScoreUtils";
import { Transaction } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const CreditScorePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState("history");
  const [financeProducts, setFinanceProducts] = useState<Transaction[]>([]);

  useEffect(() => {
    // Initialize credit score data if needed
    initializeCreditScoreData();
    
    try {
      const savedTransactions = getTransactions();
      setTransactions(savedTransactions);
      
      // Filter out finance product transactions
      const products = savedTransactions.filter(
        t => t.productDetails || t.description.toLowerCase().includes("loan")
      );
      setFinanceProducts(products);
    } catch (error) {
      console.error("Error loading transaction data:", error);
    } finally {
      setIsLoading(false);
    }
    
    // Listen for transaction updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "transactions") {
        try {
          const updatedTransactions = getTransactions();
          setTransactions(updatedTransactions);
          
          const products = updatedTransactions.filter(
            t => t.productDetails || t.description.toLowerCase().includes("loan")
          );
          setFinanceProducts(products);
        } catch (error) {
          console.error("Error processing storage change:", error);
        }
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  
  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Group finance products by type
  const groupedProducts = useMemo(() => {
    return financeProducts.reduce((acc, product) => {
      const type = product.productDetails?.type || 
                   (product.description.toLowerCase().includes("loan") ? "personal-loan" : "other");
      
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(product);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [financeProducts]);

  // Calculate metrics for loan tab
  const loanMetrics = useMemo(() => {
    const loanTransactions = transactions.filter(
      txn => txn.description.toLowerCase().includes("loan")
    );
    
    const totalDisbursed = loanTransactions
      .filter(txn => txn.type === "credit")
      .reduce((sum, txn) => sum + txn.amount, 0);
      
    const totalRepaid = loanTransactions
      .filter(txn => txn.type === "debit")
      .reduce((sum, txn) => sum + txn.amount, 0);
      
    const activeLoans = new Set(
      loanTransactions
        .filter(txn => txn.type === "credit")
        .map(txn => txn.description)
    ).size;
    
    return {
      totalDisbursed,
      totalRepaid,
      activeLoans,
      outstandingAmount: Math.max(0, totalDisbursed - totalRepaid)
    };
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <header className="mb-6">
          <div className="flex items-center mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold ml-2">Credit Score</h1>
          </div>
        </header>
        
        <div className="animate-pulse space-y-6">
          <div className="bg-white rounded-xl shadow-md p-5 h-96"></div>
          <div className="h-10 bg-slate-200 rounded"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="mb-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-2">Credit Score</h1>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-md p-5 mb-6 animate-fade-in">
        <CreditScore />
      </div>

      <Tabs 
        defaultValue="history" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full animate-fade-in"
      >
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="history" className="flex items-center gap-1 text-xs">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="impact" className="flex items-center gap-1 text-xs">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Score Impact</span>
          </TabsTrigger>
          <TabsTrigger value="loans" className="flex items-center gap-1 text-xs">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Loans</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-1 text-xs">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="history">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>Transaction History</span>
                <Button variant="ghost" size="sm" className="text-xs px-2" onClick={() => navigate("/history")}>
                  View All <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </CardTitle>
              <CardDescription>Recent financial activities</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="overflow-auto max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((txn) => (
                        <TableRow key={txn.id} className="hover:bg-gray-50">
                          <TableCell className="text-xs text-gray-500">
                            {formatDate(new Date(txn.date))}
                          </TableCell>
                          <TableCell className="font-medium">
                            {txn.description}
                            <div className="text-xs text-gray-500">
                              {txn.type === "credit" ? "From: " + (txn.from || "Unknown") : "To: " + (txn.to || "Unknown")}
                            </div>
                          </TableCell>
                          <TableCell className={`font-bold ${txn.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                            {txn.type === "credit" ? "+" : "-"}{formatCurrency(txn.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                txn.status === "completed" ? "default" : 
                                txn.status === "pending" ? "outline" : "destructive"
                              }
                              className="text-xs"
                            >
                              {txn.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No transactions found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="impact">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Score Impact Analysis</CardTitle>
              <CardDescription>How transactions affect your score</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium text-green-700 mb-1">Positive Impact</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="h-4 w-4 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                        <span>On-time payments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-4 w-4 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                        <span>Low credit utilization</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-4 w-4 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                        <span>Regular loan repayments</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="bg-red-50">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium text-red-700 mb-1">Negative Impact</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="h-4 w-4 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                        <span>Late payments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-4 w-4 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                        <span>High credit utilization</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-4 w-4 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                        <span>Multiple new loans</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              <div className="border p-4 rounded-lg bg-blue-50">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Recent Score Changes</h3>
                {transactions.length > 0 ? (
                  <div className="space-y-2">
                    {transactions.slice(0, 3).map((txn) => {
                      // Determine score impact
                      let impact = "0";
                      let impactClass = "text-gray-500";
                      
                      if (txn.status === "completed") {
                        if (txn.description.toLowerCase().includes("loan")) {
                          if (txn.type === "credit") {
                            impact = "-2 to -5";
                            impactClass = "text-red-500";
                          } else {
                            impact = "+2 to +8";
                            impactClass = "text-green-600";
                          }
                        } else if (txn.type === "debit") {
                          impact = "+1 to +5";
                          impactClass = "text-green-600";
                        } else {
                          impact = "+0 to +1";
                          impactClass = "text-green-600";
                        }
                      }
                      
                      return (
                        <div key={txn.id} className="flex justify-between items-center text-sm border-b pb-2">
                          <div>
                            <span className="font-medium">{txn.description}</span>
                            <div className="text-xs text-gray-500">{formatDate(new Date(txn.date))}</div>
                          </div>
                          <div className="text-right">
                            <span className={txn.status === "completed" ? impactClass : "text-gray-500"}>
                              {txn.status === "completed" ? impact + " points" : "pending"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-2">No recent changes</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="loans">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Loan Overview</CardTitle>
              <CardDescription>Your loan activity and repayment history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border p-4 bg-blue-50">
                  <div className="text-sm text-blue-800 font-medium mb-1">Active Loans</div>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-blue-900">{loanMetrics.activeLoans}</span>
                  </div>
                </Card>
                
                <Card className="border p-4 bg-amber-50">
                  <div className="text-sm text-amber-800 font-medium mb-1">Outstanding Amount</div>
                  <div className="text-lg font-bold text-amber-900">
                    {formatCurrency(loanMetrics.outstandingAmount)}
                  </div>
                </Card>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Loan Activity</h3>
                
                {transactions.filter(txn => txn.description.toLowerCase().includes("loan")).length > 0 ? (
                  <div className="space-y-3 mt-3">
                    {transactions
                      .filter(txn => txn.description.toLowerCase().includes("loan"))
                      .slice(0, 5)
                      .map((txn) => (
                        <div key={txn.id} className="flex justify-between items-center border rounded-lg p-3 hover:bg-gray-50">
                          <div>
                            <div className="font-medium text-sm">{txn.description}</div>
                            <div className="text-xs text-gray-500">{formatDate(new Date(txn.date))}</div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${txn.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                              {txn.type === "credit" ? "+" : "-"}{formatCurrency(txn.amount)}
                            </div>
                            <Badge
                              variant={
                                txn.type === "credit" ? "default" : 
                                txn.status === "completed" ? "outline" : "destructive"
                              }
                              className={`mt-1 ${txn.type === "credit" ? "bg-blue-500" : ""}`}
                            >
                              {txn.type === "credit" ? "Disbursement" : "Repayment"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      
                    <div className="flex justify-center mt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => setActiveTab("history")}
                      >
                        View all transactions
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 text-center">
                    <AlertTriangle className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-muted-foreground">No loan activity found</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => navigate("/finance/personal-loan")}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Explore loan options
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800 mt-4">
                <p>Your loan repayment behavior has a significant impact on your credit score. Regular, on-time payments can improve your score by 2-8 points each time.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Financial Products</CardTitle>
              <CardDescription>Your active financial products and applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(groupedProducts).length > 0 ? (
                Object.entries(groupedProducts).map(([type, products]) => (
                  <div key={type} className="space-y-3">
                    <h3 className="text-sm font-medium capitalize flex items-center gap-2">
                      {type === 'personal-loan' && <DollarSign className="h-4 w-4 text-green-600" />}
                      {type === 'credit-card' && <CreditCard className="h-4 w-4 text-purple-600" />}
                      {type !== 'personal-loan' && type !== 'credit-card' && <Receipt className="h-4 w-4 text-blue-600" />}
                      {type.replace(/-/g, ' ')}
                    </h3>
                    
                    <div className="space-y-2">
                      {products.map((product) => (
                        <div 
                          key={product.id} 
                          className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium">{product.productDetails?.name || product.description}</div>
                              <div className="text-xs text-gray-500">Applied on {formatDate(new Date(product.date))}</div>
                              
                              {(product.productDetails?.interestRate || product.description.includes('%')) && (
                                <div className="text-xs mt-1 text-green-600 font-medium">
                                  Interest: {product.productDetails?.interestRate || product.description.match(/\d+\.?\d*%/)?.[0] || 'N/A'}
                                </div>
                              )}
                              
                              {product.productDetails?.term && (
                                <div className="text-xs text-blue-600 font-medium">
                                  Term: {product.productDetails.term}
                                </div>
                              )}
                              
                              {product.productDetails?.provider && (
                                <div className="text-xs text-gray-600">
                                  Provider: {product.productDetails.provider}
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right">
                              <div className="font-bold">{formatCurrency(product.amount)}</div>
                              <Badge 
                                variant={product.status === 'completed' ? 'default' : 
                                        product.status === 'pending' ? 'outline' : 'destructive'}
                                className="mt-1"
                              >
                                {product.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-2" />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <Receipt className="h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-500">No financial products found</h3>
                  <p className="text-sm text-gray-400 mb-4">You haven't applied for any loans or financial products yet.</p>
                  <Button variant="outline" onClick={() => navigate('/finance')}>
                    Explore Financial Products
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreditScorePage;
