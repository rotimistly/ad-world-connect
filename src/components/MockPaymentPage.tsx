import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Building2, Smartphone } from "lucide-react";
import { toast } from "sonner";

const MockPaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  const reference = searchParams.get('reference');
  const amount = searchParams.get('amount');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!reference || !amount || !email) {
      toast.error("Invalid payment parameters");
      navigate('/dashboard');
    }
  }, [reference, amount, email, navigate]);

  const simulatePayment = async (method: string) => {
    setProcessing(true);
    setPaymentMethod(method);
    
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Redirect to verify payment
      window.location.href = `/functions/v1/verify-payment?reference=${reference}`;
    } catch (error) {
      console.error('Payment simulation error:', error);
      toast.error("Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  if (!reference || !amount || !email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Complete Payment</CardTitle>
          <p className="text-muted-foreground">
            Amount: ${parseFloat(amount).toFixed(2)} USD
          </p>
          <p className="text-sm text-muted-foreground">
            Email: {email}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {processing ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Processing {paymentMethod} payment...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please wait while we confirm your payment
              </p>
            </div>
          ) : (
            <>
              <p className="text-center text-sm text-muted-foreground mb-6">
                Choose your preferred payment method:
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => simulatePayment("Card")}
                  className="w-full justify-start"
                  variant="outline"
                  size="lg"
                >
                  <CreditCard className="mr-3 h-5 w-5" />
                  Pay with Card
                </Button>
                
                <Button
                  onClick={() => simulatePayment("Bank Transfer")}
                  className="w-full justify-start"
                  variant="outline"
                  size="lg"
                >
                  <Building2 className="mr-3 h-5 w-5" />
                  Bank Transfer
                </Button>
                
                <Button
                  onClick={() => simulatePayment("Opay")}
                  className="w-full justify-start"
                  variant="outline"
                  size="lg"
                >
                  <Smartphone className="mr-3 h-5 w-5" />
                  Opay
                </Button>
              </div>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  🔒 This is a demo payment. No real money will be charged.
                  Your ad will be published after payment confirmation.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MockPaymentPage;