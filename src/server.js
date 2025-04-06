// server.js
import express from "express";
import Razorpay from "razorpay";
import cors from "cors";

const app = express();

app.use(cors({
  origin: [
    "https://TransPay-five.vercel.app",  // ✅ your deployed frontend
    "capacitor://localhost",             // ✅ for APK
    "http://localhost",
    "http://localhost:5173",
    "file://",
    "https://localhost",                 // Adding this for Android
    "https://localhost:5173"             // Adding this for Android
  ],
  methods: ["GET", "POST"],
  credentials: true,
}));

app.use(express.json());

const razorpay = new Razorpay({
  key_id: 'rzp_test_eDVMj23yL98Hvt',
  key_secret: 'LOr3SG3XRnMpgduiMYqljwgH',
});

app.post("/create-order", async (req, res) => {
  const { amount, currency = "INR", receipt } = req.body;
  
  console.log("Received order creation request:", { amount, currency, receipt });
  
  const options = {
    amount: Math.round(amount * 100), // Ensure amount is in paise and rounded
    currency,
    receipt: receipt || "receipt_" + Date.now(),
  };

  try {
    const order = await razorpay.orders.create(options);
    console.log("Order created successfully:", order);
    res.json(order);
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).send("Failed to create Razorpay order");
  }
});

// Add payment verification endpoint
app.post("/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // In a real implementation, you would verify the signature here
    // For demo purposes, we're just returning success
    
    console.log("Payment verification received:", {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature
    });
    
    res.json({ verified: true });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ verified: false, error: error.message });
  }
});

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Razorpay server is running!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
