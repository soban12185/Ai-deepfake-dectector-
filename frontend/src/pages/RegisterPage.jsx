import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { Spinner } from '../components/UI';

const RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter',  test: (p) => /[A-Z]/.test(p) },
  { label: 'One number',            test: (p) => /\d/.test(p) },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', username: '', password: '', full_name: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const failing = RULES.find((r) => !r.test(form.password));
    if (failing) { setError(failing.label); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to DeepGuard.');
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        // FastAPI 422 validation errors return an array of objects
        setError(detail[0].msg);
      } else {
        setError(detail || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-12">
      <div className="absolute top-32 right-1/4 w-72 h-72 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-32 left-1/4 w-72 h-72 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand-500/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2">Create your account</h1>
          <p className="text-slate-400 text-sm">Join DeepGuard — free forever for personal use</p>
        </div>

        <div className="glass p-8 rounded-3xl">
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name <span className="text-slate-500">(optional)</span></label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="full_name" type="text" className="input pl-10" placeholder="Jane Doe" value={form.full_name} onChange={update('full_name')} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">@</span>
                <input id="username" type="text" required minLength={3} maxLength={50} className="input pl-8" placeholder="janedoe" value={form.username} onChange={update('username')} autoComplete="username" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="email" type="email" required className="input pl-10" placeholder="you@example.com" value={form.email} onChange={update('email')} autoComplete="email" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="password" type={showPw ? 'text' : 'password'} required className="input pl-10 pr-10" placeholder="••••••••" value={form.password} onChange={update('password')} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password rules */}
              <div className="mt-2.5 space-y-1">
                {RULES.map(({ label, test }) => (
                  <div key={label} className={`flex items-center gap-2 text-xs transition-colors ${test(form.password) ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <button id="register-submit" type="submit" className="btn-primary w-full py-3.5 text-base mt-2" disabled={loading}>
              {loading ? <Spinner size="sm" /> : <><Zap className="w-4 h-4" /> Create Account</>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
