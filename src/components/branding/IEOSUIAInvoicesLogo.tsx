import { cn } from "@/lib/utils";
import standardLogo from "@/assets/IEOSUIA Invoices Standard.png";
import darkLogo from "@/assets/IEOSUIA Invoices Dark.png";
import lightLogo from "@/assets/IEOSUIA Invoices Light.png";
import highContrastLogo from "@/assets/IEOSUIA Invoices High Contrast.png";

export type IEOSUIAInvoicesLogoVariant = "standard" | "dark" | "light" | "high-contrast";
export type IEOSUIAInvoicesLogoSize = "mobile" | "header" | "footer" | "auth" | "sidebar";

const sources: Record<IEOSUIAInvoicesLogoVariant, string> = {
  standard: standardLogo,
  dark: darkLogo,
  light: lightLogo,
  "high-contrast": highContrastLogo,
};

const sizes: Record<IEOSUIAInvoicesLogoSize, string> = {
  mobile: "h-7 max-w-[9.5rem]",
  header: "h-9 max-w-[11rem] sm:h-10 sm:max-w-[12rem]",
  footer: "h-11 max-w-[13rem] sm:h-12 sm:max-w-[14rem]",
  auth: "h-12 max-w-[15rem] sm:h-14 sm:max-w-[17rem]",
  sidebar: "h-8 max-w-[10.5rem]",
};

interface IEOSUIAInvoicesLogoProps {
  variant?: IEOSUIAInvoicesLogoVariant;
  size?: IEOSUIAInvoicesLogoSize;
  className?: string;
  decorative?: boolean;
  loading?: "eager" | "lazy";
}

/** Approved IEOSUIA Invoices identity. Variant selection is explicit and background-led. */
const IEOSUIAInvoicesLogo = ({
  variant = "standard",
  size = "header",
  className,
  decorative = false,
  loading = "eager",
}: IEOSUIAInvoicesLogoProps) => (
  <img
    src={sources[variant]}
    alt={decorative ? "" : "IEOSUIA Invoices"}
    aria-hidden={decorative || undefined}
    width={2172}
    height={724}
    loading={loading}
    decoding="async"
    className={cn("block w-auto max-w-full object-contain", sizes[size], className)}
  />
);

export default IEOSUIAInvoicesLogo;
