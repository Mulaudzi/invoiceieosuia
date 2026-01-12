import { TemplateStyles } from "@/lib/types";

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  styles: TemplateStyles;
}

export const templatePresets: TemplatePreset[] = [
  {
    id: "vintage-red",
    name: "Vintage Red",
    description: "Classic professional design with warm red tones and elegant typography",
    styles: {
      primaryColor: "#b91c1c",
      accentColor: "#fbbf24",
      fontFamily: "lato",
      headerStyle: "center",
      showLogo: true,
      showBorder: true,
      showWatermark: false,
      tableStyle: "bordered",
    },
  },
  {
    id: "creative-yellow",
    name: "Creative Yellow",
    description: "Bold and energetic design perfect for creative businesses",
    styles: {
      primaryColor: "#ca8a04",
      accentColor: "#0ea5e9",
      fontFamily: "poppins",
      headerStyle: "left",
      showLogo: true,
      showBorder: false,
      showWatermark: false,
      tableStyle: "minimal",
    },
  },
  {
    id: "eco-green",
    name: "Eco Green",
    description: "Fresh and natural design for eco-conscious businesses",
    styles: {
      primaryColor: "#15803d",
      accentColor: "#84cc16",
      fontFamily: "opensans",
      headerStyle: "left",
      showLogo: true,
      showBorder: true,
      showWatermark: false,
      tableStyle: "striped",
    },
  },
  {
    id: "corporate-blue",
    name: "Corporate Blue",
    description: "Professional and trustworthy design for established businesses",
    styles: {
      primaryColor: "#1e40af",
      accentColor: "#06b6d4",
      fontFamily: "inter",
      headerStyle: "left",
      showLogo: true,
      showBorder: true,
      showWatermark: false,
      tableStyle: "striped",
    },
  },
  {
    id: "modern-purple",
    name: "Modern Purple",
    description: "Sleek and contemporary design with a creative edge",
    styles: {
      primaryColor: "#7c3aed",
      accentColor: "#ec4899",
      fontFamily: "poppins",
      headerStyle: "center",
      showLogo: true,
      showBorder: false,
      showWatermark: false,
      tableStyle: "minimal",
    },
  },
  {
    id: "elegant-black",
    name: "Elegant Black",
    description: "Sophisticated and minimalist design for premium services",
    styles: {
      primaryColor: "#18181b",
      accentColor: "#a1a1aa",
      fontFamily: "inter",
      headerStyle: "right",
      showLogo: true,
      showBorder: true,
      showWatermark: false,
      tableStyle: "bordered",
    },
  },
];
