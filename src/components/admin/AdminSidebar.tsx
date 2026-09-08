import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox,
  Mail,
  Users,
  Settings,
  Activity,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  Server,
} from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { removeAdminToken } from "@/services/adminAuth";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { getAdminToken } from "@/services/adminAuth";

const menuItems = [
  { name: "Dashboard", href: "/guymhan", icon: LayoutDashboard },
  { name: "System", href: "/guymhan/system", icon: Server },
  { name: "Submissions", href: "/guymhan/submissions", icon: Inbox, badge: true },
  { name: "Email Logs", href: "/guymhan/email-logs", icon: Mail },
  { name: "Admins", href: "/guymhan/users", icon: Users },
  { name: "Activity Logs", href: "/guymhan/activity-logs", icon: Activity },
  { name: "Settings", href: "/guymhan/settings", icon: Settings },
];

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/guymhan") {
      return location.pathname === "/guymhan" || location.pathname === "/guymhan/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    const token = getAdminToken();
    try {
      await api.post('/guymhan/logout', { admin_token: token });
    } catch (e) {
      // Ignore errors
    }
    removeAdminToken();
    navigate('/guymhan/login');
  };

  return (<>
    <div
      className={cn(
        "hidden lg:flex fixed left-0 top-0 h-full bg-primary text-primary-foreground flex-col transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-primary-foreground/10">
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-2", collapsed && "justify-center w-full")}>
            <Shield className="w-8 h-8" />
            {!collapsed && <span className="font-bold text-lg">Admin</span>}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                active
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground",
                collapsed && "justify-center"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="flex-1">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-primary-foreground/10 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={cn(
            "w-full text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10",
            collapsed ? "px-0 justify-center" : "justify-start"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10",
            collapsed ? "px-0 justify-center" : "justify-start"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="ml-3">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </div>
    <nav className="lg:hidden fixed inset-x-0 bottom-0 z-50 border-t bg-primary text-primary-foreground pb-[env(safe-area-inset-bottom)] shadow-2xl">
      <div className="flex overflow-x-auto px-2 py-2 gap-1">{menuItems.map(item=>{const Icon=item.icon;const active=isActive(item.href);return <Link key={item.href} to={item.href} className={cn('flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px]',active?'bg-primary-foreground/20':'text-primary-foreground/70')}><Icon className="h-5 w-5"/><span>{item.name}</span></Link>})}<button onClick={handleLogout} className="flex min-w-[72px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] text-primary-foreground/70"><LogOut className="h-5 w-5"/>Logout</button></div>
    </nav>
    </>
  );
}
