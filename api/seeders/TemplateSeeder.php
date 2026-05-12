<?php

/**
 * Template Seeder for Invoice Templates
 * Seeds 13 professional invoice templates to the database
 * 
 * Run this via: POST /api/templates/seed
 * Admin only endpoint
 */

class TemplateSeeder {
    
    public static function seedDefaultTemplates(): array {
        $templates = [
            // Template 1: Classic Blue - Professional and minimal
            [
                'name' => 'Classic Blue',
                'description' => 'Professional blue and white design with clean typography',
                'is_system' => true,
                'styles' => [
                    'primaryColor' => '#1e3a5f',
                    'accentColor' => '#3b82f6',
                    'backgroundColor' => '#ffffff',
                    'textColor' => '#1f2937',
                    'fontFamily' => 'Inter',
                    'headerStyle' => 'minimal',
                    'headerBackground' => '#1e3a5f',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => true,
                    'borderColor' => '#e5e7eb',
                    'tableStyle' => 'striped',
                    'tableHeaderBackground' => '#f3f4f6',
                    'showWatermark' => false,
                    'footerPosition' => 'bottom',
                    'template_html' => 'classic-blue'
                ]
            ],
            // Template 2: Dark Slate - Modern dark theme
            [
                'name' => 'Dark Slate',
                'description' => 'Dark professional template with white text on dark background',
                'is_system' => true,
                'styles' => [
                    'primaryColor' => '#1f2937',
                    'accentColor' => '#10b981',
                    'backgroundColor' => '#2d3748',
                    'textColor' => '#f3f4f6',
                    'fontFamily' => 'Segoe UI',
                    'headerStyle' => 'full-width',
                    'headerBackground' => '#1f2937',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => false,
                    'tableStyle' => 'clean',
                    'tableHeaderBackground' => '#374151',
                    'showWatermark' => false,
                    'template_html' => 'dark-slate'
                ]
            ],
            // Template 3: Warm Red - Bold and vibrant
            [
                'name' => 'Warm Red',
                'description' => 'Bold red design with energetic color scheme',
                'is_system' => true,
                'styles' => [
                    'primaryColor' => '#dc2626',
                    'accentColor' => '#fbbf24',
                    'backgroundColor' => '#ffffff',
                    'textColor' => '#1f2937',
                    'fontFamily' => 'Poppins',
                    'headerStyle' => 'diagonal',
                    'headerBackground' => '#dc2626',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => true,
                    'borderColor' => '#dc2626',
                    'tableStyle' => 'striped',
                    'tableHeaderBackground' => '#dc2626',
                    'showWatermark' => false,
                    'template_html' => 'warm-red'
                ]
            ],
            // Template 4: Sunny Yellow - Cheerful and bright
            [
                'name' => 'Sunny Yellow',
                'description' => 'Bright yellow accent with black and white contrast',
                'is_system' => true,
                'styles' => [
                    'primaryColor' => '#000000',
                    'accentColor' => '#fbbf24',
                    'backgroundColor' => '#ffffff',
                    'textColor' => '#1f2937',
                    'fontFamily' => 'Montserrat',
                    'headerStyle' => 'full-width',
                    'headerBackground' => '#000000',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => true,
                    'borderColor' => '#fbbf24',
                    'tableStyle' => 'striped',
                    'tableHeaderBackground' => '#fbbf24',
                    'showWatermark' => false,
                    'template_html' => 'sunny-yellow'
                ]
            ],
            // Template 5: Ocean Teal - Cool and professional
            [
                'name' => 'Ocean Teal',
                'description' => 'Teal blue with navy accents, professional and modern',
                'is_system' => true,
                'styles' => [
                    'primaryColor' => '#0891b2',
                    'accentColor' => '#06b6d4',
                    'backgroundColor' => '#ffffff',
                    'textColor' => '#1f2937',
                    'fontFamily' => 'System UI',
                    'headerStyle' => 'curved',
                    'headerBackground' => '#0891b2',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-center',
                    'showBorder' => false,
                    'tableStyle' => 'clean',
                    'tableHeaderBackground' => '#06b6d4',
                    'showWatermark' => false,
                    'template_html' => 'ocean-teal'
                ]
            ],
            // Template 6: Corporate Charcoal - Formal and elegant
            [
                'name' => 'Corporate Charcoal',
                'description' => 'Formal charcoal with orange accents for corporate use',
                'is_system' => true,
                'styles' => [
                    'primaryColor' => '#374151',
                    'accentColor' => '#f97316',
                    'backgroundColor' => '#ffffff',
                    'textColor' => '#1f2937',
                    'fontFamily' => 'Georgia',
                    'headerStyle' => 'minimal',
                    'headerBackground' => '#374151',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => true,
                    'borderColor' => '#374151',
                    'tableStyle' => 'striped',
                    'tableHeaderBackground' => '#f97316',
                    'showWatermark' => false,
                    'template_html' => 'corporate-charcoal'
                ]
            ],
            // Template 7: Tech Purple - Modern and creative
            [
                'name' => 'Tech Purple',
                'description' => 'Purple and blue gradient with modern tech aesthetic',
                'is_system' => true,
                'styles' => [
                    'primaryColor' => '#7c3aed',
                    'accentColor' => '#06b6d4',
                    'backgroundColor' => '#ffffff',
                    'textColor' => '#1f2937',
                    'fontFamily' => 'Inter',
                    'headerStyle' => 'gradient',
                    'headerBackground' => '#7c3aed',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-center',
                    'showBorder' => false,
                    'tableStyle' => 'clean',
                    'tableHeaderBackground' => '#7c3aed',
                    'showWatermark' => false,
                    'template_html' => 'tech-purple'
                ]
            ],
            // Template 8: Green Fresh - Eco-friendly vibe
            [
                'name' => 'Green Fresh',
                'description' => 'Green and light colors with nature-inspired design',
                'is_system' => true,
                'styles' => [
                    'primaryColor' => '#059669',
                    'accentColor' => '#10b981',
                    'backgroundColor' => '#f0fdf4',
                    'textColor' => '#1f2937',
                    'fontFamily' => 'Segoe UI',
                    'headerStyle' => 'full-width',
                    'headerBackground' => '#059669',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => true,
                    'borderColor' => '#10b981',
                    'tableStyle' => 'clean',
                    'tableHeaderBackground' => '#10b981',
                    'showWatermark' => false,
                    'template_html' => 'green-fresh'
                ]
            ],
            // Template 9: Minimalist White - Ultra clean
            [
                'name' => 'Minimalist White',
                'description' => 'Minimal design with just essential elements',
                'is_system' => true,
                'styles' => [
                    'primaryColor' => '#000000',
                    'accentColor' => '#d1d5db',
                    'backgroundColor' => '#ffffff',
                    'textColor' => '#374151',
                    'fontFamily' => 'Arial',
                    'headerStyle' => 'text-only',
                    'headerBackground' => '#ffffff',
                    'headerTextColor' => '#000000',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => false,
                    'tableStyle' => 'clean',
                    'tableHeaderBackground' => '#ffffff',
                    'showWatermark' => false,
                    'template_html' => 'minimalist-white'
                ]
            ],
            // Template 10: Royal Blue - Premium look
            [
                'name' => 'Royal Blue',
                'description' => 'Deep blue with gold accents for premium invoices',
                'is_system' => true,
                'styles' => [
                    'primaryColor' => '#1e40af',
                    'accentColor' => '#fbbf24',
                    'backgroundColor' => '#ffffff',
                    'textColor' => '#1f2937',
                    'fontFamily' => 'Times New Roman',
                    'headerStyle' => 'full-width',
                    'headerBackground' => '#1e40af',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-center',
                    'showBorder' => true,
                    'borderColor' => '#fbbf24',
                    'tableStyle' => 'striped',
                    'tableHeaderBackground' => '#1e40af',
                    'showWatermark' => false,
                    'template_html' => 'royal-blue'
                ]
            ],
            // Template 11: Modern Gradient - Contemporary design
            [
                'name' => 'Modern Gradient',
                'description' => 'Blue to teal gradient header with modern elements',
                'is_system' => true,
                'styles' => [
                    'primaryColor' => '#0284c7',
                    'accentColor' => '#06b6d4',
                    'backgroundColor' => '#ffffff',
                    'textColor' => '#1f2937',
                    'fontFamily' => 'Roboto',
                    'headerStyle' => 'gradient-diagonal',
                    'headerBackground' => 'linear-gradient(135deg, #0284c7, #06b6d4)',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => false,
                    'tableStyle' => 'clean',
                    'tableHeaderBackground' => '#0284c7',
                    'showWatermark' => false,
                    'template_html' => 'modern-gradient'
                ]
            ],
            // Template 12: Business Red - Strong and professional
            [
                'name' => 'Business Red',
                'description' => 'Red and dark navy for powerful business impression',
                'is_system' => true,
                'styles' => [
                    'primaryColor' => '#991b1b',
                    'accentColor' => '#fbbf24',
                    'backgroundColor' => '#ffffff',
                    'textColor' => '#1f2937',
                    'fontFamily' => 'Helvetica',
                    'headerStyle' => 'sidebar',
                    'headerBackground' => '#991b1b',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'left-sidebar',
                    'showBorder' => true,
                    'borderColor' => '#991b1b',
                    'tableStyle' => 'striped',
                    'tableHeaderBackground' => '#991b1b',
                    'showWatermark' => false,
                    'template_html' => 'business-red'
                ]
            ],
            // Template 13: Elegant Gold - Luxury design
            [
                'name' => 'Elegant Gold',
                'description' => 'Luxury design with gold and deep purple accents',
                'is_system' => true,
                'styles' => [
                    'primaryColor' => '#312e81',
                    'accentColor' => '#d97706',
                    'backgroundColor' => '#faf8f3',
                    'textColor' => '#1f2937',
                    'fontFamily' => 'Garamond',
                    'headerStyle' => 'luxury',
                    'headerBackground' => '#312e81',
                    'headerTextColor' => '#fbbf24',
                    'showLogo' => true,
                    'logoPosition' => 'top-center',
                    'showBorder' => true,
                    'borderColor' => '#d97706',
                    'tableStyle' => 'clean',
                    'tableHeaderBackground' => '#312e81',
                    'showWatermark' => true,
                    'template_html' => 'elegant-gold'
                ]
            ]
        ];
        
        return $templates;
    }
    
    public static function seed(): array {
        $templates = self::seedDefaultTemplates();
        $created = [];
        
        foreach ($templates as $template) {
            try {
                // Create template for system (admin user, or user_id = 0 for global)
                $id = Template::query()->create([
                    'user_id' => 0, // 0 = system/global templates
                    'name' => $template['name'],
                    'description' => $template['description'],
                    'is_default' => 0,
                    'styles' => json_encode($template['styles'])
                ]);
                
                $created[] = [
                    'id' => $id,
                    'name' => $template['name'],
                    'status' => 'created'
                ];
            } catch (Exception $e) {
                $created[] = [
                    'name' => $template['name'],
                    'status' => 'error',
                    'error' => $e->getMessage()
                ];
            }
        }
        
        return $created;
    }
}
