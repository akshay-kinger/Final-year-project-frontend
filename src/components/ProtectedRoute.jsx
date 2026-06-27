import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Optional: Import standard Loader if you want to show it while checking auth
// import Loader from './Loader';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // While checking if user is logged in, show nothing (or a loader)
    return null;
  }

  if (!user) {
    // If not logged in, immediately redirect to login page.
    // 'replace' prevents them from hitting 'back' and getting stuck in a loop.
    // 'state' saves where they were trying to go, so we could redirect them back after login (advanced feature for later).
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in, render the protected page
  return children;
};

export default ProtectedRoute;
