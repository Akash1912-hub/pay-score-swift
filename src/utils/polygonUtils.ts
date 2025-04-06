import { PaymentRequest } from "@/types";
import { addTransaction } from "./razorpayUtils";
import { v4 as uuidv4 } from "uuid";
import { updateCreditScoreFromTransaction } from "./creditScoreUtils";
import { toast } from "sonner";

const POLYGON_CHAIN_ID = "0x89"; // Mainnet
const MUMBAI_CHAIN_ID = "0x13882"; // Testnet

// Convert MATIC amount to Wei
const toWei = (amount: number): string => {
  // 1 MATIC = 10^18 Wei
  const wei = amount * 1e18;
  return '0x' + Math.floor(wei).toString(16);
};

// Switch to Polygon network
const switchToPolygonNetwork = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed!");
  }
  
  try {
    // Get current chainId
    const chainId = await window.ethereum.request({
      method: "eth_chainId",
    });
    
    // If already on Polygon, return
    if (chainId === POLYGON_CHAIN_ID || chainId === MUMBAI_CHAIN_ID) {
      return;
    }
    
    // Try to switch to Polygon
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MUMBAI_CHAIN_ID }], // Use testnet for safety
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: MUMBAI_CHAIN_ID,
              chainName: "Polygon Mumbai Testnet",
              nativeCurrency: {
                name: "MATIC",
                symbol: "MATIC",
                decimals: 18,
              },
              rpcUrls: ["https://rpc-amoy.polygon.technology/ "],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  } catch (error) {
    console.error("Error switching to Polygon network:", error);
    throw error;
  }
};

// Process payment using Polygon
export const processPolygonTransaction = async (paymentDetails: PaymentRequest): Promise<boolean> => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed!");
  }
  
  try {
    // Switch to Polygon network
    await switchToPolygonNetwork();
    
    // Get accounts
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    }) as string[];
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please connect to MetaMask.");
    }
    
    // Get current gas price
    const gasPrice = await window.ethereum.request({
      method: "eth_gasPrice",
    });
    
    // Convert amount to correct format (MATIC to Wei)
    // For simplicity, we're assuming 1 MATIC = 50 INR
    const maticAmount = paymentDetails.amount / 50;
    const value = toWei(maticAmount);
    
    console.log(`Sending ${maticAmount} MATIC (${paymentDetails.amount} INR)`);
    
    // Prepare transaction parameters
    const transactionParameters = {
      from: accounts[0],
      to: "0xYourPolygonContractOrWalletAddressHere", // Replace with actual receiving address
      value: value,
      gasPrice: gasPrice,
      gas: "0x5208", // 21000 gas limit for standard transfer
    };
    
    // Send transaction
    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [transactionParameters],
    });
    
    console.log("Transaction sent:", txHash);
    
    // Add transaction to history
    const transaction = {
      id: uuidv4(),
      type: "debit" as const,
      amount: paymentDetails.amount,
      from: "You (via Polygon)",
      to: paymentDetails.to,
      description: paymentDetails.description,
      status: "completed" as const,
      date: new Date(),
      paymentId: txHash,
    };
    
    addTransaction(transaction);
    
    // Update credit score
    updateCreditScoreFromTransaction(transaction);
    
    toast.success("Payment successful", {
      description: `Transaction hash: ${txHash.substring(0, 10)}...`,
    });
    
    return true;
  } catch (error: any) {
    console.error("Polygon payment error:", error);
    toast.error("Payment failed", {
      description: error.message || "There was an error processing your payment",
    });
    return false;
  }
};
