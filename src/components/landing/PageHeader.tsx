import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  showBackLink?: boolean;
  backLinkText?: string;
  backLinkHref?: string;
  children?: ReactNode;
}

const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  showBackLink = true,
  backLinkText = "Back to Home",
  backLinkHref = "/",
  children
}: PageHeaderProps) => {
  return (
    <section className="bg-primary text-primary-foreground pt-32 pb-16">
      <div className="container mx-auto px-4">
        {showBackLink && (
          <Link 
            to={backLinkHref} 
            className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLinkText}
          </Link>
        )}

        <div className="max-w-4xl">
          {badge && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium mb-6">
              {Icon && <Icon className="w-4 h-4" />}
              {badge}
            </div>
          )}
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {title}
          </h1>
          
          {subtitle && (
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
              {subtitle}
            </p>
          )}

          {children}
        </div>
      </div>
    </section>
  );
};

export default PageHeader;
