import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BarChart3,
  Palette,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  RefreshCw,
  TrendingUp,
  Menu,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import logoWhite from "@/assets/ieosuia-invoices-logo-white.png";

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const toggle = () => setMobileOpen(value => !value);
    const close = () => setMobileOpen(false);
    window.addEventListener('dashboard-menu-toggle', toggle);
    window.addEventListener('dashboard-menu-close', close);
    return () => { window.removeEventListener('dashboard-menu-toggle', toggle); window.removeEventListener('dashboard-menu-close', close); };
  }, []);

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Invoices", icon: FileText, href: "/dashboard/invoices" },
    { name: "Billing Schedules", icon: RefreshCw, href: "/dashboard/recurring" },
    { name: "Clients", icon: Users, href: "/dashboard/clients" },
    { name: "Products", icon: Package, href: "/dashboard/products" },
    { name: "Reports", icon: BarChart3, href: "/dashboard/reports" },
    { name: "Analytics", icon: TrendingUp, href: "/dashboard/analytics" },
    { name: "Templates", icon: Palette, href: "/dashboard/templates" },
    { name: "Profile", icon: UserCircle, href: "/dashboard/profile" },
    { name: "Settings", icon: Settings, href: "/dashboard/settings" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (<>
    {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/45 md:hidden" onClick={() => setMobileOpen(false)} />}
    <aside
      data-mobile-open={mobileOpen ? 'true' : 'false'}
      className={cn(
        "dashboard-sidebar fixed left-0 top-0 h-[100dvh] bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-all duration-300 z-50 w-64",
        collapsed ? "md:w-16" : "md:w-64"
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={logoWhite} 
              alt="IEOSUIA Invoices" 
              className="h-8 w-auto"
            />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.innerWidth < 768 ? setMobileOpen(false) : setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span className="font-medium">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>

    <nav aria-label="Mobile dashboard navigation" className="dashboard-mobile-nav md:hidden">
      {menuItems.slice(0, 4).map((item) => {
        const isActive = item.href === "/dashboard"
          ? location.pathname === item.href
          : location.pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn("dashboard-mobile-nav-item", isActive && "is-active")}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name === "Billing Schedules" ? "Schedules" : item.name}</span>
          </Link>
        );
      })}
      <button
        type="button"
        className="dashboard-mobile-nav-item"
        onClick={() => setMobileOpen(true)}
        aria-label="Open all navigation"
      >
        <Menu className="h-5 w-5" />
        <span>More</span>
      </button>
    </nav>
  </>
  );
};

export default DashboardSidebar;
