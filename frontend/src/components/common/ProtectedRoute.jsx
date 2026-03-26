import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  getCurrentUser,
  getDefaultRouteForRole,
  isAuthenticated,
} from '../../services/authService';

/**
 * ProtectedRoute.jsx — Route Guard Component
 * 
 * Wrapper component that checks authentication and role before allowing access
 */

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const location = useLocation();
    const authenticated = isAuthenticated();
    const user = getCurrentUser();

    // Not authenticated - redirect to login
    if (!authenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Check if user has required role
    if (allowedRoles.length > 0 && user) {
        const hasRequiredRole = allowedRoles.includes(user.role);
        
        if (!hasRequiredRole) {
            // Wrong role - redirect to user's own dashboard
            return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
        }
    }

    // Authenticated and has correct role - render child routes
    return <Outlet />;
};

export default ProtectedRoute;
