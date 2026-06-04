import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Bell, LogIn, Search, Star, User, LogOut, Settings2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { currencyOptions } from '../data/currencies.js';
import { useCurrency } from '../hooks/useCurrency.js';
import { useWatchlist } from '../context/WatchlistContext.jsx';

const baseLinks = [
  ['/', 'Dashboard'],
  ['/news', 'News'],
  ['/articles', 'Articles'],
  ['/watchlist', 'Watchlist'],
  ['/portfolio', 'Portfolio'],
];

export default function Navbar() {
  const navigate = useNavigate();
  const { currency, setCurrency } = useCurrency();
  const { items } = useWatchlist();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const updateAuthState = () => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user');

    setIsAuthenticated(!!token);
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error('Failed to parse user data:', err);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    updateAuthState();

    const handleAuthUpdate = () => updateAuthState();
    const handleStorageChange = (event) => {
      if (event.key === 'auth_token' || event.key === 'user') {
        updateAuthState();
      }
    };

    window.addEventListener('authUpdated', handleAuthUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('authUpdated', handleAuthUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/8 bg-black/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
      <nav className="flex h-16 w-full items-center justify-between gap-2 px-3 sm:px-5 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyanGlow via-blue-500 to-purple-600 text-white shadow-[0_0_15px_rgba(40,215,255,0.3)] sm:size-10">
            <BarChart3 size={20} strokeWidth={2.6} />
          </span>
          <span className="truncate text-base font-black tracking-tight sm:text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Crypto Market</span>
        </Link>
        
        <div className="hidden items-center gap-1 md:flex">
          {[...baseLinks, ...(isAuthenticated ? [['/profile', 'Profile']] : [])].map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className="relative rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition duration-300"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-xl bg-white/10 border border-white/5"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <select
            className="h-10 rounded-xl border border-white/8 bg-white/4 px-2 text-xs font-bold text-slate-100 outline-none transition duration-300 hover:border-cyanGlow/40 hover:bg-white/7 focus:border-cyanGlow/60 cursor-pointer sm:px-3"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            title="Currency"
          >
            {currencyOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#050505] text-slate-100">
                {option.code}
              </option>
            ))}
          </select>
          
          <button className="ghost-button hidden px-3 sm:inline-flex" title="Search">
            <Search size={18} />
          </button>
          
          <button className="ghost-button hidden px-3 sm:inline-flex" title="Notifications">
            <Bell size={18} />
          </button>
          
          <Link to="/watchlist" className="ghost-button px-3" title="Watchlist">
            <Star size={18} />
          </Link>

          {isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((open) => !open)}
                className="ghost-button px-3 flex items-center gap-2"
                title="Profile menu"
              >
                <div className="hidden sm:flex w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center text-xs font-bold text-white uppercase">
                  {user.name ? user.name[0] : 'U'}
                </div>
                <User size={18} />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/8 bg-[#0b0c16]/95 p-3 shadow-2xl backdrop-blur-xl z-50"
                  >
                    <div className="mb-3 rounded-xl bg-white/5 p-3 text-sm text-slate-300">
                      <p className="font-semibold text-white truncate">{user.name || 'Your Profile'}</p>
                      <p className="text-xs text-slate-400 mt-1">{items.length} saved coin{items.length === 1 ? '' : 's'}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5 transition duration-200"
                    >
                      <Settings2 size={16} />
                      Profile
                    </Link>
                    <Link
                      to="/portfolio"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5 transition duration-200"
                    >
                      <BarChart3 size={16} />
                      Portfolio
                    </Link>
                    <Link
                      to="/watchlist"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5 transition duration-200"
                    >
                      <Star size={16} />
                      Watchlist
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('user');
                        window.dispatchEvent(new Event('authUpdated'));
                        setIsAuthenticated(false);
                        setUser(null);
                        setIsMenuOpen(false);
                        navigate('/auth');
                      }}
                      className="mt-2 flex w-full items-center gap-2 rounded-xl bg-red-600/10 px-3 py-2 text-sm text-red-400 hover:bg-red-600/20 transition duration-200"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/auth" className="btn-gradient-premium px-4 py-2">
              <LogIn size={17} />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
