import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { detectionsApi } from '../lib/api';
import {
  BarChart3, Scan, TrendingUp, Shield, Upload, Trash2,
  ChevronRight, AlertTriangle, CheckCircle, Clock, FileText
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { StatCard, Spinner } from '../components/UI';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const COLORS = { FAKE: '#ef4444', REAL: '#22c55e' };

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const loadData = async () => {
    try {
      const [s, h] = await Promise.all([
        detectionsApi.stats(),
        detectionsApi.list(0, 50),
      ]);
      setStats(s);
      setHistory(h);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoadingStats(false);
      setLoadingHistory(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await detectionsApi.delete(id);
      setHistory((h) => h.filter((r) => r.id !== id));
      toast.success('Record deleted');
      loadData();
    } catch {
      toast.error('Failed to delete record');
    } finally {
      setDeleting(null);
    }
  };

  // Chart data: daily counts
  const chartData = React.useMemo(() => {
    const grouped = {};
    history.forEach((r) => {
      const day = format(new Date(r.created_at), 'MMM d');
      if (!grouped[day]) grouped[day] = { date: day, FAKE: 0, REAL: 0 };
      grouped[day][r.prediction]++;
    });
    return Object.values(grouped).slice(-14);
  }, [history]);

  const pieData = stats
    ? [
        { name: 'Fake', value: stats.fake_count },
        { name: 'Real', value: stats.real_count },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Welcome bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">
              Welcome back, <span className="gradient-text">{user?.username}</span> 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">Here's your detection overview</p>
          </div>
          <Link to="/detect" id="new-scan-btn" className="btn-primary">
            <Upload className="w-4 h-4" /> New Scan
          </Link>
        </div>

        {/* Stat cards */}
        {loadingStats ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard label="Total Scans" value={stats?.total_scans ?? 0} icon={Scan} color="brand" />
            <StatCard label="Fakes Detected" value={stats?.fake_count ?? 0} icon={AlertTriangle} color="red" />
            <StatCard label="Authentic Media" value={stats?.real_count ?? 0} icon={CheckCircle} color="green" />
            <StatCard label="Avg Confidence" value={`${Math.round((stats?.average_confidence ?? 0) * 100)}%`} icon={TrendingUp} color="amber" />
          </div>
        )}

        {/* Charts */}
        {history.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Area chart */}
            <div className="glass p-6 lg:col-span-2">
              <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-400" /> Detection History
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="fakeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey="FAKE" stroke="#ef4444" fill="url(#fakeGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="REAL" stroke="#22c55e" fill="url(#realGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            <div className="glass p-6 flex flex-col">
              <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-400" /> Breakdown
              </h2>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={COLORS[entry.name.toUpperCase()] || '#6366f1'} />
                      ))}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">No data yet</div>
              )}
            </div>
          </div>
        )}

        {/* History table */}
        <div className="glass overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="font-semibold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" /> Scan History
            </h2>
            <span className="text-xs text-slate-500">{history.length} records</span>
          </div>

          {loadingHistory ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center">
              <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No scans yet</p>
              <p className="text-slate-600 text-sm mt-1 mb-6">Upload your first file to get started</p>
              <Link to="/detect" className="btn-primary">Start Detecting</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {['File', 'Type', 'Result', 'Confidence', 'Date', 'Actions'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map((row) => (
                    <tr key={row.id} className="hover:bg-white/3 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-200 font-medium truncate max-w-[180px] block" title={row.filename}>
                          {row.filename}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold uppercase px-2 py-1 rounded-lg bg-white/5 text-slate-400">
                          {row.file_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {row.prediction === 'FAKE'
                          ? <span className="badge-fake"><AlertTriangle className="w-3 h-3" /> Fake</span>
                          : <span className="badge-real"><CheckCircle className="w-3 h-3" /> Real</span>
                        }
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-200">{Math.round(row.confidence * 100)}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">
                          {format(new Date(row.created_at), 'MMM d, yyyy')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/result/${row.id}`)}
                            className="p-1.5 rounded-lg text-brand-400 hover:bg-brand-500/10 transition-colors"
                            title="View details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            disabled={deleting === row.id}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            {deleting === row.id ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
