import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  RefreshCw,
  Bell,
  Plus,
  X,
  AlertCircle,
  KeyRound
} from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAdminToken, removeAdminToken } from "@/services/adminAuth";
import api from "@/services/api";
import AdminLayout from "@/components/admin/AdminLayout";

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
  const [newEmails, setNewEmails] = useState<Record<string, string>>({});
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinSaving, setPinSaving] = useState(false);

  const handleChangePin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6,12}$/.test(newPin)) {
      toast({ title: "Check the new PIN", description: "The new PIN must contain 6 to 12 digits.", variant: "destructive" });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: "PINs do not match", description: "Re-enter the same new PIN in both fields.", variant: "destructive" });
      return;
    }
    setPinSaving(true);
    try {
      const token = getAdminToken();
      const response = await api.put('/guymhan/pin', { current_pin: currentPin, new_pin: newPin }, { headers: { Authorization: `Bearer ${token}` } });
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      toast({ title: "PIN changed", description: response.data?.message || "Your administrator PIN was updated." });
    } catch (error: any) {
      toast({ title: "PIN was not changed", description: error.response?.data?.message || "Check the current PIN and try again.", variant: "destructive" });
    } finally {
      setPinSaving(false);
    }
  };

  const fetchSettings = async () => {
    const token = getAdminToken();
    if (!token) {
      navigate('/guymhan/login');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get('/guymhan/notification-settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data.settings || []);
    } catch (error: any) {
      if (error.response?.status === 401) {
        removeAdminToken();
        navigate('/guymhan/login');
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

  const handleToggle = async (settingType: string, enabled: boolean) => {
    const token = getAdminToken();
    
    try {
      await api.put('/guymhan/notification-settings', 
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
      await api.put('/guymhan/notification-settings', 
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
      await api.put('/guymhan/notification-settings', 
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

  return (
    <AdminLayout>
      <main className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Notification Settings</h1>
                <p className="text-muted-foreground">Configure email notifications for admin alerts</p>
              </div>
            </div>
            <Button variant="outline" onClick={fetchSettings} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5" /> Administrator PIN</CardTitle>
                  <CardDescription>Change the PIN required after administrator password authentication.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePin} className="space-y-4">
                    <div><Label htmlFor="current-admin-pin">Current PIN</Label><Input id="current-admin-pin" type="password" inputMode="numeric" value={currentPin} onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 12))} required /></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><Label htmlFor="new-admin-pin">New PIN</Label><Input id="new-admin-pin" type="password" inputMode="numeric" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 12))} required /></div>
                      <div><Label htmlFor="confirm-admin-pin">Confirm new PIN</Label><Input id="confirm-admin-pin" type="password" inputMode="numeric" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 12))} required /></div>
                    </div>
                    <Button type="submit" disabled={pinSaving || !currentPin || !newPin || !confirmPin}>{pinSaving ? "Changing PIN..." : "Change PIN"}</Button>
                  </form>
                </CardContent>
              </Card>

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
          )}
        </div>
      </main>
    </AdminLayout>
  );
};

export default AdminSettings;
