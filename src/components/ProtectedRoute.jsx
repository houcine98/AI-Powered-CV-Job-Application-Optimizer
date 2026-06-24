import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ requireAdmin = false }) {
  const location = useLocation();
  const { bootstrapping, user } = useAuth();

  if (bootstrapping) {
    return <div className="glass-panel rounded-2xl p-6 text-slate-300">Loading your workspace...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
