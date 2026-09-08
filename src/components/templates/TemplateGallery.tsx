import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Edit,
  Eye,
  Grid,
  List,
  Search,
  Plus
} from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";

interface InvoiceTemplate {
  id: number;
  name: string;
  description: string;
  styles: Record<string, any>;
  is_default: boolean;
  user_id: number;
}

interface TemplatePreviewProps {
  template: InvoiceTemplate;
  onSelect?: (template: InvoiceTemplate) => void;
  onEdit?: (template: InvoiceTemplate) => void;
  selectable?: boolean;
}

const TemplatePreview = ({ template, onSelect, onEdit, selectable = false }: TemplatePreviewProps) => {
  const styles = template.styles || {};
  const primaryColor = styles.primaryColor || '#1e3a5f';
  const accentColor = styles.accentColor || '#3b82f6';
  
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header Preview */}
      <div 
        style={{ backgroundColor: primaryColor }}
        className="h-20 flex items-center justify-between px-4"
      >
        <div className="text-white font-bold text-lg">INVOICE</div>
        <div className="text-white text-sm opacity-75">Company Logo</div>
      </div>

      {/* Content Preview */}
      <div className="p-4 space-y-3">
        <div className="text-sm font-semibold text-gray-800">{template.name}</div>
        <p className="text-xs text-gray-600 line-clamp-2">{template.description}</p>
        
        {/* Color Preview */}
        <div className="flex gap-2">
          <div className="flex-1 flex gap-1">
            <div 
              className="h-6 flex-1 rounded"
              style={{ backgroundColor: primaryColor }}
              title={`Primary: ${primaryColor}`}
            />
            <div 
              className="h-6 flex-1 rounded"
              style={{ backgroundColor: accentColor }}
              title={`Accent: ${accentColor}`}
            />
          </div>
        </div>

        {/* Font Info */}
        <div className="text-xs text-gray-500">
          Font: <span style={{ fontFamily: styles.fontFamily || 'Inter' }}>{styles.fontFamily || 'Inter'}</span>
        </div>

        {/* Table Preview */}
        <div className="border border-gray-300 rounded overflow-hidden text-xs">
          <div className="bg-gray-100 px-2 py-1 font-semibold text-gray-700">
            Items Table Preview
          </div>
          <div className="px-2 py-1 text-gray-600">Table Style: {styles.tableStyle || 'striped'}</div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(template)}
              className="flex-1"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
          {selectable && onSelect && (
            <Button
              size="sm"
              onClick={() => onSelect(template)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Check className="h-3 w-3 mr-1" />
              Use Template
            </Button>
          )}
        </div>

        {template.is_default && (
          <Badge className="w-full justify-center bg-green-100 text-green-800">
            Default Template
          </Badge>
        )}
      </div>
    </div>
  );
};

interface TemplateGalleryProps {
  selectable?: boolean;
  onSelectTemplate?: (template: InvoiceTemplate) => void;
  showSystemTemplates?: boolean;
}

export const TemplateGallery = ({ 
  selectable = false, 
  onSelectTemplate,
  showSystemTemplates = true 
}: TemplateGalleryProps) => {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [systemTemplates, setSystemTemplates] = useState<InvoiceTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user templates
      const userResponse = await api.get('/templates');
      setTemplates(userResponse.data || []);

      // Fetch system templates if needed
      if (showSystemTemplates) {
        const systemResponse = await api.get('/templates/system/all');
        setSystemTemplates(systemResponse.data || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredUserTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSystemTemplates = systemTemplates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectTemplate = (template: InvoiceTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
      toast({
        title: "Success",
        description: `Selected template: ${template.name}`,
      });
    }
  };

  const handlePreview = (template: InvoiceTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Invoice Templates</h2>
          <p className="text-gray-600">Choose a template for your invoices</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            onClick={() => setViewMode('grid')}
            size="sm"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            size="sm"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* User Templates */}
          {templates.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Your Templates ({filteredUserTemplates.length})</h3>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {filteredUserTemplates.length > 0 ? (
                  filteredUserTemplates.map(template => (
                    <TemplatePreview
                      key={template.id}
                      template={template}
                      selectable={selectable}
                      onSelect={handleSelectTemplate}
                      onEdit={handlePreview}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No templates match your search
                  </div>
                )}
              </div>
            </div>
          )}

          {/* System Templates */}
          {showSystemTemplates && systemTemplates.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">System Templates ({filteredSystemTemplates.length})</h3>
              <p className="text-sm text-gray-600 mb-4">Professional templates ready to use</p>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {filteredSystemTemplates.length > 0 ? (
                  filteredSystemTemplates.map(template => (
                    <TemplatePreview
                      key={template.id}
                      template={template}
                      selectable={selectable}
                      onSelect={handleSelectTemplate}
                      onEdit={handlePreview}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No templates match your search
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {templates.length === 0 && systemTemplates.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">No Templates Available</h3>
                  <p className="text-gray-600 mb-4">Create your first template to get started</p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Preview Dialog */}
      {selectedTemplate && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTemplate.name} - Full Preview</DialogTitle>
              <DialogDescription>{selectedTemplate.description}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Detailed Settings Display */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Primary Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-12 h-12 rounded border"
                      style={{ backgroundColor: selectedTemplate.styles?.primaryColor }}
                    />
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {selectedTemplate.styles?.primaryColor}
                    </code>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Accent Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-12 h-12 rounded border"
                      style={{ backgroundColor: selectedTemplate.styles?.accentColor }}
                    />
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {selectedTemplate.styles?.accentColor}
                    </code>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Font Family</label>
                  <div className="mt-1 text-sm" style={{ fontFamily: selectedTemplate.styles?.fontFamily }}>
                    {selectedTemplate.styles?.fontFamily || 'Not specified'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Header Style</label>
                  <div className="mt-1 text-sm capitalize">
                    {selectedTemplate.styles?.headerStyle || 'Not specified'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Table Style</label>
                  <div className="mt-1 text-sm capitalize">
                    {selectedTemplate.styles?.tableStyle || 'Not specified'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Show Logo</label>
                  <div className="mt-1 text-sm">
                    {selectedTemplate.styles?.showLogo ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
              {selectable && (
                <Button
                  onClick={() => {
                    handleSelectTemplate(selectedTemplate);
                    setShowPreview(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Use This Template
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TemplateGallery;
