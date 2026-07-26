import { LockKeyhole, Mail, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import { api } from '../services/api.js';

function getPasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;
  return ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
}

export default function Auth() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = getPasswordStrength(password);
  const strengthColor = {
    'Weak': 'text-red-500',
    'Fair': 'text-orange-500',
    'Good': 'text-yellow-500',
    'Strong': 'text-lime-500',
    'Very Strong': 'text-green-500',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      let authData;
      if (isLoginMode) {
        const response = await api.auth.login(email, password);
        authData = response.data || response;
      } else {
        if (!name || !phone) {
          throw new Error('Name and phone are required for signup');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        const response = await api.auth.signup({ name, age, phone, email, password });
        authData = response.data || response;
      }

      if (!authData?.token) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('auth_token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      window.dispatchEvent(new Event('authUpdated'));

      navigate('/profile');
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <section className="glass rounded-lg p-6">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-cyanGlow">Secure access</p>
          <h1 className="mt-3 text-4xl font-black">Login to Crypto Market</h1>
          <p className="mt-4 leading-7 text-slate-300">
            Create an account or login to save your watchlist, portfolio, and get personalized market insights.
          </p>
          <div className="mt-6 space-y-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">✓ Email and password authentication</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">✓ Persistent watchlist sync</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">✓ Portfolio tracking</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">✓ AI-powered market insights</div>
          </div>
        </section>

        <form className="glass rounded-lg p-6" onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {!isLoginMode && (
            <>
              <label className="mb-2 block text-sm font-bold text-slate-300">Full Name</label>
              <input
                className="input w-full"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLoginMode}
                disabled={isLoading}
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">Age</label>
                  <input
                    className="input w-full"
                    type="number"
                    min="0"
                    max="150"
                    placeholder="28"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required={!isLoginMode}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">Phone</label>
                  <input
                    className="input w-full"
                    type="tel"
                    placeholder="+1 555 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required={!isLoginMode}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </>
          )}

          <label className="mb-2 block text-sm font-bold text-slate-300 {!isLoginMode && 'mt-4'}">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-slate-500" size={18} />
            <input
              className="input pl-10"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <label className="mb-2 mt-4 block text-sm font-bold text-slate-300">Password</label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-3.5 text-slate-500" size={18} />
            <input
              className="input pl-10 pr-10"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          {!isLoginMode && password && (
            <p className={`text-xs mt-2 ${strengthColor[passwordStrength] || 'text-slate-400'}`}>
              Password strength: {passwordStrength}
            </p>
          )}

          <button
            type="submit"
            className="gradient-button mt-6 w-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || (!isLoginMode && password.length < 8)}
          >
            {isLoading ? 'Processing...' : (isLoginMode ? 'Login' : 'Create Account')}
          </button>

          <button
            type="button"
            className="mt-3 w-full text-sm text-slate-400 hover:text-slate-200"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
              setPassword('');
            }}
            disabled={isLoading}
          >
            {isLoginMode ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
