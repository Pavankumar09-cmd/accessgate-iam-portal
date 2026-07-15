import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permission }) => {
  const { user, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-graphite flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm border border-steel-line bg-steel p-6 rounded-[4px] font-mono text-xs">
          <div className="flex items-center space-x-2 text-clearance-amber font-condensed tracking-wider font-bold mb-4">
            <span className="h-2 w-2 rounded-full bg-clearance-amber animate-ping"></span>
            <span>ACCESSGATE // BOOT_SEQUENCE</span>
          </div>
          <div className="space-y-2 text-bone-dim">
            <div>[BOOT] LOADING SYSTEM FILES...</div>
            <div className="flex space-x-1">
              <span>[AUTH] VERIFYING USER CREDENTIALS...</span>
            </div>
            <div className="w-full bg-graphite h-1 border border-steel-line overflow-hidden relative">
              <div className="bg-clearance-amber h-full w-1/2 absolute animate-[shimmer_1.5s_infinite] left-0"></div>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes shimmer {
            0% { left: -50%; }
            100% { left: 100%; }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="min-h-screen bg-graphite flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md border border-denied-red bg-steel p-6 rounded-[4px] font-mono text-xs shadow-[0_0_15px_rgba(229,72,77,0.1)]">
          <div className="flex items-center space-x-2 text-denied-red font-condensed tracking-wider font-bold mb-4">
            <span className="h-2 w-2 rounded-full bg-denied-red"></span>
            <span>ACCESS CONTROL // CLEARANCE DENIED</span>
          </div>
          <div className="text-bone mb-4 leading-relaxed">
            CRITICAL: Your account clearance does not have authorization key <span className="text-denied-red font-bold">"{permission}"</span> required to access this console.
          </div>
          <div className="bg-graphite border border-steel-line p-3 text-bone-dim space-y-1 mb-4">
            <div>ACTOR: {user.email}</div>
            <div>STATUS: ACCESS_RESTRICTED</div>
            <div>SYS_TIME: {new Date().toISOString()}</div>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-2 bg-graphite hover:bg-steel-line border border-steel-line text-bone font-condensed font-bold text-center tracking-wider transition-colors duration-150 active:border-clearance-amber"
          >
            RETURN TO OPERATIONAL OVERVIEW
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
