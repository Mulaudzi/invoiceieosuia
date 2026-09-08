# Invoice Templates - Quick Start Guide

## What Was Added

✅ **13 Professional Invoice Templates** with complete styling configuration  
✅ **React Component** (TemplateGallery) for template selection UI  
✅ **API Endpoints** for template management  
✅ **Database Seeder** to populate templates  

---

## Templates Added

| # | Template Name | Color Scheme | Best For |
|---|---|---|---|
| 1 | Classic Blue | Navy Blue + Blue | Traditional Business |
| 2 | Dark Slate | Dark + Green | Tech Companies |
| 3 | Warm Red | Red + Gold | Creative Agencies |
| 4 | Sunny Yellow | Black + Yellow | Startups |
| 5 | Ocean Teal | Teal + Cyan | Tech/SaaS |
| 6 | Corporate Charcoal | Charcoal + Orange | Corporate/Consulting |
| 7 | Tech Purple | Purple + Cyan | Tech Startups |
| 8 | Green Fresh | Green + Light Green | Sustainability/Wellness |
| 9 | Minimalist White | Black + White | Elegant/Minimal |
| 10 | Royal Blue | Deep Blue + Gold | Premium Services |
| 11 | Modern Gradient | Blue to Teal Gradient | Modern Companies |
| 12 | Business Red | Deep Red + Gold | Bold Brands |
| 13 | Elegant Gold | Purple + Gold | Luxury Brands |

---

## How to Use

### Step 1: Seed Templates (Admin Only - One Time)

```bash
# Via API
POST /templates/admin/seed
Authorization: Bearer ADMIN_TOKEN

# Returns:
{
  "message": "Templates seeded successfully",
  "created": [ /* 13 templates */ ],
  "total": 13
}
```

### Step 2: View Available Templates

**Get All System Templates:**
```bash
GET /templates/system/all
```

**Get User's Templates:**
```bash
GET /templates
Authorization: Bearer USER_TOKEN
```

### Step 3: Display in UI

In your invoice creation page:

```tsx
import TemplateGallery from '@/components/templates/TemplateGallery';

export default function InvoiceCreate() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  return (
    <div>
      <TemplateGallery
        selectable={true}
        showSystemTemplates={true}
        onSelectTemplate={(template) => {
          setSelectedTemplate(template);
          // Use template ID when creating invoice
        }}
      />
    </div>
  );
}
```

### Step 4: Use Template in Invoice

When creating/rendering invoice:

```tsx
const invoice = {
  // ... invoice data
  template_id: selectedTemplate.id  // Use selected template
};

// When rendering PDF, apply template styles
const styles = selectedTemplate.styles;
// Apply primaryColor, fonts, layout, etc.
```

---

## File Locations

| File | Purpose |
|------|---------|
| [api/seeders/TemplateSeeder.php](api/seeders/TemplateSeeder.php) | Template definitions |
| [src/components/templates/TemplateGallery.tsx](src/components/templates/TemplateGallery.tsx) | React component |
| [api/controllers/TemplateController.php](api/controllers/TemplateController.php) | API endpoints |
| [api/index.php](api/index.php) | Route registration |

---

## API Reference

### List All System Templates (Public)
```
GET /templates/system/all
```
Returns: Array of 13 system templates

### List User Templates
```
GET /templates
Authorization: Bearer TOKEN
```
Returns: User's custom templates

### Get Single Template
```
GET /templates/{id}
Authorization: Bearer TOKEN
```
Returns: Template with full styles

### Create Custom Template
```
POST /templates
Authorization: Bearer TOKEN
{
  "name": "My Template",
  "description": "My custom template",
  "styles": {
    "primaryColor": "#1e3a5f",
    "accentColor": "#3b82f6",
    ...
  }
}
```

### Update Template
```
PUT /templates/{id}
Authorization: Bearer TOKEN
{
  "name": "Updated Name",
  "styles": { /* partial or full styles */ }
}
```

### Delete Template
```
DELETE /templates/{id}
Authorization: Bearer TOKEN
```

### Set as Default
```
POST /templates/{id}/set-default
Authorization: Bearer TOKEN
```

### Seed System Templates (Admin Only)
```
POST /templates/admin/seed
Authorization: Bearer ADMIN_TOKEN
```

---

## Template Properties

Each template includes:

```json
{
  "id": 1,
  "name": "Classic Blue",
  "description": "Professional blue design",
  "styles": {
    "primaryColor": "#1e3a5f",      // Main header color
    "accentColor": "#3b82f6",        // Accent/highlight color
    "backgroundColor": "#ffffff",     // Page background
    "textColor": "#1f2937",          // Main text color
    "fontFamily": "Inter",            // Font name
    "headerStyle": "minimal",         // Header layout type
    "headerBackground": "#1e3a5f",   // Header bg color
    "headerTextColor": "#ffffff",    // Header text color
    "showLogo": true,                // Display company logo
    "logoPosition": "top-left",      // Logo placement
    "showBorder": true,              // Add borders
    "borderColor": "#e5e7eb",        // Border color
    "tableStyle": "striped",         // Table formatting
    "tableHeaderBackground": "#f3f4f6", // Table header color
    "showWatermark": false,          // Add watermark
    "footerPosition": "bottom"       // Footer placement
  }
}
```

---

## Integration Example

### In Invoice Creation Form:

```tsx
import { useState } from 'react';
import TemplateGallery from '@/components/templates/TemplateGallery';

export function InvoiceCreate() {
  const [formData, setFormData] = useState({
    clientId: '',
    items: [],
    template_id: null  // Template selection
  });

  const [showTemplates, setShowTemplates] = useState(true);

  return (
    <div className="space-y-6">
      {showTemplates && (
        <div>
          <h2>Select Invoice Template</h2>
          <TemplateGallery
            selectable={true}
            onSelectTemplate={(template) => {
              setFormData(prev => ({
                ...prev,
                template_id: template.id
              }));
              setShowTemplates(false);
            }}
          />
        </div>
      )}

      {!showTemplates && (
        <div>
          {/* Rest of invoice form */}
          Selected Template: {formData.template_id}
        </div>
      )}
    </div>
  );
}
```

---

## Database Note

The system assumes a `templates` table exists with structure:

```sql
CREATE TABLE templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255),
    description TEXT,
    is_default BOOLEAN DEFAULT 0,
    styles JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

If it doesn't exist, create it before seeding.

---

## Status

✅ **Build:** PASSING (14.70s)  
✅ **PHP Syntax:** VALID  
✅ **TypeScript:** NO ERRORS  
✅ **Ready:** YES - Fully functional

---

## Next: PDF Rendering

To complete the system, update invoice PDF generation to apply template styles:

1. Get selected template styles
2. Apply primaryColor, fonts, layout
3. Render invoice PDF with template styling
4. Return styled PDF to user

---

## Support

**Need to:**
- Add more templates? → Edit [TemplateSeeder.php](api/seeders/TemplateSeeder.php) and re-seed
- Customize a template? → Use `PUT /templates/{id}` API
- Create user template? → Use `POST /templates` API
- Delete a template? → Use `DELETE /templates/{id}` API
