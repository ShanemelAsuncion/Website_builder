import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';

interface Props {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: Props) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('ProtectedRoute - Checking auth, token exists:', !!token);
        
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        // Verify the token is valid by making a simple request
        // This ensures the token hasn't expired or been tampered with
        await authApi.getProfile(); // Assuming you have a getProfile endpoint
        setIsAuthenticated(true);
      } catch (error) {
        console.error('ProtectedRoute - Auth check failed:', error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname]); // Re-run when path changes

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute - Not authenticated, redirecting to login');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  console.log('ProtectedRoute - User authenticated, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;
