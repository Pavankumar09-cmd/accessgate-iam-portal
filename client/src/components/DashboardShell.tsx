import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { api } from '../api';
import { 
  Shield, 
  Users, 
  Lock, 
  Terminal, 
  Smartphone, 
  LogOut, 
  RefreshCw,
  Clock
} from 'lucide-react';

interface AuditLog {
  _id: string;
  actorEmail: string;
  action: string;
  status: 'GRANTED' | 'DENIED' | 'INFO';
  ip: string;
  timestamp: string;
}

export const DashboardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [utcTime, setUtcTime] = useState<string>('');
  const [liveLogs, setLiveLogs] = useState<AuditLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Update UTC clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').substring(0, 19) + 'Z');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll audit logs for signature streaming feed if authorized
  const fetchLiveLogs = async () => {
    if (!hasPermission('audit:read')) return;
    setIsSyncing(true);
    try {
      const res = await api.get('/audit?limit=6');
      setLiveLogs(res.data);
    } catch (err) {
      console.error('Failed to stream live events', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchLiveLogs();
    const interval = setInterval(fetchLiveLogs, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'OVERVIEW', icon: Shield, exact: true },
    { to: '/users', label: 'USER CONTROL', icon: Users, perm: 'users:read' },
    { to: '/roles', label: 'SECURITY ROLES', icon: Lock, perm: 'users:read' }, // roles read can be viewed
    { to: '/audit', label: 'AUDIT LOGS', icon: Terminal, perm: 'audit:read' },
    { to: '/sessions', label: 'ACTIVE SESSIONS', icon: Smartphone },
  ];

  return (
    <div className="min-h-screen bg-graphite flex flex-col font-sans text-bone">
      {/* Top Console Bar */}
      <header className="border-b border-steel-line bg-steel px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-graphite px-2.5 py-1 border border-steel-line flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-granted-green animate-pulse"></span>
            <span className="font-mono text-xs font-bold tracking-wider text-granted-green">GATE_ENG: ACTIVE</span>
          </div>
          <div className="font-condensed font-bold tracking-tight text-lg flex items-center space-x-2">
            <span>ACCESSGATE</span>
            <span className="text-bone-dim">//</span>
            <span className="text-bone-dim text-sm font-mono font-normal">[NODE: US-EAST-01]</span>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-xs font-mono">
          <div className="hidden md:flex items-center space-x-1.5 text-bone-dim">
            <Clock size={12} className="text-clearance-amber" />
            <span>UTC:</span>
            <span className="text-bone">{utcTime}</span>
          </div>
          
          <div className="bg-graphite px-3 py-1 border border-steel-line text-bone-dim">
            CLEARANCE: <span className="text-clearance-amber font-bold">{user?.roles.map(r => r.name).join(', ') || 'NONE'}</span>
          </div>

          <div className="text-bone-dim hidden sm:block">
            OPERATOR: <span className="text-bone font-bold">{user?.email}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Control Panel / Navigation */}
        <aside className="w-full md:w-60 border-r md:border-b-0 border-b border-steel-line bg-steel flex flex-col justify-between shrink-0">
          <nav className="p-3 space-y-1">
            <div className="text-[10px] font-mono tracking-widest text-bone-dim px-3 py-2">
              CONSOLE INDEX
            </div>
            {navItems.map((item) => {
              if (item.perm && !hasPermission(item.perm)) return null;
              
              const isActive = item.exact 
                ? location.pathname === item.to 
                : location.pathname.startsWith(item.to) && item.to !== '/';

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center space-x-2.5 px-3 py-2 text-xs font-condensed tracking-wider font-bold transition-all duration-150 border rounded-[3px] ${
                    isActive
                      ? 'bg-graphite border-clearance-amber text-clearance-amber'
                      : 'border-transparent text-bone-dim hover:text-bone hover:bg-graphite/40'
                  }`}
                >
                  <item.icon size={14} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* System Control / Logout */}
          <div className="p-3 border-t border-steel-line space-y-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-graphite hover:bg-steel-line border border-steel-line text-denied-red font-condensed font-bold text-xs tracking-wider transition-colors duration-150 rounded-[3px]"
            >
              <LogOut size={12} />
              <span>TERMINATE_SESSION</span>
            </button>
          </div>
        </aside>

        {/* Content Body & Streaming Feed layout */}
        <main className="flex-1 flex flex-col bg-graphite overflow-hidden">
          {/* Main workspace */}
          <div className="flex-1 p-6 overflow-y-auto">
            {children}
          </div>

          {/* Signature Event Feed - Static at bottom of dashboard */}
          {hasPermission('audit:read') && (
            <div className="border-t border-steel-line bg-steel p-4 font-mono text-[11px] shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-bone-dim">
                  <Terminal size={12} className="text-clearance-amber" />
                  <span className="font-bold tracking-wider">LIVE_SECURITY_EVENT_FEED</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-bone-dim">
                  {isSyncing && <RefreshCw size={10} className="animate-spin text-clearance-amber" />}
                  <span>AUTO_SYNC: 5S</span>
                </div>
              </div>
              <div className="bg-graphite border border-steel-line p-2.5 space-y-1.5 min-h-[90px] rounded-[3px]">
                {liveLogs.length === 0 ? (
                  <div className="text-bone-dim italic">[FEED] LISTENING FOR CLEARANCE EVENTS...</div>
                ) : (
                  liveLogs.map((log) => {
                    const time = new Date(log.timestamp).toISOString().split('T')[1].substring(0, 8) + 'Z';
                    const statusColor = 
                      log.status === 'GRANTED' ? 'text-granted-green' : 
                      log.status === 'DENIED' ? 'text-denied-red font-bold' : 
                      'text-clearance-amber';
                    
                    return (
                      <div key={log._id} className="flex flex-wrap items-center space-x-2 border-b border-steel-line/30 pb-1 last:border-b-0 last:pb-0 hover:bg-steel/30 px-1">
                        <span className="text-bone-dim">{time}</span>
                        <span className={`w-14 shrink-0 font-bold ${statusColor}`}>{log.status}</span>
                        <span className="text-bone max-w-[180px] truncate">{log.actorEmail}</span>
                        <span className="text-clearance-amber truncate">{log.action}</span>
                        <span className="text-bone-dim shrink-0">from {log.ip}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
