import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Edit2, Save, X, Trash2, LogOut, AlertCircle, Award, Brain, Star, BarChart3, Phone, Calendar } from 'lucide-react';
import PageShell from '../components/PageShell.jsx';
import { useWatchlist } from '../context/WatchlistContext.jsx';
import { currency } from '../utils/format.js';
import { useCurrency } from '../hooks/useCurrency.js';

export default function Profile() {
  const navigate = useNavigate();
  const { currencyCode } = useCurrency();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({ name: '', age: '', phone: '', avatarUrl: '' });
  const { items: watchlistItems } = useWatchlist();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          navigate('/auth');
          return;
        }

        const response = await fetch(`${apiBaseUrl}/profile`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            navigate('/auth');
            return;
          }
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfile(data.data);
        setFormData({
          name: data.data.name || '',
          age: data.data.age || '',
          phone: data.data.phone || '',
          avatarUrl: data.data.avatarUrl || '',
        });
      } catch {
        setError('Failed to load profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, apiBaseUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    setError('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/auth');
        return;
      }

      const response = await fetch(`${apiBaseUrl}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update profile');
      }

      const data = await response.json();
      setProfile(data.data);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      localStorage.setItem('user', JSON.stringify(data.data));

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError('');
    setIsSaving(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/auth');
        return;
      }

      const response = await fetch(`${apiBaseUrl}/profile`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete account');
      }

      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('authUpdated'));
      navigate('/auth');
    } catch (err) {
      setError(err.message || 'Failed to delete account. Please try again.');
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('authUpdated'));
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="min-h-[500px] flex items-center justify-center">
          <div className="text-slate-400 text-sm font-bold animate-pulse">Loading profile settings...</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto flex flex-col gap-6"
      >
        {/* Header */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyanGlow">Account & Security</p>
          <h1 className="mt-3 text-4xl font-black text-white bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">User Profile settings</h1>
          <p className="text-xs text-slate-400 mt-1">Manage credentials, preferences, and view platform metrics</p>
        </div>

        {/* Success/Error Banners */}
        {successMessage && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
            <p className="text-xs font-bold text-green-300">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 animate-bounce" />
            <p className="text-xs font-bold text-red-300">{error}</p>
          </div>
        )}

        {/* Statistics Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="metric-card-premium group" style={{ '--glow-start': 'rgba(6,182,212,0.2)', '--glow-end': 'rgba(139,92,246,0.15)' }}>
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-cyanGlow/5 rounded-full blur-2xl transition group-hover:bg-cyanGlow/10" />
            <div className="flex items-center gap-2.5">
              <BarChart3 size={15} className="text-cyanGlow" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Portfolio</span>
            </div>
            <p className="mt-3 text-xl font-black text-white">{currency(48250, false, currencyCode)}</p>
          </div>
          <div className="metric-card-premium group" style={{ '--glow-start': 'rgba(245,158,11,0.2)', '--glow-end': 'rgba(139,92,246,0.15)' }}>
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-amberGlow/5 rounded-full blur-2xl transition group-hover:bg-amberGlow/10" />
            <div className="flex items-center gap-2.5">
              <Star size={15} className="text-amberGlow" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Watchlist</span>
            </div>
            <p className="mt-3 text-xl font-black text-white">{watchlistItems.length} Saved</p>
          </div>
          <div className="metric-card-premium group" style={{ '--glow-start': 'rgba(139,92,246,0.2)', '--glow-end': 'rgba(59,130,246,0.15)' }}>
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-purple-500/5 rounded-full blur-2xl transition group-hover:bg-purple-500/10" />
            <div className="flex items-center gap-2.5">
              <Brain size={15} className="text-purple-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">AI usage</span>
            </div>
            <p className="mt-3 text-xl font-black text-white">142 Requests</p>
          </div>
          <div className="metric-card-premium group" style={{ '--glow-start': 'rgba(47,244,166,0.2)', '--glow-end': 'rgba(139,92,246,0.15)' }}>
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-mint/5 rounded-full blur-2xl transition group-hover:bg-mint/10" />
            <div className="flex items-center gap-2.5">
              <Award size={15} className="text-mint" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tier Status</span>
            </div>
            <p className="mt-3 text-xl font-black text-white">VIP Premium</p>
          </div>
        </div>

        {/* Profile Card */}
        {profile && (
          <div className="glass-premium rounded-2xl p-6 border border-white/8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyanGlow/5 blur-3xl pointer-events-none rounded-full" />
            
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/5 relative z-10">
              <div className="relative">
                {formData.avatarUrl && !isEditing ? (
                  <img
                    src={formData.avatarUrl}
                    alt={formData.name}
                    className="w-20 h-20 rounded-full object-cover border border-cyanGlow/40 p-1 bg-white/5 shadow-[0_0_15px_rgba(40,215,255,0.2)]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyanGlow via-blue-500 to-purple-600 flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(40,215,255,0.2)]">
                    <User className="w-9 h-9 text-slate-950" strokeWidth={2.4} />
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-black text-white tracking-tight">{formData.name || 'Anonymous User'}</h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><Mail size={13} className="text-cyanGlow" /> {profile.email}</span>
                  {profile.phone && <span className="flex items-center gap-1.5"><Phone size={13} className="text-cyanGlow" /> {profile.phone}</span>}
                  {profile.age && <span className="flex items-center gap-1.5"><Calendar size={13} className="text-cyanGlow" /> {profile.age} yrs</span>}
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="mt-6 relative z-10">
              {isEditing ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="input-premium text-xs"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Age</label>
                      <input
                        type="number"
                        name="age"
                        min="0"
                        value={formData.age}
                        onChange={handleInputChange}
                        placeholder="28"
                        className="input-premium text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 555 123 4567"
                        className="input-premium text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Avatar URL</label>
                    <input
                      type="url"
                      name="avatarUrl"
                      value={formData.avatarUrl}
                      onChange={handleInputChange}
                      placeholder="https://example.com/avatar.jpg"
                      className="input-premium text-xs"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex-1 btn-gradient-premium text-xs font-black uppercase tracking-wider"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: profile.name || '',
                          age: profile.age || '',
                          phone: profile.phone || '',
                          avatarUrl: profile.avatarUrl || '',
                        });
                      }}
                      className="flex-1 btn-premium text-xs font-black uppercase tracking-wider"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="bg-white/3 border border-white/5 rounded-xl p-4">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Full Name</label>
                      <p className="text-white font-extrabold text-sm mt-1.5">{formData.name || 'Not configured'}</p>
                    </div>
                    <div className="bg-white/3 border border-white/5 rounded-xl p-4">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Email Address</label>
                      <p className="text-white font-extrabold text-sm mt-1.5 truncate">{profile.email}</p>
                    </div>
                    <div className="bg-white/3 border border-white/5 rounded-xl p-4">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Phone</label>
                      <p className="text-white font-extrabold text-sm mt-1.5">{profile.phone || 'Not configured'}</p>
                    </div>
                    <div className="bg-white/3 border border-white/5 rounded-xl p-4">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Age</label>
                      <p className="text-white font-extrabold text-sm mt-1.5">{profile.age ?? 'Not configured'}</p>
                    </div>
                    <div className="bg-white/3 border border-white/5 rounded-xl p-4">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Account Type</label>
                      <p className="text-white font-extrabold text-sm mt-1.5 capitalize">{profile.provider || 'credentials'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full btn-gradient-premium text-xs font-black uppercase tracking-wider py-3"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile Details
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Account Actions */}
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full btn-premium flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wider"
          >
            <LogOut className="w-4 h-4" />
            Logout Account
          </button>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-black uppercase tracking-wider py-3 text-xs rounded-2xl flex items-center justify-center gap-2 transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account Permanently
            </button>
          ) : (
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 space-y-4">
              <div>
                <p className="text-red-300 text-sm font-bold">Are you absolutely sure?</p>
                <p className="text-red-400/80 text-xs mt-1">This action cannot be undone. All portfolio data and watchlist preferences will be deleted permanently.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isSaving}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-slate-950 font-black uppercase tracking-wider py-2 text-xs rounded-xl transition"
                >
                  {isSaving ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 btn-premium text-xs font-black uppercase tracking-wider py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </PageShell>
  );
}
