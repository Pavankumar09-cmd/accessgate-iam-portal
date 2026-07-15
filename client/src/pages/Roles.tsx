import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../components/AuthContext';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';

interface Permission {
  _id: string;
  key: string;
  description: string;
  category: string;
}

interface RoleRecord {
  _id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
}

export const Roles: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('roles:manage');

  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/roles');
      setRoles(res.data);
    } catch (err: any) {
      console.error('Failed to query security roles', err);
      setError(err.response?.data?.message || 'Failed to retrieve security role structures.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await api.get('/permissions');
      setPermissions(res.data);
    } catch (err) {
      console.error('Failed to query permission keys', err);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setFormName('');
    setFormDescription('');
    setFormPermissions([]);
    setValidationErrors([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: RoleRecord) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormDescription(role.description);
    setFormPermissions(role.permissions.map(p => p._id));
    setValidationErrors([]);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    setError(null);

    const payload = {
      name: formName,
      description: formDescription,
      permissions: formPermissions,
    };

    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole._id}`, payload);
      } else {
        await api.post('/roles', payload);
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      console.error('Role form submit failed', err);
      if (err.response?.data?.error === 'VALIDATION_FAILED') {
        setValidationErrors(err.response.data.details || []);
      } else {
        setError(err.response?.data?.message || 'Error executing database write.');
      }
    }
  };

  const handleDeleteRole = async (role: RoleRecord) => {
    if (!canManage) return;
    if (role.isSystemRole) return;

    if (!window.confirm(`CRITICAL WARNING: This action will completely erase the role '${role.name}'. This action is irreversible. Continue?`)) {
      return;
    }

    try {
      await api.delete(`/roles/${role._id}`);
      fetchRoles();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Role delete sequence failed.');
    }
  };

  const handlePermissionToggle = (permId: string) => {
    if (formPermissions.includes(permId)) {
      setFormPermissions(formPermissions.filter(id => id !== permId));
    } else {
      setFormPermissions([...formPermissions, permId]);
    }
  };

  // Group permissions by category for clinical density in checking UI
  const groupedPermissions = permissions.reduce((acc, curr) => {
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push(curr);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="border-b border-steel-line pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-condensed tracking-tight">SECURITY ROLE MATRICES</h1>
          <p className="text-bone-dim text-xs">Establish user clearance groups, map strict system access keys, and secure default bindings.</p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-clearance-amber text-graphite font-condensed font-bold text-xs tracking-wider transition-colors rounded-[3px]"
          >
            <Plus size={14} />
            <span>CREATE_CUSTOM_ROLE</span>
          </button>
        )}
      </header>

      {/* Error Banners */}
      {error && (
        <div className="bg-graphite border border-denied-red p-3 flex items-start space-x-2.5 text-xs text-denied-red font-mono rounded-[3px]">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Roles grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="md:col-span-2 text-center py-10 font-mono text-xs text-bone-dim">
            [SYS] COMPILING CLEARANCE MATRICES...
          </div>
        ) : (
          roles.map((role) => (
            <div 
              key={role._id} 
              className={`bg-steel border ${
                role.name === 'Super Admin' ? 'border-denied-red/50' : 'border-steel-line'
              } p-5 rounded-[4px] flex flex-col justify-between space-y-4`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm font-condensed font-bold tracking-wider text-bone">
                      {role.name.toUpperCase()}
                    </h2>
                    {role.isSystemRole ? (
                      <span className="text-[9px] font-mono border border-steel-line px-1 text-bone-dim bg-graphite/40">SYSTEM</span>
                    ) : (
                      <span className="text-[9px] font-mono border border-clearance-amber/40 px-1 text-clearance-amber bg-clearance-amber/5">CUSTOM</span>
                    )}
                  </div>
                  <p className="text-bone-dim text-[11px] mt-1 font-sans leading-relaxed">{role.description}</p>
                </div>

                <div className="flex items-center space-x-1 shrink-0 ml-4">
                  {canManage && (
                    <>
                      <button
                        onClick={() => handleOpenEditModal(role)}
                        title="Modify permissions bind"
                        className="p-1.5 border border-steel-line hover:border-bone rounded-[3px] text-bone-dim hover:text-bone transition-colors"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role)}
                        title={role.isSystemRole ? 'System role is deletion-protected' : 'Erase role matrix'}
                        disabled={role.isSystemRole}
                        className={`p-1.5 border border-steel-line hover:border-denied-red hover:text-denied-red rounded-[3px] text-bone-dim transition-colors ${
                          role.isSystemRole ? 'opacity-30 cursor-not-allowed hover:border-steel-line hover:text-bone-dim' : ''
                        }`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Mapped permissions keys */}
              <div>
                <div className="text-[9px] font-mono tracking-widest text-bone-dim mb-1.5">MAPPED_CLEARANCE_KEYS</div>
                <div className="bg-graphite/60 border border-steel-line p-2.5 rounded-[3px] min-h-[50px] max-h-[140px] overflow-y-auto font-mono text-[10px] space-y-1">
                  {role.name === 'Super Admin' ? (
                    <div className="text-granted-green font-bold flex items-center space-x-1.5">
                      <ShieldCheck size={12} />
                      <span>MASTER_BYPASS_ENABLED (*)</span>
                    </div>
                  ) : role.permissions.length === 0 ? (
                    <span className="text-bone-dim italic">[NO_CLEARANCE_KEYS_BOUND]</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map(p => (
                        <span 
                          key={p._id} 
                          title={p.description} 
                          className="px-1 bg-steel border border-steel-line text-bone-dim hover:text-bone"
                        >
                          {p.key}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Role creation / edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-graphite/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-steel border border-steel-line p-6 rounded-[4px] relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-bone-dim hover:text-bone"
            >
              <X size={16} />
            </button>

            <header className="mb-6 border-b border-steel-line pb-2">
              <h2 className="text-sm font-mono font-bold tracking-wider text-clearance-amber">
                {editingRole ? 'EDIT_SECURITY_MATRIX' : 'CREATE_CUSTOM_ROLE_MATRIX'}
              </h2>
            </header>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono tracking-widest text-bone-dim mb-1">ROLE_NAME</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    disabled={editingRole?.isSystemRole}
                    className="w-full bg-graphite border border-steel-line px-3 py-2 text-bone font-mono focus:border-clearance-amber focus:outline-none rounded-[3px] disabled:opacity-50"
                    placeholder="e.g. Security Auditor"
                  />
                  {editingRole?.isSystemRole && (
                    <p className="text-[10px] text-bone-dim font-mono mt-1">System role names are read-only.</p>
                  )}
                  {validationErrors.find(v => v.field === 'name') && (
                    <p className="text-denied-red mt-1 font-mono text-[10px]">{validationErrors.find(v => v.field === 'name').message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-widest text-bone-dim mb-1">DESCRIPTION</label>
                  <input
                    type="text"
                    required
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-graphite border border-steel-line px-3 py-2 text-bone font-mono focus:border-clearance-amber focus:outline-none rounded-[3px]"
                    placeholder="Brief definition of operator clearances"
                  />
                  {validationErrors.find(v => v.field === 'description') && (
                    <p className="text-denied-red mt-1 font-mono text-[10px]">{validationErrors.find(v => v.field === 'description').message}</p>
                  )}
                </div>
              </div>

              {/* Permission categories toggles */}
              <div>
                <span className="block text-[10px] font-mono tracking-widest text-bone-dim mb-2">CLEARANCE_KEY_GRID</span>
                <div className="space-y-4 bg-graphite border border-steel-line p-4 max-h-[300px] overflow-y-auto rounded-[3px]">
                  {Object.entries(groupedPermissions).map(([cat, perms]) => (
                    <div key={cat} className="space-y-1.5">
                      <div className="text-[9px] font-mono text-clearance-amber border-b border-steel-line pb-0.5 uppercase tracking-wider">
                        {cat}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map(p => (
                          <label key={p._id} className="flex items-start space-x-2 font-mono text-[10px] text-bone-dim hover:text-bone cursor-pointer py-0.5">
                            <input
                              type="checkbox"
                              checked={formPermissions.includes(p._id)}
                              onChange={() => handlePermissionToggle(p._id)}
                              className="accent-clearance-amber border border-steel-line rounded-[2px] mt-0.5"
                            />
                            <div>
                              <span className="text-bone font-bold">{p.key}</span>
                              <p className="text-[9px] text-bone-dim/70 leading-tight font-sans mt-0.5">{p.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-clearance-amber hover:bg-clearance-amber/90 text-graphite font-condensed font-bold tracking-wider text-sm transition-colors rounded-[3px] mt-4"
              >
                {editingRole ? 'COMMIT_SECURITY_MATRIX_EDITS' : 'ENROLL_ROLE_MATRIX'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
