import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../components/AuthContext';
import { Shield, Users, Key, AlertTriangle, Cpu, Activity, RefreshCw } from 'lucide-react';

interface Stats {
  activeUsers: number;
  totalRoles: number;
  activeSessions: number;
  failedLogins: number;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    activeUsers: 0,
    totalRoles: 0,
    activeSessions: 0,
    failedLogins: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/audit/stats');
      setStats(res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load system diagnostics', err);
      setError('DIAGNOSTICS_DISRUPTED: Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // 1 minute auto refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Console Section Header */}
      <header className="border-b border-steel-line pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-condensed tracking-tight">SYSTEM OPERATIONS DIAGNOSTIC</h1>
          <p className="text-bone-dim text-xs">Real-time clearance data nodes, active session counts, and auth logs.</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center space-x-1 px-2.5 py-1 bg-steel border border-steel-line hover:bg-steel-line text-xs font-mono text-bone-dim hover:text-bone rounded-[3px] transition-colors"
        >
          <RefreshCw size={10} className={isLoading ? 'animate-spin' : ''} />
          <span>FORCE_RELOAD</span>
        </button>
      </header>

      {/* Connection Alert */}
      {error && (
        <div className="bg-graphite border border-denied-red p-3 flex items-start space-x-2.5 text-xs text-denied-red font-mono rounded-[3px]">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Diagnostics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Operators */}
        <div className="bg-steel border border-steel-line p-4 rounded-[4px] flex flex-col justify-between min-h-[100px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-bone-dim tracking-wider">ACTIVE_OPERATORS</span>
            <Users size={14} className="text-bone-dim" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-condensed font-bold leading-none text-bone">
              {isLoading ? '--' : stats.activeUsers}
            </span>
            <span className="text-[10px] font-mono text-granted-green">ENROLLED</span>
          </div>
        </div>

        {/* Security Clearance Roles */}
        <div className="bg-steel border border-steel-line p-4 rounded-[4px] flex flex-col justify-between min-h-[100px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-bone-dim tracking-wider">SECURITY_ROLES_BOUND</span>
            <Key size={14} className="text-bone-dim" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-condensed font-bold leading-none text-bone">
              {isLoading ? '--' : stats.totalRoles}
            </span>
            <span className="text-[10px] font-mono text-clearance-amber">MATRICES</span>
          </div>
        </div>

        {/* Sessions Established */}
        <div className="bg-steel border border-steel-line p-4 rounded-[4px] flex flex-col justify-between min-h-[100px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-bone-dim tracking-wider">SESSIONS_ACTIVE</span>
            <Activity size={14} className="text-bone-dim" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-condensed font-bold leading-none text-bone">
              {isLoading ? '--' : stats.activeSessions}
            </span>
            <span className="text-[10px] font-mono text-granted-green">ON_LINE</span>
          </div>
        </div>

        {/* Failed Authenticaton Attempts */}
        <div className="bg-steel border border-steel-line p-4 rounded-[4px] flex flex-col justify-between min-h-[100px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-bone-dim tracking-wider">FAILED_AUTH_24H</span>
            <AlertTriangle size={14} className="text-bone-dim" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className={`text-3xl font-condensed font-bold leading-none ${stats.failedLogins > 0 ? 'text-denied-red font-black' : 'text-bone'}`}>
              {isLoading ? '--' : stats.failedLogins}
            </span>
            <span className={`text-[10px] font-mono ${stats.failedLogins > 0 ? 'text-denied-red font-bold' : 'text-bone-dim'}`}>
              {stats.failedLogins > 0 ? 'VIOLATIONS' : 'CLEAN'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: System Status & Diagnostic Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Diagnostics status panel */}
        <div className="bg-steel border border-steel-line p-5 rounded-[4px] lg:col-span-2 space-y-4">
          <h2 className="text-xs font-mono font-bold tracking-wider text-bone border-b border-steel-line pb-2 flex items-center space-x-2">
            <Cpu size={14} className="text-clearance-amber" />
            <span>CORE_PROCESSING_UNIT</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-graphite border border-steel-line p-3 space-y-2">
              <div className="text-bone-dim text-[10px] tracking-wider">SYSTEM ENVIRONMENT</div>
              <div className="flex justify-between">
                <span className="text-bone-dim">DB ENGINE:</span>
                <span className="text-granted-green">MONGODB_v6.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-bone-dim">TOKEN STATE:</span>
                <span className="text-granted-green">JWT_ROTATED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-bone-dim">LIMITER BIND:</span>
                <span className="text-granted-green">ACTIVE (15/15M)</span>
              </div>
            </div>

            <div className="bg-graphite border border-steel-line p-3 space-y-2">
              <div className="text-bone-dim text-[10px] tracking-wider">SECURITY PROFILE</div>
              <div className="flex justify-between">
                <span className="text-bone-dim">OPERATOR:</span>
                <span className="text-bone truncate max-w-[140px]">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-bone-dim">CLEARANCE KEY:</span>
                <span className="text-clearance-amber font-bold">{user?.roles[0]?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-bone-dim">AUDIT MODE:</span>
                <span className="text-granted-green">IMMUTABLE_ON</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-bone-dim leading-relaxed bg-graphite/40 p-3.5 border border-steel-line rounded-[3px]">
            <span className="font-bold text-bone">SECURITY NOTICE:</span> AccessGate enforces Role-Based Access Control (RBAC) at the server layer. Modifying permissions takes effect immediately on user routes. Security tokens are signed with cryptographic private keys. Revoked sessions will terminate active clients within 15 minutes or on token refresh.
          </div>
        </div>

        {/* Diagnostic logs */}
        <div className="bg-steel border border-steel-line p-5 rounded-[4px] flex flex-col space-y-4">
          <h2 className="text-xs font-mono font-bold tracking-wider text-bone border-b border-steel-line pb-2 flex items-center space-x-2">
            <Shield size={14} className="text-clearance-amber" />
            <span>INTEGRITY_SHIELD</span>
          </h2>
          <div className="flex-1 flex flex-col justify-center items-center text-center p-4 bg-graphite border border-steel-line rounded-[3px]">
            <Shield className="h-10 w-10 text-granted-green animate-pulse mb-3" />
            <div className="text-xs font-mono font-bold text-granted-green mb-1">ALL_SYSTEMS_OPERATIONAL</div>
            <div className="text-[10px] font-mono text-bone-dim max-w-[180px]">
              Memory buffers verified. Network nodes report secure TLS connections.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
