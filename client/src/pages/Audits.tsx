import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  ChevronDown, 
  ChevronUp, 
  Download,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface AuditLog {
  _id: string;
  actorId?: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  status: 'GRANTED' | 'DENIED' | 'INFO';
  metadata?: Record<string, any>;
  ip: string;
  timestamp: string;
}

export const Audits: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [targetType, setTargetType] = useState('');
  const [limit, setLimit] = useState('100');

  // Expanded log rows for metadata
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params: any = { limit };
      if (actor) params.actor = actor;
      if (action) params.action = action;
      if (selectedStatus) params.status = selectedStatus;
      if (targetType) params.targetType = targetType;

      const res = await api.get('/audit', { params });
      setLogs(res.data);
    } catch (err: any) {
      console.error('Failed to query audit log registry', err);
      setError(err.response?.data?.message || 'Failed to connect to audit logging node.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedStatus, targetType, limit]);

  const toggleExpandRow = (id: string) => {
    if (expandedLogId === id) {
      setExpandedLogId(null);
    } else {
      setExpandedLogId(id);
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    
    const headers = ['Timestamp', 'Status', 'Actor', 'Action', 'TargetType', 'TargetId', 'IP Address'];
    const rows = logs.map(log => [
      log.timestamp,
      log.status,
      log.actorEmail,
      log.action,
      log.targetType,
      log.targetId,
      log.ip
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `accessgate_audit_log_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="border-b border-steel-line pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-condensed tracking-tight">IMMUTABLE AUDIT LEDGER</h1>
          <p className="text-bone-dim text-xs">Verify logged operations, authentication challenges, and access permission adjustments.</p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={logs.length === 0}
          className="flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-steel hover:bg-steel-line border border-steel-line text-bone font-condensed font-bold text-xs tracking-wider transition-colors disabled:opacity-30 rounded-[3px]"
        >
          <Download size={14} />
          <span>EXPORT_CSV_RAW</span>
        </button>
      </header>

      {/* Error Info Bar */}
      {error && (
        <div className="bg-graphite border border-denied-red p-3 flex items-start space-x-2.5 text-xs text-denied-red font-mono rounded-[3px]">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="bg-steel border border-steel-line p-4 rounded-[4px] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <label className="block text-[10px] text-bone-dim tracking-wider mb-1">ACTOR_EMAIL</label>
            <input
              type="text"
              placeholder="e.g. admin@corp.com"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              className="w-full bg-graphite border border-steel-line px-3 py-1.5 text-bone focus:border-clearance-amber focus:outline-none rounded-[3px]"
            />
          </div>

          <div>
            <label className="block text-[10px] text-bone-dim tracking-wider mb-1">ACTION_KEY</label>
            <input
              type="text"
              placeholder="e.g. auth:login"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full bg-graphite border border-steel-line px-3 py-1.5 text-bone focus:border-clearance-amber focus:outline-none rounded-[3px]"
            />
          </div>

          <div>
            <label className="block text-[10px] text-bone-dim tracking-wider mb-1">STATUS</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-graphite border border-steel-line px-3 py-1.5 text-bone focus:border-clearance-amber focus:outline-none rounded-[3px]"
            >
              <option value="">[ALL_EVENTS]</option>
              <option value="GRANTED">GRANTED</option>
              <option value="DENIED">DENIED</option>
              <option value="INFO">INFO</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-bone-dim tracking-wider mb-1">TARGET_TYPE</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full bg-graphite border border-steel-line px-3 py-1.5 text-bone focus:border-clearance-amber focus:outline-none rounded-[3px]"
            >
              <option value="">[ALL_TARGETS]</option>
              <option value="User">User</option>
              <option value="Role">Role</option>
              <option value="Session">Session</option>
              <option value="Permission">Permission</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-steel-line/30 pt-3">
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-bone-dim">LIMIT_RESULTS:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="bg-graphite border border-steel-line px-2 py-1 text-bone focus:border-clearance-amber focus:outline-none rounded-[3px]"
            >
              <option value="50">50 ROWS</option>
              <option value="100">100 ROWS</option>
              <option value="250">250 ROWS</option>
            </select>
          </div>

          <button
            onClick={fetchLogs}
            className="flex items-center space-x-1 px-4 py-1.5 bg-clearance-amber text-graphite font-condensed font-bold text-xs tracking-wider hover:bg-clearance-amber/90 rounded-[3px]"
          >
            <RefreshCw size={12} />
            <span>RUN_LEDGER_QUERY</span>
          </button>
        </div>
      </div>

      {/* Ledger monospaced stream table */}
      <div className="bg-steel border border-steel-line rounded-[4px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-[11px]">
            <thead>
              <tr className="bg-graphite/40 border-b border-steel-line text-[10px] text-bone-dim tracking-wider">
                <th className="px-4 py-3 w-6"></th>
                <th className="px-4 py-3">TIMESTAMP</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3">OPERATOR_ACTOR</th>
                <th className="px-4 py-3">ACTION_TRIGGER</th>
                <th className="px-4 py-3">TARGET</th>
                <th className="px-4 py-3">IP_ADDRESS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-line/40">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-bone-dim">
                    [SYS] READING SECURE RECORDS STAMP FILES...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-bone-dim italic">
                    [INFO] NO LEDGER LOG RECORDS MATCH INQUIRY.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log._id;
                  const dateStr = new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19) + 'Z';
                  const statusColor = 
                    log.status === 'GRANTED' ? 'text-granted-green' : 
                    log.status === 'DENIED' ? 'text-denied-red font-bold' : 
                    'text-clearance-amber';
                  
                  return (
                    <React.Fragment key={log._id}>
                      <tr 
                        onClick={() => toggleExpandRow(log._id)}
                        className="hover:bg-graphite/20 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          {isExpanded ? <ChevronUp size={12} className="text-bone-dim" /> : <ChevronDown size={12} className="text-bone-dim" />}
                        </td>
                        <td className="px-4 py-3 text-bone-dim">{dateStr}</td>
                        <td className={`px-4 py-3 font-bold ${statusColor}`}>{log.status}</td>
                        <td className="px-4 py-3 text-bone">{log.actorEmail}</td>
                        <td className="px-4 py-3 text-clearance-amber">{log.action}</td>
                        <td className="px-4 py-3 text-bone-dim">
                          {log.targetType}/{log.targetId.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-bone-dim">{log.ip}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-graphite/40">
                          <td colSpan={7} className="px-8 py-3.5 border-t border-steel-line/30">
                            <div className="space-y-2">
                              <div className="text-[10px] font-mono text-bone-dim tracking-wider">EVENT_METADATA_STREAM</div>
                              <pre className="bg-graphite border border-steel-line p-3 text-[10px] text-bone-dim overflow-x-auto rounded-[3px]">
                                {JSON.stringify(log.metadata || {}, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
