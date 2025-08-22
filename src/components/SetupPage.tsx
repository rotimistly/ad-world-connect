import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, MapPin, CreditCard, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SetupPage = () => {
  const [activeTab, setActiveTab] = useState("account");
  const [user, setUser] = useState(null);
  const [ad, setAd] = useState(null);
  const { toast } = useToast();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    // Mock registration
    setUser({
      username: formData.get('username'),
      email: formData.get('email')
    });
    setActiveTab("create-ad");
    toast({
      title: "Account Created!",
      description: "Welcome to AdWorld Connect. Now create your first ad.",
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login
    setUser({
      username: "demo_user",
      email: "demo@example.com"
    });
    setActiveTab("create-ad");
    toast({
      title: "Login Successful!",
      description: "Welcome back to AdWorld Connect.",
    });
  };

  const handleCreateAd = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    setAd({
      description: formData.get('description'),
      location: formData.get('location'),
      range: formData.get('range'),
      businessLink: formData.get('businessLink'),
      media: formData.get('media')
    });
    setActiveTab("payment");
    toast({
      title: "Ad Created!",
      description: "Your ad is ready. Proceed to payment to publish.",
    });
  };

  const handlePayment = () => {
    // Mock payment
    setTimeout(() => {
      setActiveTab("success");
      toast({
        title: "Payment Successful!",
        description: "Your ad is now live and reaching global audiences.",
      });
    }, 2000);
  };

  return (
    <div id="setup-section" className="min-h-screen bg-gradient-secondary py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Launch Your Global Ad Campaign</h1>
          <p className="text-xl text-muted-foreground">
            Set up your account and create compelling ads that reach audiences worldwide
          </p>
        </div>

        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="create-ad" disabled={!user}>Create Ad</TabsTrigger>
                <TabsTrigger value="payment" disabled={!ad}>Payment</TabsTrigger>
                <TabsTrigger value="success" disabled={!ad}>Success</TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Create New Account</CardTitle>
                      <CardDescription>Join thousands of businesses advertising globally</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input id="username" name="username" required />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" name="email" type="email" required />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input id="password" name="password" type="password" required />
                        </div>
                        <Button type="submit" className="w-full" variant="hero">
                          Create Account
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Already Have an Account?</CardTitle>
                      <CardDescription>Sign in to continue your advertising journey</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                          <Label htmlFor="login-username">Username</Label>
                          <Input id="login-username" name="username" required />
                        </div>
                        <div>
                          <Label htmlFor="login-password">Password</Label>
                          <Input id="login-password" name="password" type="password" required />
                        </div>
                        <Button type="submit" className="w-full" variant="outline">
                          Sign In
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="create-ad" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Create Your Advertisement
                    </CardTitle>
                    <CardDescription>
                      Upload engaging content and set your targeting preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateAd} className="space-y-6">
                      <div>
                        <Label htmlFor="media">Upload Video or Photo</Label>
                        <Input 
                          id="media" 
                          name="media" 
                          type="file" 
                          accept="image/*,video/*" 
                          required 
                          className="cursor-pointer"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Supported formats: JPG, PNG, MP4, WebM (Max 50MB)
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="description">Ad Description</Label>
                        <Textarea 
                          id="description" 
                          name="description" 
                          placeholder="Describe your product or service..."
                          required 
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="location" className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Target Location
                          </Label>
                          <Input 
                            id="location" 
                            name="location" 
                            placeholder="e.g., New York, USA" 
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor="range">Range (km)</Label>
                          <Input 
                            id="range" 
                            name="range" 
                            type="number" 
                            placeholder="100" 
                            required 
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="businessLink">Business Link</Label>
                        <Input 
                          id="businessLink" 
                          name="businessLink" 
                          placeholder="https://facebook.com/yourbusiness or @yourtiktok" 
                          required 
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Website, Facebook, TikTok, WhatsApp, or any business link
                        </p>
                      </div>

                      <Button type="submit" className="w-full" variant="hero">
                        Create Advertisement
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payment" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Complete Your Payment
                    </CardTitle>
                    <CardDescription>
                      Secure payment processing through Stripe
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-gradient-secondary p-6 rounded-lg">
                      <h3 className="font-semibold mb-4">Ad Campaign Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Campaign Type:</span>
                          <span>Global Advertising</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Target Location:</span>
                          <span>{ad?.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Range:</span>
                          <span>{ad?.range} km</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                          <span>Total:</span>
                          <span>$49.99</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>✓ Worldwide ad distribution</p>
                      <p>✓ 30-day campaign duration</p>
                      <p>✓ Real-time analytics</p>
                      <p>✓ 24/7 support</p>
                    </div>

                    <Button 
                      onClick={handlePayment} 
                      className="w-full" 
                      variant="premium"
                      size="lg"
                    >
                      Pay $49.99 with Stripe
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Secure payment processing. Your card details are protected by Stripe.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="success" className="space-y-6">
                <Card>
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold mb-4">🎉 Campaign Launched!</h2>
                    <p className="text-xl text-muted-foreground mb-8">
                      Your ad is now live and reaching global audiences across our network
                    </p>
                    
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                      <div className="p-4 bg-gradient-secondary rounded-lg">
                        <h3 className="font-semibold">Campaign Status</h3>
                        <p className="text-green-600">Active</p>
                      </div>
                      <div className="p-4 bg-gradient-secondary rounded-lg">
                        <h3 className="font-semibold">Estimated Reach</h3>
                        <p className="text-primary">50,000+ users</p>
                      </div>
                      <div className="p-4 bg-gradient-secondary rounded-lg">
                        <h3 className="font-semibold">Campaign Duration</h3>
                        <p className="text-primary">30 days</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Button variant="hero" size="lg">
                        View Analytics Dashboard
                      </Button>
                      <Button variant="outline" size="lg">
                        Create Another Ad
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetupPage;