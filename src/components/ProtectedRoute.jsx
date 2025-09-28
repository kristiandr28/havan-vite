import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth'; // Make sure this path is correct
import { BiLoaderAlt } from 'react-icons/bi'; // Import loader icon, if you have one

function ProtectedRoute({ children, roles = [] }) {
  const { user, isAuthenticated, isAuthReady } = useAuth(); // Get state from useAuth
  const location = useLocation();

  // 1. Show a loading spinner while authentication state is being determined
  //    This prevents flashes or incorrect redirects before the state is known.
  if (!isAuthReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-havanaGray">
        <BiLoaderAlt className="animate-spin text-5xl mb-4 text-havanaBlue" />
        <p className="text-lg font-medium">Verifying access...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait.</p>
      </div>
    );
  }

  // 2. If not authenticated after the state is ready, redirect to login
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated. Redirecting to /login.');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 3. If authenticated, check for role authorization
  //    The `user` object from `useAuth` should already be correctly parsed.
  const userRole = user?.role; // Safely access role from the user object

  if (roles.length > 0 && !roles.includes(userRole)) {
    // If role mismatch, redirect to homepage or an unauthorized page
    console.log(`ProtectedRoute: User role '${userRole}' not allowed. Redirecting to /.`);
    return <Navigate to="/" replace />;
  }

  // 4. If authenticated and authorized, render the children (the protected content)
  console.log(`ProtectedRoute: Access granted for role '${userRole}'.`);
  return children;
}

export default ProtectedRoute;