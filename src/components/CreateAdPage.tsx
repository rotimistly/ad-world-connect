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
  
  const [adData, setAdData] = useState({
    headline: '',
    bodyText: '',
    callToAction: '',
    targetKeywords: '',
    region: '',
    distanceKm: 100,
    customDays: 1
  });
  const [businessData, setBusinessData] = useState({
    businessName: "",
    businessDescription: "",
    email: "",
    phoneNumber: "",
    websiteUrl: "",
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

  const calculateDistancePrice = (distanceKm: number) => {
    if (distanceKm <= 100) {
      return 5.00; // Base price for 100km
    }
    
    // Calculate cumulative price with 90% increment for each tier
    let totalPrice = 5.00; // Base price for 100km
    let currentPrice = 5.00;
    
    const tiers = [
      { max: 200, label: "200km" },
      { max: 300, label: "300km" },
      { max: 400, label: "400km" },
      { max: 500, label: "500km" },
      { max: 1000, label: "1000km" },
      { max: 2000, label: "2000km" },
      { max: 5000, label: "5000km" },
      { max: 10000, label: "10000km" },
      { max: 20000, label: "20000km" },
      { max: 40000, label: "40000km" },
      { max: 60000, label: "60000km" }
    ];
    
    for (const tier of tiers) {
      if (distanceKm > (tier.max === 200 ? 100 : tiers[tiers.indexOf(tier) - 1]?.max || 100) && distanceKm <= tier.max) {
        currentPrice = currentPrice * 1.9; // Add 90% of previous price
        totalPrice = currentPrice;
        break;
      }
      if (distanceKm > tier.max) {
        currentPrice = currentPrice * 1.9;
        totalPrice = currentPrice;
      }
    }
    
    return totalPrice;
  };

  const calculateDaysPrice = (basePrice: number, days: number) => {
    if (days <= 1) return basePrice;
    
    let totalPrice = basePrice;
    let currentDayPrice = basePrice;
    
    for (let day = 2; day <= days; day++) {
      currentDayPrice = currentDayPrice * 1.9; // Add 90% of previous day
      totalPrice += currentDayPrice;
    }
    
    return totalPrice;
  };

  const calculatePrice = () => {
    const distancePrice = calculateDistancePrice(adData.distanceKm);
    return calculateDaysPrice(distancePrice, adData.customDays || 1);
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
          website_url: businessData.websiteUrl,
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
      
      // Set expiration dates based on custom days
      const expiresAt = new Date();
      const customDays = adData.customDays || 1;
      expiresAt.setDate(expiresAt.getDate() + customDays);

      // Create the ad
      const { data: adResult, error: adError } = await supabase
        .from('ads')
        .insert({
          business_id: selectedBusiness,
          ad_format: 'text',
          headline: adData.headline,
          body_text: adData.bodyText,
          call_to_action: adData.callToAction,
          target_keywords: adData.targetKeywords.split(',').map(k => k.trim()).filter(k => k),
          region: adData.region,
          distance_km: adData.distanceKm,
          paid: false,
          price_paid: price,
          expires_at: expiresAt.toISOString(),
          is_fixed_price: false,
          fixed_price_expires_at: null
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
          currency: 'NGN',
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
                  <Label htmlFor="websiteUrl">Website/App URL</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    placeholder="https://yourbusiness.com"
                    value={businessData.websiteUrl}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, websiteUrl: e.target.value }))}
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
                    placeholder="restaurant food delivery, pizza, italian cuisine"
                    value={adData.targetKeywords}
                    onChange={(e) => setAdData(prev => ({ ...prev, targetKeywords: e.target.value }))}
                  />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Enter keywords your customers would search for. Examples:</p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>For restaurants: "pizza delivery, italian food, takeout"</li>
                      <li>For services: "plumber, emergency repair, home services"</li>
                      <li>For retail: "clothing store, fashion, women's apparel"</li>
                    </ul>
                    <p className="font-medium">Separate keywords with commas</p>
                  </div>
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
                      <SelectItem value="100">100 km - ${calculateDistancePrice(100).toFixed(2)}</SelectItem>
                      <SelectItem value="200">200 km - ${calculateDistancePrice(200).toFixed(2)}</SelectItem>
                      <SelectItem value="300">300 km - ${calculateDistancePrice(300).toFixed(2)}</SelectItem>
                      <SelectItem value="400">400 km - ${calculateDistancePrice(400).toFixed(2)}</SelectItem>
                      <SelectItem value="500">500 km - ${calculateDistancePrice(500).toFixed(2)}</SelectItem>
                      <SelectItem value="1000">1000 km - ${calculateDistancePrice(1000).toFixed(2)}</SelectItem>
                      <SelectItem value="2000">2000 km - ${calculateDistancePrice(2000).toFixed(2)}</SelectItem>
                      <SelectItem value="5000">5000 km - ${calculateDistancePrice(5000).toFixed(2)}</SelectItem>
                      <SelectItem value="10000">10000 km - ${calculateDistancePrice(10000).toFixed(2)}</SelectItem>
                      <SelectItem value="20000">20000 km - ${calculateDistancePrice(20000).toFixed(2)}</SelectItem>
                      <SelectItem value="40000">40000 km - ${calculateDistancePrice(40000).toFixed(2)}</SelectItem>
                      <SelectItem value="60000">60000 km - ${calculateDistancePrice(60000).toFixed(2)}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Pricing increases by 90% for each distance tier above 100km
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customDays">Ad Duration (Days)</Label>
                    <Select 
                      value={adData.customDays?.toString() || "1"} 
                      onValueChange={(value) => setAdData(prev => ({ ...prev, customDays: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Day - ${calculateDaysPrice(calculateDistancePrice(adData.distanceKm), 1).toFixed(2)}</SelectItem>
                        <SelectItem value="2">2 Days - ${calculateDaysPrice(calculateDistancePrice(adData.distanceKm), 2).toFixed(2)}</SelectItem>
                        <SelectItem value="3">3 Days - ${calculateDaysPrice(calculateDistancePrice(adData.distanceKm), 3).toFixed(2)}</SelectItem>
                        <SelectItem value="4">4 Days - ${calculateDaysPrice(calculateDistancePrice(adData.distanceKm), 4).toFixed(2)}</SelectItem>
                        <SelectItem value="5">5 Days - ${calculateDaysPrice(calculateDistancePrice(adData.distanceKm), 5).toFixed(2)}</SelectItem>
                        <SelectItem value="7">7 Days - ${calculateDaysPrice(calculateDistancePrice(adData.distanceKm), 7).toFixed(2)}</SelectItem>
                        <SelectItem value="10">10 Days - ${calculateDaysPrice(calculateDistancePrice(adData.distanceKm), 10).toFixed(2)}</SelectItem>
                        <SelectItem value="14">14 Days - ${calculateDaysPrice(calculateDistancePrice(adData.distanceKm), 14).toFixed(2)}</SelectItem>
                        <SelectItem value="30">30 Days - ${calculateDaysPrice(calculateDistancePrice(adData.distanceKm), 30).toFixed(2)}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Each additional day costs 90% more than the previous day
                    </p>
                  </div>
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
                        {adData.customDays || 1} {(adData.customDays || 1) === 1 ? 'day' : 'days'} duration
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