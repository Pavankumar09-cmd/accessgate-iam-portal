import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../components/AuthContext';
import { 
  Search, 
  UserPlus, 
  UserX, 
  UserCheck, 
  Edit3, 
  Trash2, 
  X,
  AlertTriangle
} from 'lucide-react';

interface Role {
  _id: string;
  name: string;
  description: string;
}

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  roles: Role[];
  lastLogin?: string;
  createdAt: string;
}

export const Users: React.FC = () => {
  const { hasPermission, user: currentUser } = useAuth();
  const canWrite = hasPermission('users:write');

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRoles, setFormRoles] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (selectedRole) params.role = selectedRole;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.get('/users', { params });
      setUsers(res.data);
    } catch (err: any) {
      console.error('Failed to load user records', err);
      setError(err.response?.data?.message || 'Failed to query user registry.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
      setRoles(res.data);
    } catch (err) {
      console.error('Failed to fetch roles list', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, selectedRole, selectedStatus]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRoles([]);
    setFormStatus('active');
    setValidationErrors([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserRecord) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword(''); // leave blank unless changing password
    setFormRoles(user.roles.map(r => r._id));
    setFormStatus(user.status);
    setValidationErrors([]);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    setError(null);

    const payload: any = {
      name: formName,
      email: formEmail,
      roles: formRoles,
    };

    if (formPassword) {
      payload.password = formPassword;
    }

    try {
      if (editingUser) {
        payload.status = formStatus;
        await api.put(`/users/${editingUser._id}`, payload);
      } else {
        // password required for registration/creation
        if (!formPassword) {
          setValidationErrors([{ field: 'password', message: 'Password passphrase is required for new operators.' }]);
          return;
        }
        payload.password = formPassword;
        await api.post('/users', payload);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error('Form submission failed', err);
      if (err.response?.data?.error === 'VALIDATION_FAILED') {
        setValidationErrors(err.response.data.details || []);
      } else {
        setError(err.response?.data?.message || 'An error occurred during save operations.');
      }
    }
  };

  const handleToggleStatus = async (user: UserRecord) => {
    if (!canWrite) return;
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/users/${user._id}`, { status: newStatus });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Status flip operation denied.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!canWrite) return;
    if (!window.confirm('CRITICAL WARNING: This action will completely erase the operator registration. Do you want to proceed?')) {
      return;
    }
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operator delete sequence failed.');
    }
  };

  const handleRoleCheckboxChange = (roleId: string) => {
    if (formRoles.includes(roleId)) {
      setFormRoles(formRoles.filter(id => id !== roleId));
    } else {
      setFormRoles([...formRoles, roleId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="border-b border-steel-line pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-condensed tracking-tight">OPERATOR REGISTRY</h1>
          <p className="text-bone-dim text-xs">Maintain enrolled profiles, assign security roles, and suspend clearance codes.</p>
        </div>

        {canWrite && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-clearance-amber hover:bg-clearance-amber/90 text-graphite font-condensed font-bold text-xs tracking-wider transition-colors rounded-[3px]"
          >
            <UserPlus size={14} />
            <span>ENROLL_NEW_OPERATOR</span>
          </button>
        )}
      </header>

      {/* Error Info Banner */}
      {error && (
        <div className="bg-graphite border border-denied-red p-3 flex items-start space-x-2.5 text-xs text-denied-red font-mono rounded-[3px]">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Filters Bar */}
      <div className="bg-steel border border-steel-line p-3 flex flex-wrap gap-3 items-center justify-between rounded-[4px]">
        {/* Search */}
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-bone-dim">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search by name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-graphite border border-steel-line pl-9 pr-3 py-1.5 text-xs font-mono text-bone focus:border-clearance-amber focus:outline-none rounded-[3px]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="text-bone-dim">ROLE:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-graphite border border-steel-line px-2 py-1 text-bone focus:border-clearance-amber focus:outline-none rounded-[3px] text-xs"
            >
              <option value="">[ALL_ROLES]</option>
              {roles.map(r => (
                <option key={r._id} value={r.name}>{r.name.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-bone-dim">STATUS:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-graphite border border-steel-line px-2 py-1 text-bone focus:border-clearance-amber focus:outline-none rounded-[3px] text-xs"
            >
              <option value="">[ALL_STATUS]</option>
              <option value="active">ACTIVE</option>
              <option value="inactive">SUSPENDED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Operators List Table */}
      <div className="bg-steel border border-steel-line rounded-[4px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-graphite/40 border-b border-steel-line font-mono text-[10px] text-bone-dim tracking-wider">
                <th className="px-4 py-3">OPERATOR_PROFILE</th>
                <th className="px-4 py-3">ASSIGNED_CLEARANCES</th>
                <th className="px-4 py-3">SYSTEM_STATUS</th>
                <th className="px-4 py-3">LAST_CONSOLE_ACCESS</th>
                {canWrite && <th className="px-4 py-3 text-right">CONTROLS</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-line">
              {isLoading ? (
                <tr>
                  <td colSpan={canWrite ? 5 : 4} className="px-4 py-8 text-center text-bone-dim font-mono">
                    [SYS] QUERYING USER REGISTER RECORDS...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={canWrite ? 5 : 4} className="px-4 py-8 text-center text-bone-dim font-mono">
                    [WARNING] NO REGISTERED RECORD SET MATCHES INSTRUCTIONS.
                  </td>
                </tr>
              ) : (
                users.map((rec) => (
                  <tr key={rec._id} className="hover:bg-graphite/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-condensed font-bold text-bone">{rec.name}</div>
                      <div className="text-bone-dim font-mono text-[11px] mt-0.5">{rec.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      {rec.roles.length === 0 ? (
                        <span className="text-denied-red font-bold">[NO_CLEARANCE]</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {rec.roles.map(r => (
                            <span 
                              key={r._id} 
                              className={`px-1.5 py-0.5 border ${
                                r.name === 'Super Admin' ? 'border-denied-red text-denied-red bg-denied-red/5 font-extrabold' : 
                                r.name === 'Admin' ? 'border-clearance-amber text-clearance-amber bg-clearance-amber/5 font-bold' : 
                                r.name === 'Auditor' ? 'border-bone text-bone bg-bone/5' : 
                                'border-steel-line text-bone-dim'
                              } rounded-[2px]`}
                            >
                              {r.name.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <div className="flex items-center space-x-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${rec.status === 'active' ? 'bg-granted-green' : 'bg-denied-red'}`}></span>
                        <span className={rec.status === 'active' ? 'text-granted-green' : 'text-denied-red'}>
                          {rec.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-bone-dim">
                      {rec.lastLogin 
                        ? new Date(rec.lastLogin).toISOString().replace('T', ' ').substring(0, 19) + 'Z' 
                        : 'NEVER_LOGGED'}
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleToggleStatus(rec)}
                            title={rec.status === 'active' ? 'Suspend clearances' : 'Activate clearances'}
                            className={`p-1.5 border border-steel-line hover:border-bone rounded-[3px] text-bone-dim hover:text-bone transition-colors ${
                              rec._id === currentUser?.id ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            disabled={rec._id === currentUser?.id}
                          >
                            {rec.status === 'active' ? <UserX size={13} className="text-denied-red" /> : <UserCheck size={13} className="text-granted-green" />}
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(rec)}
                            title="Edit registry file"
                            className="p-1.5 border border-steel-line hover:border-bone rounded-[3px] text-bone-dim hover:text-bone transition-colors"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(rec._id)}
                            title="Erase registry profile"
                            className={`p-1.5 border border-steel-line hover:border-denied-red hover:text-denied-red rounded-[3px] text-bone-dim transition-colors ${
                              rec._id === currentUser?.id ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            disabled={rec._id === currentUser?.id}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-graphite/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-steel border border-steel-line p-6 rounded-[4px] relative">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-bone-dim hover:text-bone"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <header className="mb-6 border-b border-steel-line pb-2">
              <h2 className="text-sm font-mono font-bold tracking-wider text-clearance-amber">
                {editingUser ? 'EDIT_OPERATOR_REGISTRY' : 'ENROLL_NEW_OPERATOR'}
              </h2>
            </header>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-bone-dim mb-1">NAME</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-graphite border border-steel-line px-3 py-2 text-bone font-mono focus:border-clearance-amber focus:outline-none rounded-[3px]"
                />
                {validationErrors.find(v => v.field === 'name') && (
                  <p className="text-denied-red mt-1 font-mono text-[10px]">{validationErrors.find(v => v.field === 'name').message}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-mono tracking-widest text-bone-dim mb-1">EMAIL</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-graphite border border-steel-line px-3 py-2 text-bone font-mono focus:border-clearance-amber focus:outline-none rounded-[3px]"
                />
                {validationErrors.find(v => v.field === 'email') && (
                  <p className="text-denied-red mt-1 font-mono text-[10px]">{validationErrors.find(v => v.field === 'email').message}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-mono tracking-widest text-bone-dim mb-1">
                  {editingUser ? 'NEW_PASSPHRASE (OPTIONAL)' : 'PASSPHRASE'}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full bg-graphite border border-steel-line px-3 py-2 text-bone font-mono focus:border-clearance-amber focus:outline-none rounded-[3px]"
                  placeholder={editingUser ? 'Leave blank to preserve' : 'Min 6 characters'}
                />
                {validationErrors.find(v => v.field === 'password') && (
                  <p className="text-denied-red mt-1 font-mono text-[10px]">{validationErrors.find(v => v.field === 'password').message}</p>
                )}
              </div>

              {/* Roles checkboxes */}
              <div>
                <span className="block text-[10px] font-mono tracking-widest text-bone-dim mb-2">ASSIGN_CLEARANCE_ROLES</span>
                <div className="space-y-1.5 bg-graphite border border-steel-line p-3 max-h-[120px] overflow-y-auto rounded-[3px]">
                  {roles.map(role => (
                    <label key={role._id} className="flex items-center space-x-2 font-mono text-[11px] text-bone hover:text-clearance-amber cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formRoles.includes(role._id)}
                        onChange={() => handleRoleCheckboxChange(role._id)}
                        className="accent-clearance-amber border border-steel-line rounded-[2px]"
                      />
                      <span>{role.name.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              {editingUser && (
                <div>
                  <label className="block text-[10px] font-mono tracking-widest text-bone-dim mb-1">OPERATING_STATUS</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-graphite border border-steel-line px-3 py-2 text-bone font-mono focus:border-clearance-amber focus:outline-none rounded-[3px]"
                  >
                    <option value="active">ACTIVE</option>
                    <option value="inactive">SUSPENDED</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-clearance-amber hover:bg-clearance-amber/90 text-graphite font-condensed font-bold tracking-wider text-sm transition-colors rounded-[3px] mt-4"
              >
                {editingUser ? 'COMMIT_REGISTRY_EDITS' : 'ENROLL_OPERATOR_DATA'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
