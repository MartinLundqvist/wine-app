import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LoadingSpinner } from "./LoadingSpinner";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const location = useLocation();
  if (state.isLoading) return <LoadingSpinner />;
  if (!state.accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const location = useLocation();
  if (state.isLoading) return <LoadingSpinner />;
  if (!state.accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (state.user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
