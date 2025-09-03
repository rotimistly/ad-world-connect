import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Eye, MousePointer, TrendingUp, Share2, Users, BarChart3 } from "lucide-react";

interface AdPlatform {
  id: string;
  platform_name: string;
  reach_count: number;
  impressions: number;
  clicks: number;
  engagement_rate: number;
  status: string;
  platform_post_id: string;
}

interface AdPlatformAnalyticsProps {
  adId: string;
  adHeadline: string;
  showDetailedView?: boolean;
}

const PLATFORM_ICONS = {
  'Facebook': '📘',
  'Instagram': '📸',
  'Twitter': '🐦',
  'LinkedIn': '💼',
  'Google Ads': '🔍',
  'TikTok': '🎵',
  'YouTube': '▶️'
};

const PLATFORM_COLORS = {
  'Facebook': 'bg-blue-500/10 text-blue-600 border-blue-200',
  'Instagram': 'bg-pink-500/10 text-pink-600 border-pink-200',
  'Twitter': 'bg-sky-500/10 text-sky-600 border-sky-200',
  'LinkedIn': 'bg-blue-700/10 text-blue-700 border-blue-300',
  'Google Ads': 'bg-green-500/10 text-green-600 border-green-200',
  'TikTok': 'bg-purple-500/10 text-purple-600 border-purple-200',
  'YouTube': 'bg-red-500/10 text-red-600 border-red-200'
};

const AdPlatformAnalytics: React.FC<AdPlatformAnalyticsProps> = ({ 
  adId, 
  adHeadline,
  showDetailedView = false 
}) => {
  const [platforms, setPlatforms] = useState<AdPlatform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(showDetailedView);

  useEffect(() => {
    loadPlatformData();
  }, [adId]);

  const loadPlatformData = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_platforms')
        .select('*')
        .eq('ad_id', adId)
        .order('reach_count', { ascending: false });

      if (error) throw error;
      setPlatforms(data || []);
    } catch (error) {
      console.error('Error loading platform data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalReach = () => platforms.reduce((sum, p) => sum + p.reach_count, 0);
  const getTotalImpressions = () => platforms.reduce((sum, p) => sum + p.impressions, 0);
  const getTotalClicks = () => platforms.reduce((sum, p) => sum + p.clicks, 0);
  const getAverageEngagement = () => {
    if (platforms.length === 0) return 0;
    return platforms.reduce((sum, p) => sum + p.engagement_rate, 0) / platforms.length;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (platforms.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <Share2 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No platform data available</p>
          <p className="text-xs text-muted-foreground">Platforms will appear here after publishing</p>
        </CardContent>
      </Card>
    );
  }

  const renderSummaryView = () => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-sm font-medium">Platform Reach</CardTitle>
            <CardDescription className="text-xs">
              {platforms.length} platform{platforms.length !== 1 ? 's' : ''} • {getTotalReach().toLocaleString()} total reach
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
            className="h-8 px-2"
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Impressions</p>
            <p className="text-sm font-semibold">{getTotalImpressions().toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Clicks</p>
            <p className="text-sm font-semibold">{getTotalClicks().toLocaleString()}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-3">
          {platforms.slice(0, 4).map((platform) => (
            <Badge 
              key={platform.id} 
              variant="secondary" 
              className={`text-xs ${PLATFORM_COLORS[platform.platform_name as keyof typeof PLATFORM_COLORS] || ''}`}
            >
              {PLATFORM_ICONS[platform.platform_name as keyof typeof PLATFORM_ICONS] || '📍'} {platform.platform_name}
            </Badge>
          ))}
          {platforms.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{platforms.length - 4} more
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderDetailedView = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Platform Analytics</CardTitle>
            <CardDescription>
              Performance breakdown for "{adHeadline}"
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Reach</span>
            </div>
            <p className="text-lg font-bold">{getTotalReach().toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Impressions</span>
            </div>
            <p className="text-lg font-bold">{getTotalImpressions().toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MousePointer className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Clicks</span>
            </div>
            <p className="text-lg font-bold">{getTotalClicks().toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Avg. Engagement</span>
            </div>
            <p className="text-lg font-bold">{(getAverageEngagement() * 100).toFixed(1)}%</p>
          </div>
        </div>

        {/* Individual Platform Performance */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Platform Breakdown</h4>
          {platforms.map((platform) => (
            <div key={platform.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {PLATFORM_ICONS[platform.platform_name as keyof typeof PLATFORM_ICONS] || '📍'}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{platform.platform_name}</p>
                    <Badge 
                      variant={platform.status === 'published' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {platform.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{platform.reach_count.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">reach</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Impressions</p>
                  <p className="font-semibold">{platform.impressions.toLocaleString()}</p>
                  <div className="mt-1">
                    <Progress 
                      value={(platform.impressions / getTotalImpressions()) * 100} 
                      className="h-1"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Clicks</p>
                  <p className="font-semibold">{platform.clicks.toLocaleString()}</p>
                  <div className="mt-1">
                    <Progress 
                      value={(platform.clicks / Math.max(getTotalClicks(), 1)) * 100} 
                      className="h-1"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Engagement</p>
                  <p className="font-semibold">{(platform.engagement_rate * 100).toFixed(1)}%</p>
                  <div className="mt-1">
                    <Progress 
                      value={platform.engagement_rate * 100} 
                      className="h-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return expanded ? renderDetailedView() : renderSummaryView();
};

export default AdPlatformAnalytics;