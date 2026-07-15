import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { KeyRound, ShieldAlert, ShieldCheck } from 'lucide-react';

export const ForgotResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  // Forgot Password state
  const [email, setEmail] = useState('');
  
  // Reset Password state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccess(res.data.message || 'If registered, a reset key link was dispatched to console logs.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to dispatch reset key.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passphrases do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      setSuccess(res.data.message || 'Password reset successful. Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password. Reset token may have expired.');
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
            <span>ACCESSGATE // KEY_RECOVERY_PROTOCOL</span>
          </div>
          <h1 className="text-2xl font-bold font-condensed tracking-tight mt-2 text-bone">
            {token ? 'RESET PASSWORD' : 'FORGOT PASSWORD'}
          </h1>
          <p className="text-bone-dim text-xs font-sans mt-1">
            {token 
              ? 'Provide a new secure passphrase to complete system recovery.'
              : 'Enter registered email to request a console bypass token.'}
          </p>
        </header>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-graphite border border-denied-red p-3 flex items-start space-x-2.5 text-xs text-denied-red font-mono rounded-[3px]">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">RECOVERY_ERR:</span> {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-graphite border border-granted-green p-3 flex items-start space-x-2.5 text-xs text-granted-green font-mono rounded-[3px]">
            <ShieldCheck size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">RECOVERY_STATUS:</span> {success}
            </div>
          </div>
        )}

        {/* Form selection */}
        {token ? (
          /* Reset Password Form */
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono tracking-widest text-bone-dim mb-1" htmlFor="password">
                NEW_SECURE_PASSPHRASE
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

            <div>
              <label className="block text-[10px] font-mono tracking-widest text-bone-dim mb-1" htmlFor="confirmPassword">
                CONFIRM_NEW_PASSPHRASE
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-graphite border border-steel-line px-3 py-2 text-sm text-bone font-mono focus:border-clearance-amber focus:outline-none rounded-[3px]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-clearance-amber text-graphite font-condensed font-bold text-sm tracking-wider hover:bg-clearance-amber/90 active:bg-clearance-amber/80 disabled:opacity-50 transition-colors duration-150 rounded-[3px]"
            >
              {isSubmitting ? 'UPDATING_DATABASE...' : 'SUBMIT_NEW_PASSPHRASE'}
            </button>
          </form>
        ) : (
          /* Forgot Password Form */
          <form onSubmit={handleForgotSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-clearance-amber text-graphite font-condensed font-bold text-sm tracking-wider hover:bg-clearance-amber/90 active:bg-clearance-amber/80 disabled:opacity-50 transition-colors duration-150 rounded-[3px]"
            >
              {isSubmitting ? 'GENERATING_RESET_KEY...' : 'DISPATCH_RECOVERY_KEY'}
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-steel-line pt-4 text-center">
          <Link to="/login" className="text-[11px] text-clearance-amber hover:underline font-mono">
            RETURN_TO_LOGIN
          </Link>
        </div>
      </div>
    </div>
  );
};
