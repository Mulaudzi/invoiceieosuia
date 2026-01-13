import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminToken } from "./AdminLogin";

/**
 * Admin index route - redirects to dashboard if authenticated, login if not
 */
const AdminIndex = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
};

export default AdminIndex;
