import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import {
  Mail,
  MessageSquare,
  Save,
  Loader2,
  Eye,
  Lock,
  FileText,
  Bell,
  Clock,
  Check,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Template {
  id: string;
  name: string;
  content: string;
  type: 'invoice' | 'reminder' | 'overdue' | 'thank_you';
  isDefault: boolean;
}

interface EmailTemplate extends Template {
  subject: string;
}

const defaultEmailTemplates: EmailTemplate[] = [
  {
    id: 'email_invoice',
    name: 'Invoice Notification',
    subject: 'Invoice {{invoice_number}} from {{business_name}}',
    content: `Dear {{client_name}},

Please find attached your invoice {{invoice_number}} for {{amount}}.

Due Date: {{due_date}}

{{custom_message}}

Thank you for your business!

Best regards,
{{business_name}}`,
    type: 'invoice',
    isDefault: true,
  },
  {
    id: 'email_reminder',
    name: 'Payment Reminder',
    subject: 'Reminder: Invoice {{invoice_number}} Due {{due_date}}',
    content: `Dear {{client_name}},

This is a friendly reminder that invoice {{invoice_number}} for {{amount}} is due on {{due_date}}.

Please arrange payment at your earliest convenience.

If you have already made the payment, please disregard this reminder.

Thank you,
{{business_name}}`,
    type: 'reminder',
    isDefault: true,
  },
  {
    id: 'email_overdue',
    name: 'Overdue Notice',
    subject: 'OVERDUE: Invoice {{invoice_number}} - Payment Required',
    content: `Dear {{client_name}},

This is to notify you that invoice {{invoice_number}} for {{amount}} is now overdue.

Original Due Date: {{due_date}}
Days Overdue: {{days_overdue}}

Please make payment immediately to avoid any further action.

If you have any questions, please contact us.

{{business_name}}`,
    type: 'overdue',
    isDefault: true,
  },
  {
    id: 'email_thank_you',
    name: 'Payment Received',
    subject: 'Thank You! Payment Received for Invoice {{invoice_number}}',
    content: `Dear {{client_name}},

Thank you for your payment of {{amount}} for invoice {{invoice_number}}.

We appreciate your prompt payment and look forward to working with you again.

Best regards,
{{business_name}}`,
    type: 'thank_you',
    isDefault: true,
  },
];

const defaultSmsTemplates: Template[] = [
  {
    id: 'sms_invoice',
    name: 'Invoice Sent',
    content: `Hi {{client_name}}, invoice {{invoice_number}} for {{amount}} has been sent. Due: {{due_date}}. Check your email for details. - {{business_name}}`,
    type: 'invoice',
    isDefault: true,
  },
  {
    id: 'sms_reminder',
    name: 'Payment Reminder',
    content: `Reminder: Invoice {{invoice_number}} for {{amount}} is due on {{due_date}}. Please arrange payment. Questions? Reply to this message. - {{business_name}}`,
    type: 'reminder',
    isDefault: true,
  },
  {
    id: 'sms_overdue',
    name: 'Overdue Notice',
    content: `URGENT: Invoice {{invoice_number}} for {{amount}} is {{days_overdue}} days overdue. Please pay immediately to avoid action. - {{business_name}}`,
    type: 'overdue',
    isDefault: true,
  },
  {
    id: 'sms_thank_you',
    name: 'Payment Received',
    content: `Thank you! Payment of {{amount}} received for invoice {{invoice_number}}. We appreciate your business. - {{business_name}}`,
    type: 'thank_you',
    isDefault: true,
  },
];

const MessageTemplates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'email' | 'sms'>('email');
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(defaultEmailTemplates);
  const [smsTemplates, setSmsTemplates] = useState<Template[]>(defaultSmsTemplates);
  const [activeEmailTemplate, setActiveEmailTemplate] = useState<EmailTemplate>(defaultEmailTemplates[0]);
  const [activeSmsTemplate, setActiveSmsTemplate] = useState<Template>(defaultSmsTemplates[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const isPaidPlan = user?.plan && ['solo', 'pro', 'business'].includes(user.plan);

  const handleSaveEmail = async () => {
    if (!isPaidPlan) return;
    setIsSaving(true);
    try {
      await api.post('/templates/email', activeEmailTemplate);
      setEmailTemplates(prev => 
        prev.map(t => t.id === activeEmailTemplate.id ? activeEmailTemplate : t)
      );
      toast({ title: "Email template saved" });
    } catch (error) {
      toast({ title: "Failed to save template", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSms = async () => {
    if (!isPaidPlan) return;
    setIsSaving(true);
    try {
      await api.post('/templates/sms', activeSmsTemplate);
      setSmsTemplates(prev => 
        prev.map(t => t.id === activeSmsTemplate.id ? activeSmsTemplate : t)
      );
      toast({ title: "SMS template saved" });
    } catch (error) {
      toast({ title: "Failed to save template", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const previewVariables = {
    client_name: 'John Smith',
    invoice_number: 'INV-001',
    amount: 'R1,500.00',
    due_date: '15 Feb 2024',
    business_name: user?.businessName || 'Your Business',
    days_overdue: '7',
    custom_message: 'Your custom message will appear here.',
  };

  const replaceVariables = (text: string) => {
    let result = text;
    Object.entries(previewVariables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  };

  const templateTypes = [
    { id: 'invoice', label: 'Invoice', icon: FileText, description: 'When invoice is sent' },
    { id: 'reminder', label: 'Reminder', icon: Bell, description: 'Before due date' },
    { id: 'overdue', label: 'Overdue', icon: Clock, description: 'After due date' },
    { id: 'thank_you', label: 'Thank You', icon: Check, description: 'Payment received' },
  ];

  if (!isPaidPlan) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="ml-64 transition-all duration-300">
          <DashboardHeader
            title="Message Templates"
            subtitle="Customize email and SMS notifications"
          />
          <main className="p-6">
            <div className="max-w-2xl mx-auto text-center py-16">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Upgrade to Customize Templates
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Email and SMS templates are available on paid plans. 
                Create branded messages that match your business.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-8 max-w-lg mx-auto text-left">
                <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                  <Mail className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Email Templates</p>
                    <p className="text-sm text-muted-foreground">Custom subjects & content</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                  <MessageSquare className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">SMS Templates</p>
                    <p className="text-sm text-muted-foreground">Custom reminder messages</p>
                  </div>
                </div>
              </div>
              <Button variant="accent" size="lg" onClick={() => window.location.href = '/dashboard/subscription'}>
                Upgrade Now
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300">
        <DashboardHeader
          title="Message Templates"
          subtitle="Customize email and SMS notifications for invoices and reminders"
        />

        <main className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'email' | 'sms')}>
            <TabsList className="mb-6">
              <TabsTrigger value="email" className="gap-2">
                <Mail className="w-4 h-4" />
                Email Templates
              </TabsTrigger>
              <TabsTrigger value="sms" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                SMS Templates
              </TabsTrigger>
            </TabsList>

            {/* Email Templates */}
            <TabsContent value="email">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Template List */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Email Types</h3>
                  <div className="space-y-2">
                    {templateTypes.map((type) => {
                      const template = emailTemplates.find(t => t.type === type.id);
                      const isActive = activeEmailTemplate.type === type.id;
                      return (
                        <button
                          key={type.id}
                          onClick={() => template && setActiveEmailTemplate(template)}
                          className={`w-full text-left p-4 rounded-xl border transition-all ${
                            isActive ? 'border-accent bg-accent/5' : 'border-border bg-card hover:border-accent/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isActive ? 'bg-accent text-accent-foreground' : 'bg-muted'
                            }`}>
                              <type.icon className={`w-5 h-5 ${isActive ? '' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{type.label}</p>
                              <p className="text-sm text-muted-foreground">{type.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border">
                    <h4 className="font-medium text-foreground mb-3">Variables</h4>
                    <div className="space-y-1 text-xs">
                      {Object.keys(previewVariables).map(key => (
                        <code key={key} className="block text-accent">{`{{${key}}}`}</code>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Email Editor */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{activeEmailTemplate.name}</CardTitle>
                          <CardDescription>Edit subject and body content</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                            <Eye className="w-4 h-4 mr-2" />
                            {showPreview ? 'Edit' : 'Preview'}
                          </Button>
                          <Button variant="accent" size="sm" onClick={handleSaveEmail} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {showPreview ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-muted/50 rounded-lg border border-border">
                            <p className="text-sm text-muted-foreground mb-1">Subject:</p>
                            <p className="font-medium text-foreground">{replaceVariables(activeEmailTemplate.subject)}</p>
                          </div>
                          <div className="p-4 bg-card rounded-lg border border-border min-h-[300px]">
                            <pre className="whitespace-pre-wrap font-sans text-foreground">{replaceVariables(activeEmailTemplate.content)}</pre>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="subject">Email Subject</Label>
                            <Input
                              id="subject"
                              value={activeEmailTemplate.subject}
                              onChange={(e) => setActiveEmailTemplate({ ...activeEmailTemplate, subject: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="body">Email Body</Label>
                            <Textarea
                              id="body"
                              value={activeEmailTemplate.content}
                              onChange={(e) => setActiveEmailTemplate({ ...activeEmailTemplate, content: e.target.value })}
                              className="mt-1 min-h-[300px] font-mono text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* SMS Templates */}
            <TabsContent value="sms">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Template List */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">SMS Types</h3>
                  <div className="space-y-2">
                    {templateTypes.map((type) => {
                      const template = smsTemplates.find(t => t.type === type.id);
                      const isActive = activeSmsTemplate.type === type.id;
                      return (
                        <button
                          key={type.id}
                          onClick={() => template && setActiveSmsTemplate(template)}
                          className={`w-full text-left p-4 rounded-xl border transition-all ${
                            isActive ? 'border-accent bg-accent/5' : 'border-border bg-card hover:border-accent/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isActive ? 'bg-accent text-accent-foreground' : 'bg-muted'
                            }`}>
                              <type.icon className={`w-5 h-5 ${isActive ? '' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{type.label}</p>
                              <p className="text-sm text-muted-foreground">{type.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 p-4 bg-warning/10 rounded-xl border border-warning/20">
                    <h4 className="font-medium text-foreground mb-2">SMS Tips</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Keep messages under 160 characters</li>
                      <li>• Be clear and concise</li>
                      <li>• Include key details only</li>
                    </ul>
                  </div>
                </div>

                {/* SMS Editor */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{activeSmsTemplate.name}</CardTitle>
                          <CardDescription>Edit SMS message (max 160 chars recommended)</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                            <Eye className="w-4 h-4 mr-2" />
                            {showPreview ? 'Edit' : 'Preview'}
                          </Button>
                          <Button variant="accent" size="sm" onClick={handleSaveSms} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {showPreview ? (
                        <div className="p-6 bg-muted/30 rounded-xl border border-border">
                          <div className="max-w-sm mx-auto">
                            <div className="bg-accent text-accent-foreground rounded-2xl rounded-bl-sm p-4">
                              <p className="text-sm">{replaceVariables(activeSmsTemplate.content)}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 text-right">
                              {replaceVariables(activeSmsTemplate.content).length} characters
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="sms-content">SMS Message</Label>
                            <Textarea
                              id="sms-content"
                              value={activeSmsTemplate.content}
                              onChange={(e) => setActiveSmsTemplate({ ...activeSmsTemplate, content: e.target.value })}
                              className="mt-1 min-h-[150px]"
                              maxLength={500}
                            />
                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                              <span>
                                {activeSmsTemplate.content.length} / 500 characters
                              </span>
                              <span className={activeSmsTemplate.content.length > 160 ? 'text-warning' : 'text-success'}>
                                {activeSmsTemplate.content.length <= 160 ? '1 SMS' : `${Math.ceil(activeSmsTemplate.content.length / 160)} SMS credits`}
                              </span>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-muted/50 rounded-lg border border-border">
                            <h4 className="font-medium text-foreground mb-2">Available Variables</h4>
                            <div className="flex flex-wrap gap-2">
                              {Object.keys(previewVariables).map(key => (
                                <code key={key} className="px-2 py-1 bg-background rounded text-xs text-accent">{`{{${key}}}`}</code>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default MessageTemplates;
