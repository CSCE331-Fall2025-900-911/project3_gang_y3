"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useLanguage } from '../components/LanguageProvider';

interface LoginModalProps {
  role: 'Manager' | 'Cashier';
  onClose: () => void;
}

export default function LoginModal({ role, onClose }: LoginModalProps) {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const router = useRouter();

  // Clear any existing session data when modal opens to ensure clean login for new role
  useEffect(() => {
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('pendingRole');
    sessionStorage.removeItem('pendingUsername');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store auth info in sessionStorage
        sessionStorage.setItem('userRole', data.role);
        sessionStorage.setItem('username', data.username);

        // Close modal first
        onClose();
      } else {
        setError(data.error || t('Login failed'));
      }
    } catch {
      setError(t('Network error. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError('');
    setSuccess('');
    setShowEmailPrompt(true);
  };

  const verifyAndSignIn = async () => {
    if (!googleEmail) {
      setError(t('Please enter your Google email'));
      return;
    }

    setGoogleLoading(true);
    setError('');
    setSuccess('');

    try {
      // First verify the email exists in our database
      const verifyResponse = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: googleEmail, role }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.authorized) {
        setError(verifyData.error || t('Not authorized'));
        setGoogleLoading(false);
        return;
      }

      // Email is authorized, show success and proceed with OAuth
      setSuccess(`✓ ${t('Authorized as')} ${verifyData.role}! ${t('Redirecting to Google...')}`);

      // Store the role for after OAuth
      sessionStorage.setItem('pendingRole', verifyData.role);
      sessionStorage.setItem('pendingUsername', verifyData.username);

      // Small delay to show success message
      setTimeout(async () => {
        await signIn('google', {
          callbackUrl: verifyData.role === 'Manager' ? '/manager' : '/cashier'
        });
      }, 1000);

    } catch {
      setError(t('Failed to verify email. Please try again.'));
      setGoogleLoading(false);
    }
  };

  const cancelEmailPrompt = () => {
    setShowEmailPrompt(false);
    setGoogleEmail('');
    setError('');
    setSuccess('');
    setGoogleLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative z-10 w-[90%] max-w-md rounded-lg bg-white dark:bg-zinc-800 p-8 shadow-xl text-black dark:text-white transition-colors">
        <h2 className="text-2xl font-bold mb-2">{role} {t("Login")}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {t("Sign in as")} {role}
        </p>

        {/* Email verification prompt for Google Sign In */}
        {showEmailPrompt ? (
          <div className="mb-4 p-4 border border-blue-300 dark:border-blue-600 rounded bg-blue-50 dark:bg-blue-900/30">
            <h3 className="font-medium mb-2">{t("Verify your Google email")}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {t("Enter your Google email to check authorization")}
            </p>
            <input
              type="email"
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              placeholder="your.email@gmail.com"
              className="w-full px-4 py-2 mb-3 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={googleLoading}
            />

            {error && (
              <div className="mb-3 p-3 rounded bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 text-sm">
                ✕ {error}
              </div>
            )}

            {success && (
              <div className="mb-3 p-3 rounded bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 text-sm">
                {success}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={verifyAndSignIn}
                disabled={googleLoading || !googleEmail}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded transition-colors"
              >
                {googleLoading ? t('Verifying...') : t('Verify & Sign In')}
              </button>
              <button
                onClick={cancelEmailPrompt}
                disabled={googleLoading}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-black dark:text-white font-medium rounded transition-colors"
              >
                {t("Cancel")}
              </button>
            </div>
          </div>
        ) : (
          /* Google Sign In Button */
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 mb-4 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium">
              {googleLoading ? t('Redirecting...') : t('Sign in with Google')}
            </span>
          </button>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-zinc-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-zinc-800 text-gray-500 dark:text-gray-400">
              {t("or continue with username")}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              {t("Username")}
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("Enter username")}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              {t("Password")}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("Enter password")}
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded transition-colors"
            >
              {loading ? t('Signing in...') : t('Sign In')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-black dark:text-white font-medium rounded transition-colors"
            >
              {t("Cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
