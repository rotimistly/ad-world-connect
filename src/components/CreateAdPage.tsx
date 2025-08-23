import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, DollarSign, MapPin, Clock, CreditCard, AlertCircle } from "lucide-react";

interface Business {
  id: string;
  business_name: string;
  business_description: string;
  email: string;
  phone_number: string;
  whatsapp_link: string;
  facebook_handle: string;
  instagram_handle: string;
  twitter_handle: string;
  linkedin_handle: string;
  tiktok_handle: string;
}

const CreateAdPage = () => {
  const [user, setUser] = useState<any>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [isFixedPrice, setIsFixedPrice] = useState(false);
  const [adData, setAdData] = useState({
    headline: "",
    bodyText: "",
    callToAction: "",
    region: "",
    distanceKm: 2,
    customPrice: "",
    targetKeywords: "",
    adFormat: "text"
  });
  const [businessData, setBusinessData] = useState({
    businessName: "",
    businessDescription: "",
    email: "",
    phoneNumber: "",
    whatsappLink: "",
    facebookHandle: "",
    instagramHandle: "",
    twitterHandle: "",
    linkedinHandle: "",
    tiktokHandle: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/auth';
      return;
    }
    
    setUser(session.user);
    loadBusinesses();
  };

  const loadBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', (await supabase.auth.getSession()).data.session?.user.id);

      if (error) throw error;
      
      setBusinesses(data || []);
      if (data && data.length === 0) {
        setShowBusinessForm(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const calculatePrice = () => {
    if (isFixedPrice && adData.customPrice) {
      return parseFloat(adData.customPrice);
    }
    return adData.distanceKm <= 2 ? 4.00 : 5.00;
  };

  const handleCreateBusiness = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          user_id: user.id,
          business_name: businessData.businessName,
          business_description: businessData.businessDescription,
          email: businessData.email,
          phone_number: businessData.phoneNumber,
          whatsapp_link: businessData.whatsappLink,
          facebook_handle: businessData.facebookHandle,
          instagram_handle: businessData.instagramHandle,
          twitter_handle: businessData.twitterHandle,
          linkedin_handle: businessData.linkedinHandle,
          tiktok_handle: businessData.tiktokHandle,
        })
        .select()
        .single();

      if (error) throw error;

      setBusinesses(prev => [...prev, data]);
      setSelectedBusiness(data.id);
      setShowBusinessForm(false);
      
      toast({
        title: "Success",
        description: "Business profile created successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateAd = async () => {
    if (!selectedBusiness) {
      toast({
        title: "Error",
        description: "Please select or create a business profile",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const price = calculatePrice();
      const expiresAt = new Date();
      const fixedPriceExpiresAt = new Date();
      
      // Standard ads expire in 30 days, fixed price ads in 4 days
      if (isFixedPrice) {
        fixedPriceExpiresAt.setDate(fixedPriceExpiresAt.getDate() + 4);
      } else {
        expiresAt.setDate(expiresAt.getDate() + 30);
      }

      // Create the ad
      const { data: adResult, error: adError } = await supabase
        .from('ads')
        .insert({
          business_id: selectedBusiness,
          ad_format: adData.adFormat,
          headline: adData.headline,
          body_text: adData.bodyText,
          call_to_action: adData.callToAction,
          target_keywords: adData.targetKeywords.split(',').map(k => k.trim()).filter(k => k),
          region: adData.region,
          distance_km: adData.distanceKm,
          price_paid: price,
          is_fixed_price: isFixedPrice,
          fixed_price_expires_at: isFixedPrice ? fixedPriceExpiresAt.toISOString() : null,
          expires_at: expiresAt.toISOString(),
          paid: false
        })
        .select()
        .single();

      if (adError) throw adError;

      // Create payment record
      const { data: paymentResult, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          ad_id: adResult.id,
          amount: price,
          region: adData.region,
          currency: 'USD',
          status: 'pending',
          payment_method: 'paystack'
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Redirect to payment
      window.location.href = `/payment/${paymentResult.id}`;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Ad</h1>
            <p className="text-muted-foreground">Reach your target audience effectively</p>
          </div>
        </div>

        {showBusinessForm ? (
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Create Business Profile</CardTitle>
              <CardDescription>
                First, let's set up your business profile for contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="Your Business Name"
                    value={businessData.businessName}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, businessName: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="business@example.com"
                    value={businessData.email}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="+1234567890"
                    value={businessData.phoneNumber}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsappLink">WhatsApp Link</Label>
                  <Input
                    id="whatsappLink"
                    placeholder="https://wa.me/1234567890"
                    value={businessData.whatsappLink}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, whatsappLink: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebookHandle">Facebook Handle</Label>
                  <Input
                    id="facebookHandle"
                    placeholder="@yourbusiness"
                    value={businessData.facebookHandle}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, facebookHandle: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagramHandle">Instagram Handle</Label>
                  <Input
                    id="instagramHandle"
                    placeholder="@yourbusiness"
                    value={businessData.instagramHandle}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, instagramHandle: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessDescription">Business Description</Label>
                <Textarea
                  id="businessDescription"
                  placeholder="Describe your business..."
                  value={businessData.businessDescription}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, businessDescription: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateBusiness} className="shadow-elegant">
                  Create Business Profile
                </Button>
                {businesses.length > 0 && (
                  <Button variant="outline" onClick={() => setShowBusinessForm(false)}>
                    Use Existing Business
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>Select which business this ad is for</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Select Business</Label>
                    <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a business" />
                      </SelectTrigger>
                      <SelectContent>
                        {businesses.map((business) => (
                          <SelectItem key={business.id} value={business.id}>
                            {business.business_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" onClick={() => setShowBusinessForm(true)}>
                    Add New Business
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Ad Content</CardTitle>
                <CardDescription>Create compelling content for your advertisement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="headline">Headline *</Label>
                  <Input
                    id="headline"
                    placeholder="Catchy headline for your ad"
                    value={adData.headline}
                    onChange={(e) => setAdData(prev => ({ ...prev, headline: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bodyText">Body Text *</Label>
                  <Textarea
                    id="bodyText"
                    placeholder="Describe your product or service..."
                    value={adData.bodyText}
                    onChange={(e) => setAdData(prev => ({ ...prev, bodyText: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="callToAction">Call to Action</Label>
                  <Input
                    id="callToAction"
                    placeholder="Contact us today!"
                    value={adData.callToAction}
                    onChange={(e) => setAdData(prev => ({ ...prev, callToAction: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetKeywords">Target Keywords</Label>
                  <Input
                    id="targetKeywords"
                    placeholder="keyword1, keyword2, keyword3"
                    value={adData.targetKeywords}
                    onChange={(e) => setAdData(prev => ({ ...prev, targetKeywords: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Separate keywords with commas</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Targeting & Pricing</CardTitle>
                <CardDescription>Configure your ad reach and pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="region">Target Region *</Label>
                  <Input
                    id="region"
                    placeholder="City, State or Country"
                    value={adData.region}
                    onChange={(e) => setAdData(prev => ({ ...prev, region: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distanceKm">Distance Range (km) *</Label>
                  <Select 
                    value={adData.distanceKm.toString()} 
                    onValueChange={(value) => setAdData(prev => ({ ...prev, distanceKm: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 km - $4.00</SelectItem>
                      <SelectItem value="3">3 km - $5.00</SelectItem>
                      <SelectItem value="5">5 km - $5.00</SelectItem>
                      <SelectItem value="10">10 km - $5.00</SelectItem>
                      <SelectItem value="25">25 km - $5.00</SelectItem>
                      <SelectItem value="50">50 km - $5.00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Fixed Price (4-day duration)</Label>
                      <p className="text-xs text-muted-foreground">
                        Set your own price, ad will run for exactly 4 days
                      </p>
                    </div>
                    <Switch
                      checked={isFixedPrice}
                      onCheckedChange={setIsFixedPrice}
                    />
                  </div>

                  {isFixedPrice && (
                    <div className="space-y-2">
                      <Label htmlFor="customPrice">Your Price ($)</Label>
                      <Input
                        id="customPrice"
                        type="number"
                        step="0.01"
                        min="1"
                        placeholder="10.00"
                        value={adData.customPrice}
                        onChange={(e) => setAdData(prev => ({ ...prev, customPrice: e.target.value }))}
                      />
                      <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <p className="text-sm text-orange-700">
                          Fixed price ads last only 4 days regardless of payment amount
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-card p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      <span className="font-medium">Total Cost:</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        ${calculatePrice().toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {isFixedPrice ? '4 days duration' : '30 days duration'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={handleCreateAd} 
                disabled={isLoading || !selectedBusiness}
                className="shadow-elegant"
                size="lg"
              >
                {isLoading ? "Creating..." : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Continue to Payment
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateAdPage;