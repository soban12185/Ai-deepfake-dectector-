import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, LayoutDashboard, Upload, LogOut,
  User, Menu, X, Zap, ChevronRight
} from 'lucide-react';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/detect',    label: 'Detect',    icon: Upload },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-dark-900/90 backdrop-blur-xl border-b border-white/10 shadow-2xl'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg group-hover:shadow-brand-500/40 transition-shadow">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              <span className="gradient-text">DeepGuard</span>
              <span className="text-slate-400 font-light"> AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive(to)
                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                ))}
              </>
            ) : (
              <>
                <Link to="/#features" className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Features</Link>
                <Link to="/#how-it-works" className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">How It Works</Link>
              </>
            )}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-300">{user.username}</span>
                </div>
                <button onClick={handleLogout} className="btn-secondary py-2 text-xs">
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary py-2 text-xs">Sign In</Link>
                <Link to="/register" className="btn-primary py-2 text-xs">
                  <Zap className="w-3.5 h-3.5" />
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 rounded-lg text-slate-400" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-dark-900/95 backdrop-blur-xl border-t border-white/10 px-4 py-4 space-y-2 animate-slide-up">
          {user ? (
            <>
              {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              ))}
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block w-full btn-secondary text-center" onClick={() => setMobileOpen(false)}>Sign In</Link>
              <Link to="/register" className="block w-full btn-primary text-center" onClick={() => setMobileOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
