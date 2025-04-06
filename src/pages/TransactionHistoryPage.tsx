import { Button } from "@/components/ui/button";
import TransactionHistory from "@/components/TransactionHistory";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TransactionHistoryPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto px-4 py-6 min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="mb-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-2">Transaction History</h1>
        </div>
      </header>
      
      <div className="bg-white rounded-xl shadow-md p-5">
        <TransactionHistory />
      </div>
    </div>
  );
};

export default TransactionHistoryPage;
