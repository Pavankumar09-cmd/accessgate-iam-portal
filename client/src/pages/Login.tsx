import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { api } from '../api';
import { ShieldAlert, KeyRound } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user } = res.data;
      
      login(accessToken, user);
      navigate('/');
    } catch (err: any) {
      console.error('Login error', err);
      const errMsg = err.response?.data?.message || 'Access denied. Please check your credentials.';
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
            <KeyRound size={16} />
            <span>ACCESSGATE // CLIENT_AUTHENTICATION</span>
          </div>
          <h1 className="text-2xl font-bold font-condensed tracking-tight mt-2 text-bone">
            SECURE SYSTEM CONSOLE
          </h1>
          <p className="text-bone-dim text-xs font-sans mt-1">
            Authorized operations only. All events logged under audit code 10-A.
          </p>
        </header>

        {/* Error Indicator */}
        {error && (
          <div className="mb-6 bg-graphite border border-denied-red p-3 flex items-start space-x-2.5 text-xs text-denied-red font-mono rounded-[3px]">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">AUTH_FAILURE:</span> {error}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-mono tracking-widest text-bone-dim" htmlFor="password">
                ACCESS_PASSPHRASE
              </label>
              <Link to="/forgot-password" className="text-[10px] font-mono text-clearance-amber hover:underline">
                FORGOT_PASS?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-graphite border border-steel-line px-3 py-2 text-sm text-bone font-mono focus:border-clearance-amber focus:outline-none rounded-[3px]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-clearance-amber text-graphite font-condensed font-bold text-sm tracking-wider hover:bg-clearance-amber/90 active:bg-clearance-amber/80 disabled:opacity-50 transition-colors duration-150 rounded-[3px] mt-2"
          >
            {isSubmitting ? 'VERIFYING_CREDENTIALS...' : 'REQUEST_CLEARANCE'}
          </button>
        </form>

        <div className="mt-6 border-t border-steel-line pt-4 text-center">
          <p className="text-bone-dim text-[11px]">
            No operator account?{' '}
            <Link to="/register" className="text-clearance-amber hover:underline font-mono">
              REGISTER_GATEKEEPER
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
