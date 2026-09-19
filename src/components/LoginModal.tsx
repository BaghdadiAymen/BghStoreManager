import React, { useState } from 'react';
import { User } from '../types';
import { getPasswords, resetPasswordsToDefaultWithMasterKey, getStoreName } from '../lib/store';
import { Lock, User as UserIcon, ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react';

interface LoginModalProps {
  onLogin: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showMasterReset, setShowMasterReset] = useState(false);
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPasswords = getPasswords();
    const cleanUser = username.trim().toLowerCase();

    if (cleanUser === 'admin' && password === storedPasswords.admin) {
      onLogin({ username: 'admin', role: 'admin' });
    } else if (cleanUser === 'seller' && password === storedPasswords.seller) {
      onLogin({ username: 'seller', role: 'seller' });
    } else {
      setError('Invalid username or password. Check your password or use Master Key recovery below.');
    }
  };

  const handleMasterReset = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = resetPasswordsToDefaultWithMasterKey(masterKeyInput);
    if (ok) {
      setResetSuccess('Passwords reset to defaults! (admin: admin123 / seller: seller123)');
      setError('');
      setTimeout(() => {
        setShowMasterReset(false);
        setMasterKeyInput('');
      }, 2000);
    } else {
      setError('Invalid Developer Master Reset Code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 mb-2">
            <UserIcon className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase">📱 {getStoreName()}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Store Manager & POS Access</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resetSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{resetSuccess}</span>
          </div>
        )}

        {!showMasterReset ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or seller"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors text-sm cursor-pointer"
            >
              Sign In
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowMasterReset(true)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
              >
                Forgot Password? Emergency Master Reset
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleMasterReset} className="space-y-4 p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
              <KeyRound className="w-4 h-4" />
              <span>Developer Master Reset Code</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Enter the master developer code (<code className="bg-amber-200 dark:bg-amber-900/60 px-1 rounded font-mono">BOUKHARI-RESET-2026</code>) to restore default login credentials.
            </p>
            <input
              type="password"
              value={masterKeyInput}
              onChange={(e) => setMasterKeyInput(e.target.value)}
              placeholder="Enter Master Code..."
              className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                Reset Credentials
              </button>
              <button
                type="button"
                onClick={() => setShowMasterReset(false)}
                className="py-2 px-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="pt-2 text-center text-xs text-slate-400 dark:text-slate-500">
          BiPOS Terminal v1.0 • Offline Ready
        </div>
      </div>
    </div>
  );
};
