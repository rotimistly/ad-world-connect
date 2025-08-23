import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: number;
}

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    loadAnnouncements();
    
    // Load dismissed announcements from localStorage
    const dismissed = localStorage.getItem('dismissedAnnouncements');
    if (dismissed) {
      setDismissedAnnouncements(JSON.parse(dismissed));
    }
  }, []);

  const loadAnnouncements = async () => {
    try {
      const { data } = await supabase
        .from('announcements')
        .select('id, title, content, priority')
        .eq('is_published', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3);

      if (data) {
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const dismissAnnouncement = (announcementId: string) => {
    const newDismissed = [...dismissedAnnouncements, announcementId];
    setDismissedAnnouncements(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
  };

  const visibleAnnouncements = announcements.filter(
    announcement => !dismissedAnnouncements.includes(announcement.id)
  );

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-8">
      {visibleAnnouncements.map((announcement) => (
        <Card key={announcement.id} className="bg-gradient-primary text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    Priority {announcement.priority}
                  </Badge>
                  <h3 className="font-semibold text-lg">{announcement.title}</h3>
                </div>
                <p className="text-white/90">{announcement.content}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissAnnouncement(announcement.id)}
                className="text-white/80 hover:text-white hover:bg-white/20 ml-4"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AnnouncementBanner;