import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../../services/authService';

/**
 * ProtectedRoute.jsx — Route Guard Component
 * 
 * Wrapper component that checks authentication and role before allowing access
 */

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const authenticated = isAuthenticated();
    const user = getCurrentUser();

    // Not authenticated - redirect to login
    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check if user has required role
    if (allowedRoles.length > 0 && user) {
        const hasRequiredRole = allowedRoles.includes(user.role);
        
        if (!hasRequiredRole) {
            // Wrong role - redirect to home or unauthorized page
            return <Navigate to="/" replace />;
        }
    }

    // Authenticated and has correct role - render child routes
    return <Outlet />;
};

export default ProtectedRoute;
