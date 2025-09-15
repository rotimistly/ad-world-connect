import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const MockPaymentPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');

  useEffect(() => {
    if (reference && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (reference && countdown === 0) {
      handleMockPayment();
    }
  }, [countdown, reference]);

  const handleMockPayment = async () => {
    if (!reference) return;
    
    setIsProcessing(true);
    
    // Simulate processing time
    setTimeout(() => {
      // Redirect to verify payment with mock parameter
      const verifyUrl = `${window.location.origin}/functions/v1/verify-payment?reference=${reference}&mock=true`;
      window.location.href = verifyUrl;
    }, 1500);
  };

  if (!reference) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-xl font-bold mb-2">Invalid Payment Link</h2>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
      <Card className="max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <CreditCard className="w-6 h-6" />
            Secure Payment
          </CardTitle>
          <CardDescription>Processing your payment...</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 space-y-6">
          {countdown > 0 ? (
            <>
              <div className="text-4xl font-bold text-primary">{countdown}</div>
              <p className="text-muted-foreground">
                Redirecting to payment confirmation...
              </p>
            </>
          ) : (
            <>
              {isProcessing ? (
                <>
                  <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
                  <p className="text-muted-foreground">
                    Confirming payment...
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
                    <p className="text-muted-foreground">
                      Your ad has been activated and is now live.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
          
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Secured by SSL Encryption</span>
            </div>
            <div>Reference: {reference?.substring(0, 20)}...</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MockPaymentPage;