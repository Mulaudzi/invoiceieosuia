<?php

/**
 * Template Seeder - MySQL Insert Statements
 * 
 * Copy and paste the SQL statements below into your database
 * No authentication required - just run the SQL directly
 */

class TemplateSeeder {
    
    public static function getTemplateDefinitions(): array {
        return [
            // Template 1: Classic Blue
            [
                'name' => 'Classic Blue',
                'description' => 'Professional blue and white design with clean typography',
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
            // Template 2: Dark Slate
            [
                'name' => 'Dark Slate',
                'description' => 'Dark professional template with white text on dark background',
                'styles' => [
                    'primaryColor' => '#1f2937',
                    'accentColor' => '#10b981',
                    'backgroundColor' => '#2d3748',
                    'textColor' => '#f3f4f6',
                    'fontFamily' => 'Segoe UI',
                    'headerStyle' => 'bold',
                    'headerBackground' => '#1f2937',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => false,
                    'borderColor' => '#4b5563',
                    'tableStyle' => 'modern',
                    'tableHeaderBackground' => '#10b981',
                    'tableHeaderTextColor' => '#ffffff',
                    'showWatermark' => false,
                    'footerPosition' => 'bottom',
                    'template_html' => 'dark-slate'
                ]
            ],
            // Template 3: Elegant Gold
            [
                'name' => 'Elegant Gold',
                'description' => 'Luxurious design with gold accents and serif fonts',
                'styles' => [
                    'primaryColor' => '#78350f',
                    'accentColor' => '#d97706',
                    'backgroundColor' => '#fffbf0',
                    'textColor' => '#5b21b6',
                    'fontFamily' => 'Georgia',
                    'headerStyle' => 'elegant',
                    'headerBackground' => '#78350f',
                    'headerTextColor' => '#fef3c7',
                    'showLogo' => true,
                    'logoPosition' => 'top-center',
                    'showBorder' => true,
                    'borderColor' => '#d97706',
                    'borderWidth' => 2,
                    'tableStyle' => 'classic',
                    'tableHeaderBackground' => '#f59e0b',
                    'tableHeaderTextColor' => '#ffffff',
                    'showWatermark' => false,
                    'footerPosition' => 'bottom',
                    'template_html' => 'elegant-gold'
                ]
            ],
            // Template 4: Modern Green
            [
                'name' => 'Modern Green',
                'description' => 'Contemporary green design focused on sustainability',
                'styles' => [
                    'primaryColor' => '#065f46',
                    'accentColor' => '#10b981',
                    'backgroundColor' => '#f0fdf4',
                    'textColor' => '#047857',
                    'fontFamily' => 'Helvetica',
                    'headerStyle' => 'minimal',
                    'headerBackground' => '#065f46',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => true,
                    'borderColor' => '#a7f3d0',
                    'tableStyle' => 'modern',
                    'tableHeaderBackground' => '#10b981',
                    'tableHeaderTextColor' => '#ffffff',
                    'showWatermark' => false,
                    'footerPosition' => 'bottom',
                    'template_html' => 'modern-green'
                ]
            ],
            // Template 5: Tech Purple
            [
                'name' => 'Tech Purple',
                'description' => 'Vibrant tech-focused design with purple and cyan accents',
                'styles' => [
                    'primaryColor' => '#6b21a8',
                    'accentColor' => '#a855f7',
                    'backgroundColor' => '#faf5ff',
                    'textColor' => '#581c87',
                    'fontFamily' => 'Monaco',
                    'headerStyle' => 'bold',
                    'headerBackground' => '#6b21a8',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => true,
                    'borderColor' => '#e9d5ff',
                    'tableStyle' => 'striped',
                    'tableHeaderBackground' => '#a855f7',
                    'tableHeaderTextColor' => '#ffffff',
                    'showWatermark' => false,
                    'footerPosition' => 'bottom',
                    'template_html' => 'tech-purple'
                ]
            ],
            // Template 6: Minimalist
            [
                'name' => 'Minimalist',
                'description' => 'Clean and simple design with monochrome color scheme',
                'styles' => [
                    'primaryColor' => '#000000',
                    'accentColor' => '#666666',
                    'backgroundColor' => '#ffffff',
                    'textColor' => '#333333',
                    'fontFamily' => 'Calibri',
                    'headerStyle' => 'simple',
                    'headerBackground' => '#ffffff',
                    'headerTextColor' => '#000000',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => false,
                    'borderColor' => '#cccccc',
                    'tableStyle' => 'basic',
                    'tableHeaderBackground' => '#f0f0f0',
                    'tableHeaderTextColor' => '#000000',
                    'showWatermark' => false,
                    'footerPosition' => 'bottom',
                    'template_html' => 'minimalist'
                ]
            ],
            // Template 7: Corporate Red
            [
                'name' => 'Corporate Red',
                'description' => 'Bold corporate design with red and gray tones',
                'styles' => [
                    'primaryColor' => '#991b1b',
                    'accentColor' => '#dc2626',
                    'backgroundColor' => '#fafafa',
                    'textColor' => '#1f2937',
                    'fontFamily' => 'Arial',
                    'headerStyle' => 'bold',
                    'headerBackground' => '#991b1b',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => true,
                    'borderColor' => '#fed7d7',
                    'tableStyle' => 'modern',
                    'tableHeaderBackground' => '#dc2626',
                    'tableHeaderTextColor' => '#ffffff',
                    'showWatermark' => false,
                    'footerPosition' => 'bottom',
                    'template_html' => 'corporate-red'
                ]
            ],
            // Template 8: Ocean Blue
            [
                'name' => 'Ocean Blue',
                'description' => 'Serene ocean-themed design with gradient effects',
                'styles' => [
                    'primaryColor' => '#0369a1',
                    'accentColor' => '#06b6d4',
                    'backgroundColor' => '#f0f9ff',
                    'textColor' => '#0c4a6e',
                    'fontFamily' => 'Verdana',
                    'headerStyle' => 'gradient',
                    'headerBackground' => '#0369a1',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => true,
                    'borderColor' => '#cffafe',
                    'tableStyle' => 'striped',
                    'tableHeaderBackground' => '#06b6d4',
                    'tableHeaderTextColor' => '#ffffff',
                    'showWatermark' => false,
                    'footerPosition' => 'bottom',
                    'template_html' => 'ocean-blue'
                ]
            ],
            // Template 9: Sunset Orange
            [
                'name' => 'Sunset Orange',
                'description' => 'Warm and inviting design with orange and yellow tones',
                'styles' => [
                    'primaryColor' => '#b45309',
                    'accentColor' => '#f59e0b',
                    'backgroundColor' => '#fffbeb',
                    'textColor' => '#92400e',
                    'fontFamily' => 'Trebuchet MS',
                    'headerStyle' => 'bold',
                    'headerBackground' => '#b45309',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => true,
                    'borderColor' => '#fde68a',
                    'tableStyle' => 'modern',
                    'tableHeaderBackground' => '#f59e0b',
                    'tableHeaderTextColor' => '#ffffff',
                    'showWatermark' => false,
                    'footerPosition' => 'bottom',
                    'template_html' => 'sunset-orange'
                ]
            ],
            // Template 10: Professional Gray
            [
                'name' => 'Professional Gray',
                'description' => 'Neutral gray design suitable for all industries',
                'styles' => [
                    'primaryColor' => '#4b5563',
                    'accentColor' => '#6b7280',
                    'backgroundColor' => '#ffffff',
                    'textColor' => '#374151',
                    'fontFamily' => 'Tahoma',
                    'headerStyle' => 'minimal',
                    'headerBackground' => '#4b5563',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => true,
                    'borderColor' => '#d1d5db',
                    'tableStyle' => 'striped',
                    'tableHeaderBackground' => '#e5e7eb',
                    'tableHeaderTextColor' => '#1f2937',
                    'showWatermark' => false,
                    'footerPosition' => 'bottom',
                    'template_html' => 'professional-gray'
                ]
            ],
            // Template 11: Vibrant Teal
            [
                'name' => 'Vibrant Teal',
                'description' => 'Modern design with teal and mint green accents',
                'styles' => [
                    'primaryColor' => '#0d9488',
                    'accentColor' => '#14b8a6',
                    'backgroundColor' => '#f0fdfa',
                    'textColor' => '#134e4a',
                    'fontFamily' => 'Lucida Grande',
                    'headerStyle' => 'bold',
                    'headerBackground' => '#0d9488',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => true,
                    'borderColor' => '#99f6e4',
                    'tableStyle' => 'modern',
                    'tableHeaderBackground' => '#14b8a6',
                    'tableHeaderTextColor' => '#ffffff',
                    'showWatermark' => false,
                    'footerPosition' => 'bottom',
                    'template_html' => 'vibrant-teal'
                ]
            ],
            // Template 12: Sunset Pink
            [
                'name' => 'Sunset Pink',
                'description' => 'Soft and feminine design with pink and rose tones',
                'styles' => [
                    'primaryColor' => '#be185d',
                    'accentColor' => '#ec4899',
                    'backgroundColor' => '#fdf2f8',
                    'textColor' => '#831843',
                    'fontFamily' => 'Century Gothic',
                    'headerStyle' => 'elegant',
                    'headerBackground' => '#be185d',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => true,
                    'borderColor' => '#fbcfe8',
                    'tableStyle' => 'classic',
                    'tableHeaderBackground' => '#ec4899',
                    'tableHeaderTextColor' => '#ffffff',
                    'showWatermark' => false,
                    'footerPosition' => 'bottom',
                    'template_html' => 'sunset-pink'
                ]
            ],
            // Template 13: Tech Slate
            [
                'name' => 'Tech Slate',
                'description' => 'Modern technical design with slate and sky blue colors',
                'styles' => [
                    'primaryColor' => '#334155',
                    'accentColor' => '#0ea5e9',
                    'backgroundColor' => '#f1f5f9',
                    'textColor' => '#1e293b',
                    'fontFamily' => 'Courier New',
                    'headerStyle' => 'bold',
                    'headerBackground' => '#334155',
                    'headerTextColor' => '#ffffff',
                    'showLogo' => true,
                    'logoPosition' => 'top-left',
                    'showBorder' => true,
                    'borderColor' => '#cbd5e1',
                    'tableStyle' => 'modern',
                    'tableHeaderBackground' => '#0ea5e9',
                    'tableHeaderTextColor' => '#ffffff',
                    'showWatermark' => false,
                    'footerPosition' => 'bottom',
                    'template_html' => 'tech-slate'
                ]
            ]
        ];
    }
}

// Generate SQL statements
echo "====================================\n";
echo "Invoice Template SQL Seeder\n";
echo "====================================\n";
echo "Copy and paste the SQL below into your database:\n\n";

$templates = TemplateSeeder::getTemplateDefinitions();
$sql = [];

// Add header comment
echo "-- Invoice Templates\n";
echo "-- Run these INSERT statements in your MySQL database\n\n";

$isDefault = true;
foreach ($templates as $template) {
    $name = addslashes($template['name']);
    $description = addslashes($template['description']);
    $styles = json_encode($template['styles']);
    $styles = addslashes($styles);
    $default = $isDefault ? 1 : 0;
    
    $statement = "INSERT INTO templates (user_id, name, description, is_default, styles, created_at, updated_at) 
VALUES (0, '$name', '$description', $default, '$styles', NOW(), NOW());";
    
    echo $statement . "\n";
    $isDefault = false;
}

echo "\n-- Total: " . count($templates) . " templates\n";
echo "-- All templates are system templates (user_id = 0)\n";

?>
