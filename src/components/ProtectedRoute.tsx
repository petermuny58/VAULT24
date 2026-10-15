import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Role } from "../types";
import { Spinner } from "./Spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** UX convenience only — real authorization happens on the server. */
  requireRole?: Role;
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  // UX convenience only: real authorization happens on the server.
  // This gate improves navigation UX and must not be treated as security.
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Spinner label="Checking session…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireRole && user.role !== requireRole) {
    const fallback = user.role === "admin" ? "/admin/customers" : "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
