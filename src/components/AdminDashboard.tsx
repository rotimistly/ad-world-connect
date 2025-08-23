import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Users, FileText, MessageSquare, TrendingUp, Trash2, Plus, Edit } from "lucide-react";

interface AdminStats {
  total_users: number;
  total_ads: number;
  paid_ads: number;
  total_businesses: number;
  total_messages: number;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

interface Ad {
  id: string;
  headline: string;
  business_name: string;
  paid: boolean;
  created_at: string;
  views: number;
  clicks: number;
  messages: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  created_at: string;
  priority: number;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // Announcement form state
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    is_published: false,
    priority: 1
  });
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (roleData) {
        setIsAdmin(true);
        await loadAdminData();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      // Load stats using the secure function
      const { data: statsData } = await supabase.rpc('get_admin_stats');
      if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

      // Load users with profiles
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });
      
      if (usersData) {
        setUsers(usersData);
      }

      // Load ads with business names
      const { data: adsData } = await supabase
        .from('ads')
        .select(`
          id, 
          headline, 
          paid, 
          created_at, 
          views, 
          clicks, 
          messages,
          businesses (business_name)
        `)
        .order('created_at', { ascending: false });

      if (adsData) {
        setAds(adsData.map(ad => ({
          ...ad,
          business_name: ad.businesses?.business_name || 'N/A'
        })));
      }

      // Load announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (announcementsData) {
        setAnnouncements(announcementsData);
      }

    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // This will cascade delete all related data due to foreign keys
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) throw error;

      toast.success('User deleted successfully');
      await loadAdminData(); // Reload data
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const deleteAd = async (adId: string) => {
    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', adId);

      if (error) throw error;

      toast.success('Ad deleted successfully');
      await loadAdminData(); // Reload data
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error('Failed to delete ad');
    }
  };

  const createAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          ...newAnnouncement,
          author_id: user!.id
        });

      if (error) throw error;

      toast.success('Announcement created successfully');
      setNewAnnouncement({ title: "", content: "", is_published: false, priority: 1 });
      await loadAdminData();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
    }
  };

  const updateAnnouncement = async () => {
    if (!editingAnnouncement) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .update({
          title: editingAnnouncement.title,
          content: editingAnnouncement.content,
          is_published: editingAnnouncement.is_published,
          priority: editingAnnouncement.priority
        })
        .eq('id', editingAnnouncement.id);

      if (error) throw error;

      toast.success('Announcement updated successfully');
      setEditingAnnouncement(null);
      await loadAdminData();
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('Failed to update announcement');
    }
  };

  const deleteAnnouncement = async (announcementId: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);

      if (error) throw error;

      toast.success('Announcement deleted successfully');
      await loadAdminData();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading admin dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Please log in to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You don't have admin privileges to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, ads, and announcements</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_users}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ads</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_ads}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid Ads</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.paid_ads}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Businesses</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_businesses}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_messages}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="ads">Ads</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.full_name || 'N/A'}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this user and all their data. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteUser(user.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads">
            <Card>
              <CardHeader>
                <CardTitle>Ad Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Headline</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ads.map((ad) => (
                      <TableRow key={ad.id}>
                        <TableCell>{ad.headline}</TableCell>
                        <TableCell>{ad.business_name}</TableCell>
                        <TableCell>
                          <Badge variant={ad.paid ? "default" : "secondary"}>
                            {ad.paid ? "Paid" : "Unpaid"}
                          </Badge>
                        </TableCell>
                        <TableCell>{ad.views}</TableCell>
                        <TableCell>{ad.clicks}</TableCell>
                        <TableCell>{ad.messages}</TableCell>
                        <TableCell>{new Date(ad.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Ad</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this ad. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteAd(ad.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <div className="space-y-6">
              {/* Create New Announcement */}
              <Card>
                <CardHeader>
                  <CardTitle>Create New Announcement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Announcement title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority (1-5)</Label>
                      <Input
                        id="priority"
                        type="number"
                        min="1"
                        max="5"
                        value={newAnnouncement.priority}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={newAnnouncement.content}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Announcement content"
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="published"
                      checked={newAnnouncement.is_published}
                      onCheckedChange={(checked) => setNewAnnouncement(prev => ({ ...prev, is_published: checked }))}
                    />
                    <Label htmlFor="published">Publish immediately</Label>
                  </div>

                  <Button onClick={createAnnouncement}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Announcement
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Announcements */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Announcements</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {announcements.map((announcement) => (
                        <TableRow key={announcement.id}>
                          <TableCell>{announcement.title}</TableCell>
                          <TableCell>
                            <Badge variant={announcement.is_published ? "default" : "secondary"}>
                              {announcement.is_published ? "Published" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell>{announcement.priority}</TableCell>
                          <TableCell>{new Date(announcement.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingAnnouncement(announcement)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete this announcement. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteAnnouncement(announcement.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Edit Announcement Dialog */}
              {editingAnnouncement && (
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Announcement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="edit-title">Title</Label>
                        <Input
                          id="edit-title"
                          value={editingAnnouncement.title}
                          onChange={(e) => setEditingAnnouncement(prev => prev ? { ...prev, title: e.target.value } : null)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-priority">Priority (1-5)</Label>
                        <Input
                          id="edit-priority"
                          type="number"
                          min="1"
                          max="5"
                          value={editingAnnouncement.priority}
                          onChange={(e) => setEditingAnnouncement(prev => prev ? { ...prev, priority: parseInt(e.target.value) } : null)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-content">Content</Label>
                      <Textarea
                        id="edit-content"
                        value={editingAnnouncement.content}
                        onChange={(e) => setEditingAnnouncement(prev => prev ? { ...prev, content: e.target.value } : null)}
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-published"
                        checked={editingAnnouncement.is_published}
                        onCheckedChange={(checked) => setEditingAnnouncement(prev => prev ? { ...prev, is_published: checked } : null)}
                      />
                      <Label htmlFor="edit-published">Published</Label>
                    </div>

                    <div className="space-x-2">
                      <Button onClick={updateAnnouncement}>
                        Update Announcement
                      </Button>
                      <Button variant="outline" onClick={() => setEditingAnnouncement(null)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
