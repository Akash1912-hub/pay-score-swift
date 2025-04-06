import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { Transaction } from "@/types";
import PaymentModal from "@/components/PaymentModal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { processPayment } from "../utils/razorpayUtils"; // Import Razorpay utility

interface Contact {
  name: string;
  amount: number;
}

// Form schema for contact search
const searchFormSchema = z.object({
  searchTerm: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

// Form schema for custom payment
const paymentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().min(1, "Amount must be at least 1"),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

const SendMoneyPage = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showCustomPayment, setShowCustomPayment] = useState(false);

  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      searchTerm: "",
    },
  });

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      name: "",
      amount: 0,
    },
  });

  useEffect(() => {
    // Simulated fetch – replace this with actual API call or user context
    const fetchContacts = async () => {
      // Example static user data; replace with actual user data
      const userContacts: Contact[] = [
        { name: "Ananya", amount: 150 },
        { name: "Vikram", amount: 450 },
        { name: "Kiran", amount: 300 },
        { name: "Meena", amount: 900 },
      ];
      setContacts(userContacts);
      setFilteredContacts(userContacts);
    };

    fetchContacts();
  }, []);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedContact(null);
  };

  const handleSearch = (values: SearchFormValues) => {
    const searchTerm = values.searchTerm?.toLowerCase() || "";
    if (!searchTerm) {
      setFilteredContacts(contacts);
      return;
    }
    
    const filtered = contacts.filter(contact => 
      contact.name.toLowerCase().includes(searchTerm)
    );
    setFilteredContacts(filtered);
  };

  const handleCreateCustomPayment = async (values: PaymentFormValues) => {
    const newContact = {
      name: values.name,
      amount: values.amount
    };
    
    setSelectedContact(newContact);
    setIsPaymentModalOpen(true);
    setShowCustomPayment(false);
    paymentForm.reset();

    // Process the custom payment via Razorpay
    try {
      const paymentSuccessful = await processPayment({
        amount: values.amount,
        to: newContact.name,
        description: `Money transfer to ${newContact.name}`,
      });

      if (paymentSuccessful) {
        toast.success("Payment successful!");
      } else {
        toast.error("Payment failed.");
      }
    } catch (error) {
      toast.error("Error processing payment.");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="mb-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-2">Send Money</h1>
        </div>
      </header>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Search Contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...searchForm}>
            <form onChange={searchForm.handleSubmit(handleSearch)} className="space-y-4">
              <FormField
                control={searchForm.control}
                name="searchTerm"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search contact by name"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <div className="grid grid-cols-1 gap-3">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <Button
                  key={contact.name}
                  variant="outline"
                  className="h-auto py-4 flex justify-between items-center w-full"
                  onClick={() => handleSelectContact(contact)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-medium text-sm">
                        {contact.name.charAt(0)}
                      </span>
                    </div>
                    <span className="font-semibold">{contact.name}</span>
                  </div>
                  <span className="text-muted-foreground">₹{contact.amount}</span>
                </Button>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-2">No contacts found</p>
            )}
          </div>
          
          <div className="pt-2">
            <Button 
              variant="secondary" 
              className="w-full" 
              onClick={() => setShowCustomPayment(true)}
            >
              Create New Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      {showCustomPayment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">New Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit(handleCreateCustomPayment)} className="space-y-4">
                <FormField
                  control={paymentForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Recipient Name" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={paymentForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Amount (₹)" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowCustomPayment(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">Create</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Button 
        variant="outline" 
        className="w-full mt-4" 
        onClick={() => navigate("/")}>
        Back to Home
      </Button>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedContact && (
            <PaymentModal
              paymentDetails={{
                amount: selectedContact.amount,
                to: selectedContact.name,
                description: `Money transfer to ${selectedContact.name}`,
              }}
              onClose={handleClosePaymentModal}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SendMoneyPage;
