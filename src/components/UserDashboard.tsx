import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Plus, Eye, MousePointer, MessageCircle, Calendar, DollarSign, Trash2, LogOut, Menu, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import AdPlatformAnalytics from "./AdPlatformAnalytics";

interface Ad {
  id: string;
  headline: string;
  body_text: string;
  region: string;
  distance_km: number;
  price_paid: number;
  views: number;
  clicks: number;
  messages: number;
  paid: boolean;
  published_at: string;
  expires_at: string;
  is_fixed_price: boolean;
  fixed_price_expires_at: string;
  created_at: string;
  selected_platforms?: string[];
}

interface AdPlatform {
  id: string;
  platform_name: string;
  reach_count: number;
  impressions: number;
  clicks: number;
  engagement_rate: number;
  status: string;
}

interface Business {
  id: string;
  business_name: string;
  business_description: string;
  email: string;
  phone_number: string;
  whatsapp_link: string;
}

interface ContactMessage {
  id: string;
  sender_name: string;
  sender_email: string;
  message: string;
  platform: string;
  created_at: string;
  ad: {
    headline: string;
  };
}

const UserDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
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
    loadUserData();
  };

  const loadUserData = async () => {
    try {
      // Load businesses
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', (await supabase.auth.getSession()).data.session?.user.id);

      if (businessError) throw businessError;
      setBusinesses(businessData || []);

      if (businessData && businessData.length > 0) {
        // Load ads for user's businesses
        const { data: adsData, error: adsError } = await supabase
          .from('ads')
          .select('*')
          .in('business_id', businessData.map(b => b.id))
          .order('created_at', { ascending: false });

        if (adsError) throw adsError;
        setAds(adsData || []);

        // Load contact messages for ads belonging to user's businesses
        const adIds = adsData?.map(ad => ad.id) || [];
        if (adIds.length > 0) {
          const { data: messagesData, error: messagesError } = await supabase
            .from('contact_messages')
            .select('*')
            .in('ad_id', adIds)
            .order('created_at', { ascending: false });

          if (messagesError) throw messagesError;
          
          // Transform the data and add ad headlines
          const transformedMessages = (messagesData || []).map(msg => {
            const relatedAd = adsData?.find(ad => ad.id === msg.ad_id);
            return {
              ...msg,
              ad: {
                headline: relatedAd?.headline || 'Unknown Ad'
              }
            };
          });
          setContactMessages(transformedMessages);
        }

        // Load announcements
        const { data: announcementsData, error: announcementsError } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_published', true)
          .order('priority', { ascending: false })
          .order('created_at', { ascending: false });

        if (!announcementsError && announcementsData) {
          setAnnouncements(announcementsData);
        }
      }

      // Load announcements for all users
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_published', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (!announcementsError && announcementsData) {
        setAnnouncements(announcementsData);
      }
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleDeleteAd = async (adId: string) => {
    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', adId);

      if (error) throw error;

      setAds(prev => prev.filter(ad => ad.id !== adId));
      toast({
        title: "Success",
        description: "Ad deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Delete user's businesses (cascade will handle ads and payments)
      const { error: businessError } = await supabase
        .from('businesses')
        .delete()
        .eq('user_id', user.id);

      if (businessError) throw businessError;

      // Sign out and delete account
      await supabase.auth.signOut();
      
      toast({
        title: "Account deleted",
        description: "Your account and all data have been deleted successfully",
      });
      
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getAdStatusColor = (ad: Ad) => {
    if (!ad.paid) return "secondary";
    if (ad.is_fixed_price && new Date(ad.fixed_price_expires_at) < new Date()) return "destructive";
    if (new Date(ad.expires_at) < new Date()) return "destructive";
    return "default";
  };

  const getAdStatus = (ad: Ad) => {
    if (!ad.paid) return "Unpaid";
    if (ad.is_fixed_price && new Date(ad.fixed_price_expires_at) < new Date()) return "Expired (Fixed)";
    if (new Date(ad.expires_at) < new Date()) return "Expired";
    return "Active";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
            >
              {showHamburgerMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
            <Button onClick={() => window.location.href = '/create-ad'} className="shadow-elegant">
              <Plus className="w-4 h-4 mr-2" />
              Create Ad
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Hamburger Menu */}
        {showHamburgerMenu && (
          <Card className="mb-6 shadow-elegant">
            <CardHeader>
              <CardTitle>Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Button 
                  onClick={() => window.location.href = '/create-ad'}
                  className="h-16 text-left justify-start gap-4"
                  variant="outline"
                >
                  <Plus className="w-8 h-8" />
                  <div>
                    <div className="font-medium">Create New Ad</div>
                    <div className="text-sm text-muted-foreground">
                      Post a new advertisement
                    </div>
                  </div>
                </Button>
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="h-16 text-left justify-start gap-4"
                  variant="outline"
                >
                  <User className="w-8 h-8" />
                  <div>
                    <div className="font-medium">Dashboard</div>
                    <div className="text-sm text-muted-foreground">
                      Back to main dashboard
                    </div>
                  </div>
                </Button>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">User Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Full Name</Label>
                    <p className="text-sm text-muted-foreground">{user?.user_metadata?.full_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Businesses</Label>
                    <p className="text-sm text-muted-foreground">{businesses.length}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Account Created</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(user?.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ads">My Ads ({ads.length})</TabsTrigger>
            <TabsTrigger value="messages">Messages ({contactMessages.length})</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Ads</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ads.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {ads.filter(ad => ad.paid).length} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {ads.reduce((sum, ad) => sum + (ad.views || 0), 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contactMessages.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Total inquiries
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Ads</CardTitle>
                </CardHeader>
                <CardContent>
                  {ads.slice(0, 5).map((ad) => (
                    <div key={ad.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{ad.headline}</p>
                        <p className="text-sm text-muted-foreground">{ad.region}</p>
                      </div>
                      <Badge variant={getAdStatusColor(ad) as any}>
                        {getAdStatus(ad)}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  {contactMessages.slice(0, 5).map((message) => (
                    <div key={message.id} className="py-2 border-b last:border-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium">{message.sender_name}</p>
                        <Badge variant="outline">{message.platform}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {message.message.substring(0, 100)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ads">
            <div className="grid gap-6">
              {ads.map((ad) => (
                <Card key={ad.id} className="shadow-card">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{ad.headline}</CardTitle>
                        <CardDescription>{ad.body_text}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={getAdStatusColor(ad) as any}>
                          {getAdStatus(ad)}
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Ad</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this ad? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteAd(ad.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{ad.views || 0} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MousePointer className="w-4 h-4" />
                        <span>{ad.clicks || 0} clicks</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{ad.messages || 0} messages</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>${ad.price_paid || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{ad.distance_km}km range</span>
                      </div>
                    </div>
                    
                    {/* Platform Analytics */}
                    {ad.paid && (
                      <AdPlatformAnalytics 
                        adId={ad.id}
                        adHeadline={ad.headline}
                        showDetailedView={false}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {ads.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground mb-4">You haven't created any ads yet.</p>
                    <Button onClick={() => window.location.href = '/create-ad'}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Ad
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <div className="space-y-4">
              {contactMessages.map((message) => (
                <Card key={message.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{message.sender_name}</CardTitle>
                        <CardDescription>{message.sender_email}</CardDescription>
                      </div>
                      <Badge variant="outline">{message.platform}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2">{message.message}</p>
                    <p className="text-sm text-muted-foreground">
                      Regarding: {message.ad?.headline || 'Ad'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
              
              {contactMessages.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No messages yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="account">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Your account details and settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Full Name</Label>
                      <p className="text-sm text-muted-foreground">
                        {user?.user_metadata?.full_name || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Member Since</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(user?.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your account and all associated data including ads, 
                          payments, and messages. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAccount}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Moving Announcements Banner */}
        {announcements.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground py-2 overflow-hidden z-50">
            <div className="animate-marquee whitespace-nowrap">
              {announcements.map((announcement, index) => (
                <span key={announcement.id} className="inline-block px-8">
                  📢 {announcement.title}: {announcement.content}
                  {index < announcements.length - 1 && " • "}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;