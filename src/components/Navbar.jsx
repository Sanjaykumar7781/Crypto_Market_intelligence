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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const notifRef = useRef(null);

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
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
      <nav className="flex h-16 w-full items-center justify-between gap-2 px-3 sm:px-5 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyanGlow via-blue-500 to-purple-600 text-white shadow-[0_0_15px_rgba(40,215,255,0.3)] sm:size-10">
            <BarChart3 size={20} strokeWidth={2.6} />
          </span>
          <span className="truncate text-base font-black tracking-tight sm:text-lg bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 bg-clip-text text-transparent">Crypto Market</span>
        </Link>
        
        <div className="hidden items-center gap-1 md:flex">
          {[...baseLinks, ...(isAuthenticated ? [['/profile', 'Profile']] : [])].map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className="relative rounded-xl px-4 py-2 text-sm font-semibold text-sky-500 hover:text-gray-900 transition duration-300"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-xl bg-gray-100 border border-gray-200"
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
            className="h-10 rounded-xl border border-gray-200 bg-white px-2 text-xs font-bold text-gray-900 outline-none transition duration-300 hover:border-cyanGlow/40 hover:bg-gray-50 focus:border-cyanGlow/60 cursor-pointer sm:px-3"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            title="Currency"
          >
            {currencyOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-white text-gray-900">
                {option.code}
              </option>
            ))}
          </select>
          
          <div className="relative" ref={searchRef}>
            <button 
              className="ghost-button hidden px-3 sm:inline-flex" 
              title="Search"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search size={18} />
            </button>
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl z-50"
                >
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const val = e.target.search.value;
                    if (val) {
                      navigate(`/?search=${encodeURIComponent(val)}`);
                      setIsSearchOpen(false);
                    }
                  }} className="flex items-center gap-2">
                    <Search size={16} className="text-gray-400" />
                    <input 
                      name="search"
                      type="text" 
                      placeholder="Search coins, news..." 
                      className="w-full bg-transparent text-sm text-gray-900 outline-none"
                      autoFocus
                    />
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="relative" ref={notifRef}>
            <button 
              className="ghost-button hidden px-3 sm:inline-flex relative" 
              title="Notifications"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
            >
              <Bell size={18} />
              <span className="absolute top-1 right-2 flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-red-500"></span>
              </span>
            </button>
            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl z-50"
                >
                  <h3 className="font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Notifications</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3 items-start">
                      <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0">
                        <BarChart3 size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Market is up!</p>
                        <p className="text-xs text-gray-500">Global crypto market cap increased by 2.4% today.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="bg-purple-100 p-2 rounded-full text-purple-600 shrink-0">
                        <Star size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Bitcoin Alert</p>
                        <p className="text-xs text-gray-500">BTC has crossed the $65,000 threshold.</p>
                      </div>
                    </div>
                  </div>
                  <button className="w-full text-center text-xs font-bold text-primary mt-4 hover:underline">
                    Mark all as read
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
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
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-2xl backdrop-blur-xl z-50"
                  >
                    <div className="mb-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                      <p className="font-semibold text-gray-900 truncate">{user.name || 'Your Profile'}</p>
                      <p className="text-xs text-rose-400 mt-1">{items.length} saved coin{items.length === 1 ? '' : 's'}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition duration-200"
                    >
                      <Settings2 size={16} />
                      Profile
                    </Link>
                    <Link
                      to="/portfolio"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition duration-200"
                    >
                      <BarChart3 size={16} />
                      Portfolio
                    </Link>
                    <Link
                      to="/watchlist"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition duration-200"
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
                      className="mt-2 flex w-full items-center gap-2 rounded-xl bg-red-600/10 px-3 py-2 text-sm text-teal-500 hover:bg-red-600/20 transition duration-200"
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
