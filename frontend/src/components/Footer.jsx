import React from 'react';
import { Shield, Globe, Mail, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-dark-900/60 backdrop-blur-md mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">
                <span className="gradient-text">DeepGuard</span>
                <span className="text-slate-400 font-light"> AI</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Production-grade AI deepfake detection powered by EfficientNet transfer learning.
              Protecting digital truth, one scan at a time.
            </p>
            <div className="flex gap-3 mt-6">
              {[Globe, MessageSquare, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-brand-400 hover:border-brand-500/50 transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-4">Product</h4>
            <ul className="space-y-2.5">
              {[['/', 'Home'], ['/detect', 'Detect Deepfake'], ['/dashboard', 'Dashboard']].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs">© {new Date().getFullYear()} DeepGuard AI. All rights reserved.</p>
          <p className="text-slate-600 text-xs">Built with FastAPI · PyTorch · React</p>
        </div>
      </div>
    </footer>
  );
}
