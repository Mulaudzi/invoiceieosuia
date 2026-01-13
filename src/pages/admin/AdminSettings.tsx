import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Inbox, 
  Mail, 
  BarChart3, 
  LogOut, 
  RefreshCw,
  Settings,
  Bell,
  Save,
  Plus,
  X,
  Check,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAdminToken, removeAdminToken } from "./AdminLogin";
import api from "@/services/api";

interface NotificationSetting {
  id: number;
  notification_type: string;
  enabled: boolean;
  email_recipients: string;
}

const notificationTypeLabels: Record<string, { label: string; description: string }> = {
  new_contact_submission: {
    label: "New Contact Submissions",
    description: "Receive instant alerts when someone submits a contact form"
  },
  email_bounce: {
    label: "Email Bounces",
    description: "Get notified when emails fail to deliver or bounce"
  },
  daily_summary: {
    label: "Daily Summary",
    description: "Receive a daily digest of contact submissions and email activity"
  },
};

const AdminSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newEmails, setNewEmails] = useState<Record<string, string>>({});

  const fetchSettings = async () => {
    const token = getAdminToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get('/admin/notification-settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data.settings || []);
    } catch (error: any) {
      if (error.response?.status === 401) {
        removeAdminToken();
        navigate('/admin/login');
      } else {
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleLogout = async () => {
    const token = getAdminToken();
    try {
      await api.post('/admin/logout', { admin_token: token });
    } catch (e) {
      // Ignore errors
    }
    removeAdminToken();
    navigate('/admin/login');
  };

  const handleToggle = async (settingType: string, enabled: boolean) => {
    const token = getAdminToken();
    
    try {
      await api.put('/admin/notification-settings', 
        { notification_type: settingType, enabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSettings(prev => prev.map(s => 
        s.notification_type === settingType ? { ...s, enabled } : s
      ));
      
      toast({
        title: "Setting updated",
        description: `${enabled ? 'Enabled' : 'Disabled'} ${notificationTypeLabels[settingType]?.label || settingType}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    }
  };

  const handleAddEmail = async (settingType: string) => {
    const email = newEmails[settingType]?.trim();
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    const token = getAdminToken();
    const setting = settings.find(s => s.notification_type === settingType);
    const currentEmails = setting?.email_recipients?.split(',').map(e => e.trim()).filter(Boolean) || [];
    
    if (currentEmails.includes(email)) {
      toast({
        title: "Email exists",
        description: "This email is already in the list",
        variant: "destructive",
      });
      return;
    }

    const updatedEmails = [...currentEmails, email].join(', ');

    try {
      await api.put('/admin/notification-settings', 
        { notification_type: settingType, email_recipients: updatedEmails },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSettings(prev => prev.map(s => 
        s.notification_type === settingType ? { ...s, email_recipients: updatedEmails } : s
      ));
      setNewEmails(prev => ({ ...prev, [settingType]: '' }));
      
      toast({
        title: "Email added",
        description: `${email} will now receive notifications`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add email",
        variant: "destructive",
      });
    }
  };

  const handleRemoveEmail = async (settingType: string, emailToRemove: string) => {
    const token = getAdminToken();
    const setting = settings.find(s => s.notification_type === settingType);
    const currentEmails = setting?.email_recipients?.split(',').map(e => e.trim()).filter(Boolean) || [];
    const updatedEmails = currentEmails.filter(e => e !== emailToRemove).join(', ');

    try {
      await api.put('/admin/notification-settings', 
        { notification_type: settingType, email_recipients: updatedEmails },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSettings(prev => prev.map(s => 
        s.notification_type === settingType ? { ...s, email_recipients: updatedEmails } : s
      ));
      
      toast({
        title: "Email removed",
        description: `${emailToRemove} removed from notifications`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove email",
        variant: "destructive",
      });
    }
  };

  const getEmailList = (recipients: string): string[] => {
    if (!recipients) return [];
    return recipients.split(',').map(e => e.trim()).filter(Boolean);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-6 h-6" />
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchSettings}
                className="text-primary-foreground hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-primary-foreground hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 py-3">
            <Link 
              to="/admin/dashboard" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Overview
            </Link>
            <Link 
              to="/admin/submissions" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Inbox className="w-4 h-4" />
              Submissions
            </Link>
            <Link 
              to="/admin/email-logs" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email Logs
            </Link>
            <Link 
              to="/admin/settings" 
              className="flex items-center gap-2 text-accent font-medium"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-accent" />
            <div>
              <h2 className="text-2xl font-bold">Notification Settings</h2>
              <p className="text-muted-foreground">Configure email notifications for admin alerts</p>
            </div>
          </div>

          <div className="space-y-6">
            {settings.map((setting) => {
              const typeInfo = notificationTypeLabels[setting.notification_type];
              const emails = getEmailList(setting.email_recipients);
              
              return (
                <Card key={setting.notification_type}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {typeInfo?.label || setting.notification_type}
                          {setting.enabled ? (
                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Disabled</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {typeInfo?.description || 'Notification setting'}
                        </CardDescription>
                      </div>
                      <Switch
                        checked={setting.enabled}
                        onCheckedChange={(checked) => handleToggle(setting.notification_type, checked)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Label className="text-sm font-medium mb-3 block">
                      Email Recipients
                    </Label>
                    
                    {/* Current emails */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {emails.length > 0 ? (
                        emails.map((email) => (
                          <Badge 
                            key={email} 
                            variant="outline" 
                            className="flex items-center gap-1 px-3 py-1"
                          >
                            {email}
                            <button
                              onClick={() => handleRemoveEmail(setting.notification_type, email)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No recipients configured</p>
                      )}
                    </div>
                    
                    {/* Add new email */}
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="Add email address..."
                        value={newEmails[setting.notification_type] || ''}
                        onChange={(e) => setNewEmails(prev => ({ 
                          ...prev, 
                          [setting.notification_type]: e.target.value 
                        }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddEmail(setting.notification_type);
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={() => handleAddEmail(setting.notification_type)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {settings.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No notification settings found. Please run the database migrations.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
