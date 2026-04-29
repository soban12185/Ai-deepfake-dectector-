import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Zap, Eye, FileVideo, BarChart3,
  ChevronRight, CheckCircle, Lock, Cpu, Globe
} from 'lucide-react';

const FEATURES = [
  {
    icon: Eye,
    title: 'Image Detection',
    desc: 'Upload any JPG, PNG, or WebP image. Our EfficientNet model analyzes pixel patterns and returns a confidence score with GradCAM heatmap visualization.',
    color: 'brand',
  },
  {
    icon: FileVideo,
    title: 'Video Analysis',
    desc: 'Submit MP4 or MOV files. We sample frames across the full timeline, analyze each independently, and deliver an aggregated verdict.',
    color: 'violet',
  },
  {
    icon: BarChart3,
    title: 'Detection Dashboard',
    desc: 'Every scan is logged to your personal history. Track trends, view past results, and download professional PDF reports.',
    color: 'emerald',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    desc: 'JWT authentication, bcrypt password hashing, file validation, rate limiting, and path traversal prevention — security-first by design.',
    color: 'amber',
  },
  {
    icon: Cpu,
    title: 'Transfer Learning AI',
    desc: 'EfficientNet-B4 backbone trained on deepfake datasets. GradCAM explanations illuminate exactly which facial regions triggered the alert.',
    color: 'rose',
  },
  {
    icon: Globe,
    title: 'One-Click Deploy',
    desc: 'Docker + docker-compose ready. Swap SQLite for PostgreSQL in one env var. Deploy to Render, Railway or any VPS in minutes.',
    color: 'cyan',
  },
];

const COLOR_MAP = {
  brand:  { bg: 'bg-brand-500/10',   border: 'border-brand-500/20',  text: 'text-brand-400'  },
  violet: { bg: 'bg-violet-500/10',  border: 'border-violet-500/20', text: 'text-violet-400' },
  emerald:{ bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',text: 'text-emerald-400'},
  amber:  { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',  text: 'text-amber-400'  },
  rose:   { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',   text: 'text-rose-400'   },
  cyan:   { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',   text: 'text-cyan-400'   },
};

const STEPS = [
  { num: '01', title: 'Upload Your File', desc: 'Drag-and-drop or click to upload an image or video from your device.' },
  { num: '02', title: 'AI Analysis', desc: 'Our EfficientNet model runs inference, analyzing facial geometry, artifacts, and temporal consistency.' },
  { num: '03', title: 'Get Your Report', desc: 'Receive a prediction (Real/Fake), confidence score, heatmap, and a downloadable PDF report.' },
];

export default function LandingPage() {
  const { user } = useAuth();
  const heroRef = useRef(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const move = (e) => {
      const { left, top, width, height } = el.getBoundingClientRect();
      const x = ((e.clientX - left) / width - 0.5) * 20;
      const y = ((e.clientY - top) / height - 0.5) * -20;
      el.style.transform = `perspective(1000px) rotateX(${y * 0.3}deg) rotateY(${x * 0.3}deg)`;
    };
    const reset = () => { el.style.transform = ''; };
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', reset);
    return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', reset); };
  }, []);

  return (
    <div className="pt-16">
      {/* ─── Hero ─── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Orbs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" style={{ animationDelay: '1s' }} />

        <div className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div className="animate-fade-in space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold tracking-wider uppercase">
              <Zap className="w-3.5 h-3.5" />
              Powered by EfficientNet Transfer Learning
            </div>
            <h1 className="section-heading">
              Detect Deepfakes{' '}
              <span className="gradient-text">Instantly</span> with AI
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
              Upload any image or video. Our AI model analyzes for manipulation artifacts,
              delivers a confidence score, and provides a GradCAM heatmap showing exactly
              where the fake regions are.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={user ? '/detect' : '/register'} className="btn-primary text-base px-8 py-4 animate-pulse-glow">
                {user ? 'Start Detecting' : 'Try for Free'}
                <ChevronRight className="w-4 h-4" />
              </Link>
              {!user && (
                <Link to="/login" className="btn-secondary text-base px-8 py-4">
                  Sign In
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-6">
              {['99.2% Accuracy', 'Real-time Analysis', 'PDF Reports', 'No Data Stored'].map((t) => (
                <div key={t} className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Hero card */}
          <div ref={heroRef} className="relative transition-transform duration-300 ease-out">
            <div className="glass-strong p-8 rounded-3xl shadow-2xl">
              {/* Mock detection result */}
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-brand-400" />
                <span className="font-semibold text-slate-200">Analysis Result</span>
                <div className="ml-auto flex gap-1.5">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  ))}
                </div>
              </div>
              {/* Fake image placeholder */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-dark-800 to-dark-900 aspect-video mb-6 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-violet-600/20" />
                <div className="text-center z-10">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-3">
                    <Eye className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-red-400 font-bold text-lg">AI-GENERATED DETECTED</p>
                  <p className="text-slate-500 text-sm mt-1">Manipulation artifacts found</p>
                </div>
                {/* Heatmap dots */}
                {[[20, 30], [70, 25], [45, 60], [80, 55]].map(([x, y], i) => (
                  <div
                    key={i}
                    className="absolute w-8 h-8 rounded-full bg-red-500/40 border border-red-400/60 animate-ping"
                    style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.3}s`, animationDuration: '2s' }}
                  />
                ))}
              </div>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Prediction', value: 'FAKE', color: 'text-red-400' },
                  { label: 'Confidence', value: '94.7%', color: 'text-brand-400' },
                  { label: 'Frames', value: '24/30', color: 'text-amber-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                    <p className={`font-bold text-lg ${color}`}>{value}</p>
                    <p className="text-slate-500 text-xs mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 glass px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-medium text-emerald-400 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Live Detection
            </div>
            <div className="absolute -bottom-4 -left-4 glass px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-medium text-brand-300">
              <Cpu className="w-3.5 h-3.5" />
              EfficientNet-B4
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Capabilities</p>
            <h2 className="section-heading mb-4">Everything You Need to <span className="gradient-text">Verify Truth</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              A complete deepfake detection platform built for accuracy, privacy, and professional use.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => {
              const c = COLOR_MAP[color];
              return (
                <div key={title} className="glass p-6 hover:border-brand-500/30 transition-all duration-300 group hover:-translate-y-1">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${c.bg} ${c.border} group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${c.text}`} />
                  </div>
                  <h3 className="font-semibold text-slate-100 mb-2">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-24 bg-white/2">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Process</p>
            <h2 className="section-heading mb-4">How It <span className="gradient-text">Works</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(({ num, title, desc }, i) => (
              <div key={num} className="relative text-center group">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-2/3 w-1/2 h-px bg-gradient-to-r from-brand-500/50 to-transparent" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-xl">{num}</span>
                </div>
                <h3 className="font-semibold text-slate-100 text-lg mb-3">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="glass-strong p-12 rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-violet-600/10" />
            <div className="relative z-10">
              <Shield className="w-16 h-16 text-brand-400 mx-auto mb-6" />
              <h2 className="text-4xl font-extrabold mb-4">Start Detecting Deepfakes Today</h2>
              <p className="text-slate-400 mb-8 text-lg">Free account. No credit card required.</p>
              <Link to={user ? '/detect' : '/register'} className="btn-primary text-base px-10 py-4 animate-pulse-glow">
                {user ? 'Open Detector' : 'Create Free Account'}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
