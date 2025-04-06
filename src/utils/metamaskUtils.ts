import { PaymentRequest } from "@/types";
import { addTransaction } from "./razorpayUtils";
import { v4 as uuidv4 } from "uuid";
import { updateCreditScoreFromTransaction } from "./creditScoreUtils";
import { toast } from "sonner";

// Convert ETH amount to Wei
const toWei = (amount: number): string => {
  // 1 ETH = 10^18 Wei
  const wei = amount * 1e18;
  return '0x' + Math.floor(wei).toString(16);
};

// Get network name from chain ID
export const getNetworkName = (chainId: string): string => {
  const networks: Record<string, string> = {
    '0x1': 'Ethereum Mainnet',
    '0x5': 'Goerli Testnet',
    '0x11155111': 'Sepolia Testnet',
    '0x89': 'Polygon',
    '0x13881': 'Mumbai Testnet',
    '0xa86a': 'Avalanche',
    '0xa': 'Optimism',
    '0xa4b1': 'Arbitrum',
  };
  
  return networks[chainId] || `Network ID: ${parseInt(chainId, 16)}`;
};

// Connect to MetaMask
export const connectMetamask = async (): Promise<{account: string, networkName: string}> => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed!');
  }
  
  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    }) as string[];
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please connect to MetaMask.');
    }
    
    // Get current network
    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    }) as string;
    
    const networkName = getNetworkName(chainId);
    
    return { account: accounts[0], networkName };
  } catch (error: any) {
    console.error('Error connecting to MetaMask:', error);
    throw new Error(error.message || 'Could not connect to MetaMask');
  }
};

// Process payment using MetaMask
export const processMetaMaskPayment = async (paymentDetails: PaymentRequest): Promise<boolean> => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed!');
  }
  
  try {
    const { account } = await connectMetamask();
    
    // Get current gas price
    const gasPrice = await window.ethereum.request({
      method: 'eth_gasPrice',
    });
    
    // Convert amount to correct format (ETH to Wei)
    // For simplicity, we're assuming 1 ETH = 100,000 INR
    const ethAmount = paymentDetails.amount / 100000;
    const value = toWei(ethAmount);
    
    console.log(`Sending ${ethAmount} ETH (${paymentDetails.amount} INR)`);
    
    // Prepare transaction parameters
    const transactionParameters = {
      from: account,
      to: '0xYourContractOrWalletAddressHere', // Replace with actual receiving address
      value: value,
      gasPrice: gasPrice,
      gas: '0x5208', // 21000 gas limit for standard ETH transfer
    };
    
    // Send transaction
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    });
    
    console.log('Transaction sent:', txHash);
    
    // Add transaction to history
    const transaction = {
      id: uuidv4(),
      type: "debit" as const,
      amount: paymentDetails.amount,
      from: 'You (via MetaMask)',
      to: paymentDetails.to,
      description: paymentDetails.description,
      status: "completed" as const,
      date: new Date(),
      paymentId: txHash,
    };
    
    addTransaction(transaction);
    
    // Update credit score
    updateCreditScoreFromTransaction(transaction);
    
    toast.success('Payment successful', {
      description: `Transaction hash: ${txHash.substring(0, 10)}...`,
    });
    
    return true;
  } catch (error: any) {
    console.error('MetaMask payment error:', error);
    toast.error('Payment failed', {
      description: error.message || 'There was an error processing your payment',
    });
    return false;
  }
};