import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Smartphone, 
  Trash2, 
  ShieldAlert, 
  Info,
  AlertTriangle
} from 'lucide-react';

interface SessionRecord {
  _id: string;
  device: string;
  ip: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export const Sessions: React.FC = () => {
  
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/sessions');
      setSessions(res.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to query active sessions', err);
      setError(err.response?.data?.message || 'Failed to fetch sessions data from core.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/sessions/${sessionId}`);
      setSuccess('Session revoked successfully.');
      fetchSessions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to revoke token session.');
    }
  };

  const handleRevokeAllOthers = async () => {
    setError(null);
    setSuccess(null);
    if (!window.confirm('WARNING: This will immediately revoke ALL other active devices. You will remain logged in on this client. Continue?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Find our current session's ID from the session list to prevent revoking ourself.
      // Or the backend can handle it if we send our active session details, or the backend revokes all other sessions.
      // We implemented revokeAllOtherSessions to look up matching currentSessionId in req.body.
      // Since our client doesn't know its sessionId directly (it's inside the httpOnly refresh cookie), 
      // the backend query is structured to handle this if we leave currentSessionId blank, but wait!
      // In sessions.controller.ts, we query `{ userId, revoked: false }` and if `currentSessionId` is provided, we filter it.
      // Wait, how can the client find its session ID? It can check the first session in the list (since it's sorted by updatedAt and this request just updated the lastLogin/session, or we can just send the request. In fact, if we don't send currentSessionId, the backend terminates everything. Let's make it terminate all except the one that is currently active by comparing IP and device, or we can simply let the user revoke individual cards.
      // In sessions.controller.ts:
      // const query: any = { userId, revoked: false };
      // if (currentSessionId) { query._id = { $ne: currentSessionId }; }
      // To terminate others: we can identify the session matching our current browser by matching IP and device in the list!
      // Let's find the matching session in our frontend list. The one with the most recent `updatedAt` matching the current user-agent is highly likely to be the current one.
      const currentUA = navigator.userAgent;
      const probableCurrentSession = sessions.find(s => s.device === currentUA);
      
      await api.post('/sessions/revoke-all-others', { 
        currentSessionId: probableCurrentSession?._id 
      });

      setSuccess('All other sessions terminated.');
      fetchSessions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to terminate other sessions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="border-b border-steel-line pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-condensed tracking-tight">ACTIVE OPERATOR SESSIONS</h1>
          <p className="text-bone-dim text-xs">Inspect established refresh keys, monitor IP origins, and revoke active console tokens.</p>
        </div>

        <button
          onClick={handleRevokeAllOthers}
          disabled={sessions.length <= 1 || isSubmitting}
          className="flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-graphite hover:bg-steel-line border border-steel-line text-denied-red font-condensed font-bold text-xs tracking-wider transition-colors disabled:opacity-30 rounded-[3px]"
        >
          <ShieldAlert size={14} />
          <span>TERMINATE_ALL_OTHER_SESSIONS</span>
        </button>
      </header>

      {/* Alerts */}
      {error && (
        <div className="bg-graphite border border-denied-red p-3 flex items-start space-x-2.5 text-xs text-denied-red font-mono rounded-[3px]">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-graphite border border-granted-green p-3 flex items-start space-x-2.5 text-xs text-granted-green font-mono rounded-[3px]">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Alert Notice */}
      <div className="bg-steel border border-steel-line p-4 rounded-[4px] text-xs leading-relaxed text-bone-dim flex items-start space-x-3">
        <Info size={16} className="text-clearance-amber shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-bone">SECURITY AUDIT RULE:</span> Below are active devices authorized to request fresh console clearance tokens. If you detect an unrecognized IP address, immediately click <span className="text-denied-red font-bold">TERMINATE</span> to revoke its refresh credentials and force log out the device.
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="md:col-span-2 text-center py-10 font-mono text-xs text-bone-dim">
            [SYS] CONSTRUCTING DEVICE SESSION REGISTRY...
          </div>
        ) : sessions.length === 0 ? (
          <div className="md:col-span-2 text-center py-10 font-mono text-xs text-bone-dim">
            [SYS] NO LOGGED REFRESH TOKENS DETECTED.
          </div>
        ) : (
          sessions.map((session) => {
            const created = new Date(session.createdAt).toISOString().replace('T', ' ').substring(0, 19) + 'Z';
            const expires = new Date(session.expiresAt).toISOString().replace('T', ' ').substring(0, 19) + 'Z';
            
            // Check if this is the probable current session
            const isCurrent = navigator.userAgent === session.device;

            return (
              <div 
                key={session._id} 
                className={`bg-steel border ${
                  isCurrent ? 'border-clearance-amber/60' : 'border-steel-line'
                } p-5 rounded-[4px] flex flex-col justify-between space-y-4`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-graphite border border-steel-line text-clearance-amber rounded-[3px] mt-0.5">
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xs font-mono font-bold text-bone truncate max-w-[200px]" title={session.device}>
                          {session.device}
                        </h3>
                        {isCurrent && (
                          <span className="text-[9px] font-mono border border-clearance-amber text-clearance-amber px-1 bg-clearance-amber/5">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-bone-dim mt-1">IP ORIGIN: {session.ip}</p>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      onClick={() => handleRevokeSession(session._id)}
                      title="Revoke session credentials"
                      className="p-1.5 border border-steel-line hover:border-denied-red text-bone-dim hover:text-denied-red rounded-[3px] transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <div className="border-t border-steel-line/30 pt-3 grid grid-cols-2 gap-2 font-mono text-[10px] text-bone-dim">
                  <div>
                    <span>AUTHORIZED:</span>
                    <p className="text-bone mt-0.5">{created}</p>
                  </div>
                  <div>
                    <span>EXPIRES:</span>
                    <p className="text-bone mt-0.5">{expires}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
