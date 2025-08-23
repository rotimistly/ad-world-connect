import { ArrowRight, Globe, Target, Zap, Star, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import heroBackground from "@/assets/hero-background.jpg";

const HomePage = () => {
  const navigateToAuth = () => {
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text">
            AdWorld Connect
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Reach global audiences with targeted advertising. Upload videos, photos, and connect your business to the world through our worldwide ad network.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="premium" 
              size="lg"
              onClick={navigateToAuth}
              className="text-lg px-8 py-6"
            >
              Start Advertising <ArrowRight className="ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-6 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">About AdWorld Connect</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We are a global advertising platform that empowers businesses to showcase their products and services through engaging visual content, reaching targeted audiences worldwide.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center shadow-card hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <Globe className="w-12 h-12 mx-auto text-primary mb-4" />
                <CardTitle>Global Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Connect with audiences across all continents through our worldwide advertising network and partnerships.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center shadow-card hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <Target className="w-12 h-12 mx-auto text-primary mb-4" />
                <CardTitle>Precision Targeting</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Target specific locations and demographics with customizable range settings for maximum campaign effectiveness.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center shadow-card hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <Zap className="w-12 h-12 mx-auto text-primary mb-4" />
                <CardTitle>Instant Publishing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get your ads live within minutes of payment confirmation across our network of partner sites and platforms.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Get your business noticed in just 5 simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-5 gap-8">
            {[
              { step: 1, title: "Create Account", desc: "Sign up with your business details" },
              { step: 2, title: "Upload Media", desc: "Add videos or photos of your products" },
              { step: 3, title: "Set Targeting", desc: "Choose location and audience range" },
              { step: 4, title: "Make Payment", desc: "Secure checkout with Stripe" },
              { step: 5, title: "Go Live", desc: "Your ad reaches global audiences" }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Why Choose AdWorld Connect?</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Star className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Premium Ad Placement</h3>
                    <p className="text-muted-foreground">Your ads appear on high-traffic websites and popular platforms for maximum visibility.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Users className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Audience Analytics</h3>
                    <p className="text-muted-foreground">Track engagement metrics and optimize your campaigns based on real-time data.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <TrendingUp className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">ROI Optimization</h3>
                    <p className="text-muted-foreground">Smart algorithms ensure your budget delivers the best possible return on investment.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Card className="p-6 shadow-card">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Global Network</h4>
                    <p className="text-sm text-muted-foreground">200+ partner sites</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6 shadow-card">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Active Users</h4>
                    <p className="text-sm text-muted-foreground">50M+ monthly reach</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to Scale Your Business Globally?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join thousands of businesses already using AdWorld Connect to reach new customers worldwide.
          </p>
          <Button 
            variant="premium" 
            size="lg"
            onClick={navigateToAuth}
            className="text-lg px-8 py-6 bg-white/20 hover:bg-white/30 border-white/30"
          >
            Get Started Today <ArrowRight className="ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;