import type { ReactNode } from "react";

type SocialLink = {
  name: "Instagram" | "Facebook" | "TikTok";
  href: string;
  icon: ReactNode;
};

const iconClass = "h-5 w-5";

const socialLinks: SocialLink[] = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/ieosuia_official/",
    icon: (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 5.675A6.162 6.162 0 1 0 12 20.162 6.162 6.162 0 0 0 12 7.838zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 1 0 2.881 1.44 1.44 0 0 1 0-2.881z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/ieosuia/",
    icon: (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073C24 5.446 18.627.073 12 .073S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@ieosuia",
    icon: (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 1 1-2-2.757V9.403a6.329 6.329 0 1 0 5.445 6.269V8.738a8.182 8.182 0 0 0 4.773 1.526V6.82a4.85 4.85 0 0 1-1.003-.134z" />
      </svg>
    ),
  },
];

type IEOSUIASocialLinksProps = {
  className?: string;
  linkClassName?: string;
};

const IEOSUIASocialLinks = ({ className = "flex items-center gap-3", linkClassName = "" }: IEOSUIASocialLinksProps) => (
  <div className={className} aria-label="IEOSUIA social media">
    {socialLinks.map(({ name, href, icon }) => (
      <a
        key={name}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`IEOSUIA on ${name}`}
        className={linkClassName}
      >
        {icon}
      </a>
    ))}
  </div>
);

export default IEOSUIASocialLinks;
