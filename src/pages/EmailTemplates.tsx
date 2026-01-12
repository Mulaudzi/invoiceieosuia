import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCredits } from "@/hooks/useCredits";
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

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'invoice' | 'reminder' | 'overdue' | 'thank_you';
  isDefault: boolean;
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: 'invoice',
    name: 'Invoice Notification',
    subject: 'Invoice {{invoice_number}} from {{business_name}}',
    body: `Dear {{client_name}},

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
    id: 'reminder',
    name: 'Payment Reminder',
    subject: 'Reminder: Invoice {{invoice_number}} Due {{due_date}}',
    body: `Dear {{client_name}},

This is a friendly reminder that invoice {{invoice_number}} for {{amount}} is due on {{due_date}}.

Please arrange payment at your earliest convenience.

If you have already made the payment, please disregard this reminder.

Thank you,
{{business_name}}`,
    type: 'reminder',
    isDefault: true,
  },
  {
    id: 'overdue',
    name: 'Overdue Notice',
    subject: 'OVERDUE: Invoice {{invoice_number}} - Payment Required',
    body: `Dear {{client_name}},

This is to notify you that invoice {{invoice_number}} for {{amount}} is now overdue.

Original Due Date: {{due_date}}
Days Overdue: {{days_overdue}}

Please make payment immediately to avoid any further action.

If you have any questions or concerns, please contact us immediately.

{{business_name}}`,
    type: 'overdue',
    isDefault: true,
  },
  {
    id: 'thank_you',
    name: 'Payment Received',
    subject: 'Thank You! Payment Received for Invoice {{invoice_number}}',
    body: `Dear {{client_name}},

Thank you for your payment of {{amount}} for invoice {{invoice_number}}.

We appreciate your prompt payment and look forward to working with you again.

Best regards,
{{business_name}}`,
    type: 'thank_you',
    isDefault: true,
  },
];

const EmailTemplates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: credits } = useCredits();
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [activeTemplate, setActiveTemplate] = useState<EmailTemplate>(defaultTemplates[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const isPaidPlan = user?.plan && ['solo', 'pro', 'business'].includes(user.plan);

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setActiveTemplate(template);
    }
  };

  const handleSave = async () => {
    if (!isPaidPlan) {
      toast({
        title: "Upgrade Required",
        description: "Email templates are available on paid plans only.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Save template to API
      await api.post('/templates/email', activeTemplate);
      
      // Update local state
      setTemplates(prev => 
        prev.map(t => t.id === activeTemplate.id ? activeTemplate : t)
      );
      
      toast({
        title: "Template saved",
        description: `${activeTemplate.name} has been updated.`,
      });
    } catch (error) {
      toast({
        title: "Failed to save template",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const previewContent = activeTemplate.body
    .replace(/{{client_name}}/g, 'John Smith')
    .replace(/{{invoice_number}}/g, 'INV-001')
    .replace(/{{amount}}/g, 'R1,500.00')
    .replace(/{{due_date}}/g, '15 Feb 2024')
    .replace(/{{business_name}}/g, user?.businessName || 'Your Business')
    .replace(/{{days_overdue}}/g, '7')
    .replace(/{{custom_message}}/g, 'Your custom message will appear here.');

  const templateTypes = [
    { id: 'invoice', label: 'Invoice', icon: FileText, description: 'Sent when invoice is created' },
    { id: 'reminder', label: 'Reminder', icon: Bell, description: 'Payment reminder before due date' },
    { id: 'overdue', label: 'Overdue', icon: Clock, description: 'Sent when invoice is past due' },
    { id: 'thank_you', label: 'Thank You', icon: Check, description: 'Sent after payment received' },
  ];

  if (!isPaidPlan) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="ml-64 transition-all duration-300">
          <DashboardHeader
            title="Email Templates"
            subtitle="Customize email notifications for invoices and reminders"
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
                Email templates are available on Solo, Pro, and Business plans. 
                Create branded, professional emails that match your business identity.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-8 max-w-lg mx-auto text-left">
                <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                  <Mail className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Custom Subjects</p>
                    <p className="text-sm text-muted-foreground">Personalized email subjects</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                  <FileText className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Branded Content</p>
                    <p className="text-sm text-muted-foreground">Your own email body text</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                  <Bell className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Reminder Templates</p>
                    <p className="text-sm text-muted-foreground">Custom payment reminders</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                  <MessageSquare className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">SMS Templates</p>
                    <p className="text-sm text-muted-foreground">Custom SMS messages</p>
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
          title="Email Templates"
          subtitle="Customize email notifications for invoices and reminders"
        />

        <main className="p-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Template List */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Template Types</h3>
              <div className="space-y-2">
                {templateTypes.map((type) => {
                  const template = templates.find(t => t.type === type.id);
                  const isActive = activeTemplate.type === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => template && handleTemplateChange(template.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isActive
                          ? 'border-accent bg-accent/5'
                          : 'border-border bg-card hover:border-accent/50'
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

              {/* Variables Reference */}
              <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border">
                <h4 className="font-medium text-foreground mb-3">Available Variables</h4>
                <div className="space-y-1 text-sm">
                  <code className="block text-accent">{'{{client_name}}'}</code>
                  <code className="block text-accent">{'{{invoice_number}}'}</code>
                  <code className="block text-accent">{'{{amount}}'}</code>
                  <code className="block text-accent">{'{{due_date}}'}</code>
                  <code className="block text-accent">{'{{business_name}}'}</code>
                  <code className="block text-accent">{'{{custom_message}}'}</code>
                  <code className="block text-accent">{'{{days_overdue}}'}</code>
                </div>
              </div>
            </div>

            {/* Template Editor */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{activeTemplate.name}</CardTitle>
                      <CardDescription>Edit the email subject and body content</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {showPreview ? 'Edit' : 'Preview'}
                      </Button>
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
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
                        <p className="font-medium text-foreground">
                          {activeTemplate.subject
                            .replace(/{{invoice_number}}/g, 'INV-001')
                            .replace(/{{business_name}}/g, user?.businessName || 'Your Business')
                            .replace(/{{due_date}}/g, '15 Feb 2024')}
                        </p>
                      </div>
                      <div className="p-4 bg-card rounded-lg border border-border min-h-[300px]">
                        <pre className="whitespace-pre-wrap font-sans text-foreground">
                          {previewContent}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="subject">Email Subject</Label>
                        <Input
                          id="subject"
                          value={activeTemplate.subject}
                          onChange={(e) => setActiveTemplate({
                            ...activeTemplate,
                            subject: e.target.value
                          })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="body">Email Body</Label>
                        <Textarea
                          id="body"
                          value={activeTemplate.body}
                          onChange={(e) => setActiveTemplate({
                            ...activeTemplate,
                            body: e.target.value
                          })}
                          className="mt-1 min-h-[300px] font-mono text-sm"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmailTemplates;
