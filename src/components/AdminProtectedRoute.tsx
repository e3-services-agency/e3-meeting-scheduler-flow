import React from 'react';
import { Navigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { useAdminCheck } from '@/hooks/useAdminCheck';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  user: User | null;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children, user }) => {
  const { isAdmin, loading, error } = useAdminCheck(user);

  if (loading) {
    return (
      <div className="min-h-screen bg-e3-space-blue flex items-center justify-center">
        <div className="flex items-center gap-3 text-e3-white">
          <div className="w-6 h-6 border-2 border-e3-white/30 border-t-e3-white rounded-full animate-spin" />
          <span>Verifying admin access...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-e3-space-blue flex items-center justify-center">
        <div className="text-center text-e3-white">
          <h2 className="text-xl font-semibold mb-2">Access Error</h2>
          <p className="text-e3-white/80">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-e3-orange text-white rounded hover:bg-e3-orange/80"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-e3-space-blue flex items-center justify-center">
        <div className="text-center text-e3-white">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-e3-white/80">You need admin privileges to access this area.</p>
          <button 
            onClick={() => window.history.back()} 
            className="mt-4 px-4 py-2 bg-e3-orange text-white rounded hover:bg-e3-orange/80"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;