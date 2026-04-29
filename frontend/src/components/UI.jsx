import React from 'react';

export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} ${className}`}>
      <svg className="animate-spin text-brand-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V0a12 12 0 100 24v-4l-3 3 3 3v4A12 12 0 014 12z" />
      </svg>
    </div>
  );
}

export function LoadingDots() {
  return (
    <div className="flex gap-1.5 items-center">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-brand-400 rounded-full"
          style={{ animation: `bounceDot 1.4s ease-in-out ${i * 0.16}s infinite` }}
        />
      ))}
    </div>
  );
}

export function ConfidenceMeter({ value, prediction }) {
  const pct = Math.round(value * 100);
  const isFake = prediction === 'FAKE';
  const color = isFake ? 'from-red-500 to-red-400' : 'from-emerald-500 to-emerald-400';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400 font-medium">Confidence</span>
        <span className={`font-bold ${isFake ? 'text-red-400' : 'text-emerald-400'}`}>{pct}%</span>
      </div>
      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-1000`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, color = 'brand' }) {
  const colors = {
    brand: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    red:   'text-red-400 bg-red-500/10 border-red-500/20',
    green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };
  return (
    <div className="glass p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </div>
  );
}
