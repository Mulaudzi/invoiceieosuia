import { useState } from "react";
import { Template, TemplateStyles, defaultTemplateStyles } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Save, X } from "lucide-react";

interface TemplateEditorProps {
  template: Template | null;
  onSave: (name: string, description: string, styles: TemplateStyles) => void;
  onCancel: () => void;
}

const colorPresets = [
  { name: "Blue", value: "#2563eb" },
  { name: "Green", value: "#16a34a" },
  { name: "Purple", value: "#7c3aed" },
  { name: "Orange", value: "#ea580c" },
  { name: "Red", value: "#dc2626" },
  { name: "Teal", value: "#0d9488" },
  { name: "Pink", value: "#db2777" },
  { name: "Black", value: "#18181b" },
];

const fontOptions = [
  { value: "inter", label: "Inter" },
  { value: "poppins", label: "Poppins" },
  { value: "roboto", label: "Roboto" },
  { value: "opensans", label: "Open Sans" },
  { value: "lato", label: "Lato" },
];

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [styles, setStyles] = useState<TemplateStyles>(
    template?.styles || { ...defaultTemplateStyles }
  );

  const updateStyle = <K extends keyof TemplateStyles>(key: K, value: TemplateStyles[K]) => {
    setStyles((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name, description, styles);
  };

  // Sample invoice data for preview
  const sampleData = {
    invoiceNumber: "INV-001",
    date: "2024-01-15",
    dueDate: "2024-02-15",
    company: "IEOSUIA Business",
    client: "Acme Corporation",
    items: [
      { name: "Web Development", qty: 2, price: 15000 },
      { name: "UI/UX Design", qty: 1, price: 8500 },
    ],
  };

  const subtotal = sampleData.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  const formatCurrency = (amount: number) =>
    `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;

  return (
    <div className="grid lg:grid-cols-2 gap-6 h-full">
      {/* Editor Panel */}
      <div className="bg-card rounded-xl border border-border p-6 overflow-y-auto">
        <h3 className="font-semibold text-foreground mb-6">Template Settings</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Professional Blue"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Colors</h4>
            <div>
              <Label className="text-xs text-muted-foreground">Primary Color</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {colorPresets.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => updateStyle("primaryColor", color.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      styles.primaryColor === color.value
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
                <input
                  type="color"
                  value={styles.primaryColor}
                  onChange={(e) => updateStyle("primaryColor", e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Accent Color</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {colorPresets.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => updateStyle("accentColor", color.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      styles.accentColor === color.value
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
                <input
                  type="color"
                  value={styles.accentColor}
                  onChange={(e) => updateStyle("accentColor", e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Typography</h4>
            <div>
              <Label>Font Family</Label>
              <Select
                value={styles.fontFamily}
                onValueChange={(v) => updateStyle("fontFamily", v as TemplateStyles["fontFamily"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Layout */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Layout</h4>
            <div>
              <Label>Header Alignment</Label>
              <Select
                value={styles.headerStyle}
                onValueChange={(v) => updateStyle("headerStyle", v as TemplateStyles["headerStyle"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Table Style</Label>
              <Select
                value={styles.tableStyle}
                onValueChange={(v) => updateStyle("tableStyle", v as TemplateStyles["tableStyle"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="striped">Striped</SelectItem>
                  <SelectItem value="bordered">Bordered</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Options</h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="showLogo">Show Logo</Label>
              <Switch
                id="showLogo"
                checked={styles.showLogo}
                onCheckedChange={(v) => updateStyle("showLogo", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showBorder">Show Border</Label>
              <Switch
                id="showBorder"
                checked={styles.showBorder}
                onCheckedChange={(v) => updateStyle("showBorder", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showWatermark">Show Watermark</Label>
              <Switch
                id="showWatermark"
                checked={styles.showWatermark}
                onCheckedChange={(v) => updateStyle("showWatermark", v)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button type="submit" variant="accent" className="flex-1">
              <Save className="w-4 h-4 mr-1" />
              Save Template
            </Button>
          </div>
        </form>
      </div>

      {/* Preview Panel */}
      <div className="bg-muted/30 rounded-xl border border-border p-6 overflow-y-auto">
        <h3 className="font-semibold text-foreground mb-4">Live Preview</h3>
        
        <div
          className={`bg-white rounded-lg shadow-lg p-6 text-gray-900 ${
            styles.showBorder ? "border-2" : ""
          }`}
          style={{
            borderColor: styles.showBorder ? styles.primaryColor : "transparent",
            fontFamily: styles.fontFamily,
          }}
        >
          {/* Watermark */}
          {styles.showWatermark && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 text-6xl font-bold"
              style={{ color: styles.primaryColor }}
            >
              SAMPLE
            </div>
          )}

          {/* Header */}
          <div
            className={`flex items-start gap-4 mb-6 pb-4 border-b-2 ${
              styles.headerStyle === "center"
                ? "flex-col items-center text-center"
                : styles.headerStyle === "right"
                ? "flex-row-reverse"
                : ""
            }`}
            style={{ borderColor: styles.primaryColor }}
          >
            {styles.showLogo && (
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: styles.primaryColor }}
              >
                <FileText className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold" style={{ color: styles.primaryColor }}>
                {sampleData.company}
              </h1>
              <p className="text-sm text-gray-500">Invoice #{sampleData.invoiceNumber}</p>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p className="font-medium" style={{ color: styles.primaryColor }}>Bill To:</p>
              <p>{sampleData.client}</p>
            </div>
            <div className="text-right">
              <p><span className="text-gray-500">Date:</span> {sampleData.date}</p>
              <p><span className="text-gray-500">Due:</span> {sampleData.dueDate}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr
                style={{
                  backgroundColor:
                    styles.tableStyle === "striped" || styles.tableStyle === "bordered"
                      ? `${styles.primaryColor}15`
                      : "transparent",
                  borderBottom:
                    styles.tableStyle !== "minimal" ? `2px solid ${styles.primaryColor}` : "1px solid #e5e7eb",
                }}
              >
                <th className="text-left py-2 px-2">Item</th>
                <th className="text-center py-2 px-2">Qty</th>
                <th className="text-right py-2 px-2">Price</th>
                <th className="text-right py-2 px-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {sampleData.items.map((item, idx) => (
                <tr
                  key={idx}
                  style={{
                    backgroundColor:
                      styles.tableStyle === "striped" && idx % 2 === 1
                        ? `${styles.primaryColor}08`
                        : "transparent",
                    borderBottom:
                      styles.tableStyle === "bordered" ? `1px solid ${styles.primaryColor}30` : "none",
                  }}
                >
                  <td className="py-2 px-2">{item.name}</td>
                  <td className="text-center py-2 px-2">{item.qty}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(item.price)}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(item.qty * item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-48 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">VAT (15%):</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div
                className="flex justify-between py-2 font-bold border-t-2 mt-1"
                style={{ borderColor: styles.primaryColor, color: styles.primaryColor }}
              >
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
            Thank you for your business!
          </div>
        </div>
      </div>
    </div>
  );
}
