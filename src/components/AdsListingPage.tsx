import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, Calendar, Eye, MousePointer, MessageCircle, Phone, Mail, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Ad {
  id: string;
  headline: string;
  body_text: string;
  region: string;
  distance_km: number;
  views: number;
  clicks: number;
  messages: number;
  published_at: string;
  expires_at: string;
  is_fixed_price: boolean;
  fixed_price_expires_at: string;
  businesses: {
    business_name: string;
    phone_number: string;
    email: string;
    whatsapp_number: string;
    whatsapp_link: string;
    website_url: string;
    business_description: string;
    facebook_handle: string;
    instagram_handle: string;
    twitter_handle: string;
    linkedin_handle: string;
    tiktok_handle: string;
  };
}

const AdsListingPage = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [filteredAds, setFilteredAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    loadPublishedAds();
  }, []);

  useEffect(() => {
    filterAds();
  }, [ads, searchTerm, selectedRegion]);

  const loadPublishedAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select(`
          *,
          businesses!inner(
            business_name,
            phone_number,
            email,
            whatsapp_number,
            whatsapp_link,
            website_url,
            business_description,
            facebook_handle,
            instagram_handle,
            twitter_handle,
            linkedin_handle,
            tiktok_handle
          )
        `)
        .eq('paid', true)
        .not('published_at', 'is', null)
        .gt('expires_at', new Date().toISOString())
        .order('published_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load ads",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAds = () => {
    let filtered = ads;

    if (searchTerm) {
      filtered = filtered.filter(ad => 
        ad.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.body_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.businesses.business_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedRegion !== "all") {
      filtered = filtered.filter(ad => ad.region === selectedRegion);
    }

    setFilteredAds(filtered);
  };

  const handleAdClick = async (ad: Ad) => {
    // Track click engagement
    try {
      await supabase.functions.invoke('track-engagement', {
        body: { adId: ad.id, type: 'click' }
      });
      
      // Update local state
      setAds(prev => prev.map(a => 
        a.id === ad.id ? { ...a, clicks: a.clicks + 1 } : a
      ));
    } catch (error) {
      console.error('Failed to track click:', error);
    }
  };

  const handleViewAd = async (ad: Ad) => {
    // Track view engagement
    try {
      await supabase.functions.invoke('track-engagement', {
        body: { adId: ad.id, type: 'view' }
      });
      
      // Update local state
      setAds(prev => prev.map(a => 
        a.id === ad.id ? { ...a, views: a.views + 1 } : a
      ));
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  };


  const regions = [...new Set(ads.map(ad => ad.region))];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading advertisements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Browse Advertisements</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover local businesses and services in your area
          </p>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Back to Home
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ads, businesses, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map(region => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredAds.length} of {ads.length} advertisements
          </p>
        </div>

        {/* Ads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAds.map((ad) => (
            <Card 
              key={ad.id} 
              className="shadow-elegant hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                handleViewAd(ad);
              }}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{ad.headline}</CardTitle>
                    <CardDescription className="text-sm font-medium text-primary">
                      {ad.businesses.business_name}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {ad.is_fixed_price ? 'Featured' : 'Standard'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {ad.body_text}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{ad.region} • {ad.distance_km}km range</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Expires {new Date(ad.is_fixed_price ? ad.fixed_price_expires_at : ad.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{ad.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MousePointer className="w-3 h-3" />
                    <span>{ad.clicks}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{ad.messages}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Contact Now
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {ad.businesses.whatsapp_link && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdClick(ad);
                            window.open(ad.businesses.whatsapp_link, '_blank');
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          WhatsApp
                        </DropdownMenuItem>
                      )}
                      {ad.businesses.phone_number && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdClick(ad);
                            window.open(`tel:${ad.businesses.phone_number}`, '_self');
                          }}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Call Now
                        </DropdownMenuItem>
                      )}
                      {ad.businesses.email && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdClick(ad);
                            window.open(`mailto:${ad.businesses.email}`, '_self');
                          }}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                      )}
                      {ad.businesses.website_url && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdClick(ad);
                            window.open(ad.businesses.website_url, '_blank');
                          }}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Visit Website
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {ad.businesses.website_url && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdClick(ad);
                        window.open(ad.businesses.website_url, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAds.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No advertisements found matching your criteria.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdsListingPage;