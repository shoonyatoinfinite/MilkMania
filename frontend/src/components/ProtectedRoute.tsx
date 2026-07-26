import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-milk-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-dairy-sky/20 rounded-full animate-ping"></div>
            <div className="absolute inset-2 border-4 border-dairy-sky/40 rounded-full animate-pulse"></div>
            <div className="absolute inset-4 border-4 border-dairy-sky rounded-full"></div>
          </div>
          <p className="text-sm font-semibold tracking-widest text-dairy-sky uppercase animate-pulse">Loading Farm Portal...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
