import { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Transaction } from "@/types";
import { getTransactions } from "@/utils/razorpayUtils";

interface TransactionHistoryProps {
  limit?: number;
}

const TransactionHistory = ({ limit }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Get transactions
    const loadedTransactions = getTransactions();
    setTransactions(limit ? loadedTransactions.slice(0, limit) : loadedTransactions);
    
    // Listen for transaction updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "transactions") {
        const updatedTransactions = getTransactions();
        setTransactions(limit ? updatedTransactions.slice(0, limit) : updatedTransactions);
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [limit]);

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
    const now = new Date();
    const transactionDate = new Date(date);
    
    // Today
    if (transactionDate.toDateString() === now.toDateString()) {
      return "Today, " + transactionDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (transactionDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday, " + transactionDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    
    // Older
    return transactionDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }) + ", " + transactionDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{limit ? "Recent Transactions" : "All Transactions"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            No transactions yet
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="transaction-item flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {transaction.type === "credit"
                      ? transaction.from
                      : transaction.to}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {transaction.description}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatDate(transaction.date)}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`font-semibold ${
                      transaction.type === "credit"
                        ? "text-green-600"
                        : ""
                    }`}
                  >
                    {transaction.type === "credit" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </span>
                  <Badge
                    variant={
                      transaction.status === "completed"
                        ? "default"
                        : transaction.status === "pending"
                        ? "outline"
                        : "destructive"
                    }
                    className="mt-1"
                  >
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {limit && transactions.length > 0 && (
          <div className="pt-2">
            <Separator className="mb-2" />
            <div className="text-center">
              <a 
                href="#" 
                className="text-sm text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('[value="history"]')?.dispatchEvent(
                    new MouseEvent("click", { bubbles: true })
                  );
                }}
              >
                View all transactions
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
