import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await api.post('/auth/register', { name, email, password });
      setSuccess('Operator registration successful. Proceed to system login.');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      console.error('Registration failed', err);
      const errMsg = err.response?.data?.message || 'Failed to complete registration check.';
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-graphite flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-steel border border-steel-line p-8 rounded-[4px]">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center space-x-2 text-clearance-amber font-condensed tracking-wider font-bold text-sm">
            <ShieldCheck size={16} />
            <span>ACCESSGATE // BOOTSTRAP_INTERFACE</span>
          </div>
          <h1 className="text-2xl font-bold font-condensed tracking-tight mt-2 text-bone">
            REGISTER SECURITY OPERATOR
          </h1>
          <p className="text-bone-dim text-xs font-sans mt-1">
            Note: First registered profile will inherit Super Admin root clearance keys.
          </p>
        </header>

        {/* Status Alerts */}
        {error && (
          <div className="mb-6 bg-graphite border border-denied-red p-3 flex items-start space-x-2.5 text-xs text-denied-red font-mono rounded-[3px]">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">REGISTER_ERR:</span> {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-graphite border border-granted-green p-3 flex items-start space-x-2.5 text-xs text-granted-green font-mono rounded-[3px]">
            <ShieldCheck size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">REGISTER_SUCCESS:</span> {success}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono tracking-widest text-bone-dim mb-1" htmlFor="name">
              OPERATOR_NAME
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-graphite border border-steel-line px-3 py-2 text-sm text-bone font-mono focus:border-clearance-amber focus:outline-none rounded-[3px]"
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono tracking-widest text-bone-dim mb-1" htmlFor="email">
              OPERATOR_EMAIL
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-graphite border border-steel-line px-3 py-2 text-sm text-bone font-mono focus:border-clearance-amber focus:outline-none rounded-[3px]"
              placeholder="operator@corp.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono tracking-widest text-bone-dim mb-1" htmlFor="password">
              ASSIGN_PASSPHRASE
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-graphite border border-steel-line px-3 py-2 text-sm text-bone font-mono focus:border-clearance-amber focus:outline-none rounded-[3px]"
              placeholder="•••••••• (Min 6 chars)"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || success !== null}
            className="w-full py-2.5 bg-clearance-amber text-graphite font-condensed font-bold text-sm tracking-wider hover:bg-clearance-amber/90 active:bg-clearance-amber/80 disabled:opacity-50 transition-colors duration-150 rounded-[3px] mt-2"
          >
            {isSubmitting ? 'ENROLLING_PROFILE...' : 'ENROLL_CREDENTIALS'}
          </button>
        </form>

        <div className="mt-6 border-t border-steel-line pt-4 text-center">
          <p className="text-bone-dim text-[11px]">
            Already enrolled?{' '}
            <Link to="/login" className="text-clearance-amber hover:underline font-mono">
              LOG_IN_TO_CONSOLE
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
