import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, AuthState } from '../store/authStore';

const ProtectedRoute: React.FC = () => {
  const token = useAuthStore((state: AuthState) => state.token);

  // If there's no token (user not logged in), redirect to the login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in, render the nested routes (the actual protected content)
  return <Outlet />;
};

export default ProtectedRoute; 