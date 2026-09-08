import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, User, Settings, LogOut, Bell, Calendar, Menu, ArrowLeft } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { usePrivateMediaUrl } from "@/hooks/usePrivateMediaUrl";
import { useRecurringInvoices } from "@/hooks/useRecurringInvoices";
import { formatDateSafe } from "@/lib/dateUtils";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

const DashboardHeader = ({ title, subtitle }: DashboardHeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const avatarUrl = usePrivateMediaUrl(user?.avatar);
  const { data: billingSchedules = [] } = useRecurringInvoices();
  const today = new Date(); today.setHours(0,0,0,0);
  const notifications = billingSchedules.filter(schedule => {
    if (schedule.status !== 'active' || !schedule.next_invoice_date) return false;
    const billingDate = schedule.next_invoice_date.slice(0,10);
    const currentCycleHandled = (schedule.generated_invoices || []).some(invoice =>
      invoice.date?.slice(0,10) >= billingDate
    );
    if (currentCycleHandled) return false;
    const due = new Date(`${schedule.next_invoice_date.slice(0,10)}T00:00:00`);
    const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    return days <= 7;
  }).sort((a,b) => a.next_invoice_date.localeCompare(b.next_invoice_date));

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch {
      navigate("/");
    }
  };

  return (
    <header className="dashboard-app-header min-h-16 bg-card border-b border-border flex items-center justify-between gap-3 px-4 sm:px-6 py-2">
      {/* Title */}
      <div className="flex items-center gap-3 min-w-0">
        {location.pathname !== "/dashboard" && (
          <Button className="md:hidden shrink-0" variant="ghost" size="icon" aria-label="Go back" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
        )}
        <Button className="md:hidden shrink-0" variant="ghost" size="icon" aria-label="Open navigation" onClick={() => window.dispatchEvent(new Event('dashboard-menu-toggle'))}><Menu className="w-5 h-5" /></Button>
        <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">{title}</h1>
        {subtitle && <p className="hidden sm:block text-sm text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-1 sm:gap-4 shrink-0">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-9 w-64 bg-background"
          />
        </div>

        {/* User Menu */}
        <div className="relative flex items-center gap-2" ref={userMenuRef}>
          <Button variant="ghost" size="icon" aria-label="Billing notifications" onClick={()=>{setShowNotifications(value=>!value);setShowUserMenu(false)}} className="relative">
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[11px] grid place-items-center">{notifications.length > 9 ? '9+' : notifications.length}</span>}
          </Button>
          {showNotifications && <div className="absolute right-10 top-full mt-2 w-96 max-w-[90vw] bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="p-4 border-b"><p className="font-semibold">Billing notifications</p><p className="text-xs text-muted-foreground">Due and upcoming schedules</p></div>
            <div className="max-h-80 overflow-y-auto">{notifications.length === 0 ? <p className="p-6 text-sm text-center text-muted-foreground">No billing dates are due in the next 7 days.</p> : notifications.slice(0,10).map(schedule=>{
              const due=new Date(`${schedule.next_invoice_date.slice(0,10)}T00:00:00`);const days=Math.ceil((due.getTime()-today.getTime())/86400000);
              return <div key={schedule.id} className="p-4 border-b last:border-0 flex gap-3"><Calendar className="w-5 h-5 mt-0.5 text-primary shrink-0"/><div className="min-w-0 flex-1"><p className="font-medium truncate">{schedule.client_name}: {schedule.description}</p><p className={days<=0?'text-sm text-destructive':'text-sm text-muted-foreground'}>{days<0?`${Math.abs(days)} day${Math.abs(days)===1?'':'s'} overdue`:days===0?'Billing is due today':`Due in ${days} day${days===1?'':'s'}`} · {formatDateSafe(schedule.next_invoice_date,'dd MMM yyyy')}</p></div></div>
            })}</div>
            <div className="p-3 border-t grid grid-cols-2 gap-2"><Button variant="outline" size="sm" asChild><Link to="/dashboard/recurring" onClick={()=>setShowNotifications(false)}>View schedules</Link></Button><Button size="sm" asChild><Link to="/dashboard/invoices" onClick={()=>setShowNotifications(false)}>Create invoice</Link></Button></div>
          </div>}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user?.name || 'Profile'} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-accent" />
              )}
            </div>
          </Button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-border">
                <p className="font-medium text-foreground">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full capitalize">
                  Free
                </span>
              </div>
              <div className="p-2">
                <Link 
                  to="/dashboard/profile"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Link 
                  to="/dashboard/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button 
                  className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
