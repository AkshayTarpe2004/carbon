import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  getStoredToken,
  getStoredRole,
  isAdminRole,
  authRedirectPath,
} from "../utils/auth";

function ProtectedRoute({ children, requireAdmin = false, requireUser = false }) {
  const location = useLocation();
  const token = getStoredToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const role = getStoredRole();

  if (requireAdmin && role && !isAdminRole(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireUser && role && isAdminRole(role)) {
    return <Navigate to={authRedirectPath(role)} replace />;
  }

  return children;
}

export default ProtectedRoute;
