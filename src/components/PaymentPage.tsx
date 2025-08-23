import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CreditCard, DollarSign, Clock, CheckCircle2, XCircle } from "lucide-react";

interface PaymentData {
  id: string;
  amount: number;
  region: string;
  status: string;
  currency: string;
  paystack_reference: string;
  paystack_access_code: string;
  ad: {
    headline: string;
    body_text: string;
    distance_km: number;
    is_fixed_price: boolean;
    business: {
      business_name: string;
    };
  };
}

const PaymentPage = () => {
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const paymentId = window.location.pathname.split('/').pop();

  useEffect(() => {
    if (paymentId) {
      loadPayment();
    }
  }, [paymentId]);

  const loadPayment = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          ads!inner(
            headline,
            body_text,
            distance_km,
            is_fixed_price,
            businesses!inner(business_name)
          )
        `)
        .eq('id', paymentId)
        .single();

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: PaymentData = {
        ...data,
        ad: {
          headline: data.ads.headline,
          body_text: data.ads.body_text,
          distance_km: data.ads.distance_km,
          is_fixed_price: data.ads.is_fixed_price,
          business: {
            business_name: data.ads.businesses.business_name
          }
        }
      };
      setPayment(transformedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Payment not found",
        variant: "destructive",
      });
      window.location.href = '/dashboard';
    } finally {
      setIsLoading(false);
    }
  };

  const initializePayment = async () => {
    setIsProcessing(true);
    try {
      // Call edge function to initialize Paystack payment
      const { data, error } = await supabase.functions.invoke('initialize-payment', {
        body: {
          paymentId,
          amount: payment!.amount,
          email: (await supabase.auth.getSession()).data.session?.user.email,
          currency: payment!.currency
        }
      });

      if (error) throw error;

      // Redirect to Paystack checkout
      window.location.href = data.authorization_url;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBankTransfer = () => {
    toast({
      title: "Bank Transfer",
      description: "Redirecting to bank transfer options...",
    });
    // This would redirect to Paystack's bank transfer option
    initializePayment();
  };

  const handleCardPayment = () => {
    toast({
      title: "Card Payment",
      description: "Redirecting to secure card payment...",
    });
    // This would redirect to Paystack's card payment option
    initializePayment();
  };

  const handleOpayPayment = () => {
    toast({
      title: "Opay Payment",
      description: "Redirecting to Opay payment...",
    });
    // This would redirect to Paystack's Opay integration
    initializePayment();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <XCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Payment Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The payment you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (payment.status === 'completed') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-4">
              Your ad "{payment.ad.headline}" has been published and is now live.
            </p>
            <div className="space-y-2">
              <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
                View Dashboard
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/create-ad'} className="w-full">
                Create Another Ad
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Complete Payment</h1>
            <p className="text-muted-foreground">Secure payment via Paystack</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your ad details before payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-medium">Business:</span>
                  <span className="text-right">{payment.ad.business.business_name}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="font-medium">Ad Headline:</span>
                  <span className="text-right max-w-xs">{payment.ad.headline}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Region:</span>
                  <span>{payment.region}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Range:</span>
                  <span>{payment.ad.distance_km} km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Duration:</span>
                  <span>
                    {payment.ad.is_fixed_price ? '4 days' : '30 days'}
                    {payment.ad.is_fixed_price && (
                      <Badge variant="secondary" className="ml-2">Fixed Price</Badge>
                    )}
                  </span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount:</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-5 h-5" />
                    <span>{payment.amount} {payment.currency}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Choose Payment Method</CardTitle>
              <CardDescription>Select your preferred payment option</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleCardPayment}
                disabled={isProcessing}
                className="w-full h-16 text-left justify-start gap-4"
                variant="outline"
              >
                <CreditCard className="w-8 h-8" />
                <div>
                  <div className="font-medium">Pay with Card</div>
                  <div className="text-sm text-muted-foreground">
                    Visa, Mastercard, Verve
                  </div>
                </div>
              </Button>

              <Button 
                onClick={handleBankTransfer}
                disabled={isProcessing}
                className="w-full h-16 text-left justify-start gap-4"
                variant="outline"
              >
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs font-bold">
                  BANK
                </div>
                <div>
                  <div className="font-medium">Bank Transfer</div>
                  <div className="text-sm text-muted-foreground">
                    Direct bank transfer
                  </div>
                </div>
              </Button>

              <Button 
                onClick={handleOpayPayment}
                disabled={isProcessing}
                className="w-full h-16 text-left justify-start gap-4"
                variant="outline"
              >
                <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">
                  OPAY
                </div>
                <div>
                  <div className="font-medium">Opay Wallet</div>
                  <div className="text-sm text-muted-foreground">
                    Pay with Opay
                  </div>
                </div>
              </Button>

              {isProcessing && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Redirecting to secure payment...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <span>Secured by Paystack • SSL Encrypted • PCI Compliant</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;