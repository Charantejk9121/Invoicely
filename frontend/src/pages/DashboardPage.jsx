import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, FileText, Users, Clock, Plus, ArrowRight, AlertCircle } from 'lucide-react';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatDate, getInitials, avatarColor } from '@/utils/format';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const StatCard = ({ icon: Icon, label, value, sub, color, loading }) => (
  <div className="stat-card">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    {loading ? (
      <div className="space-y-2">
        <div className="skeleton h-7 w-28" />
        <div className="skeleton h-4 w-20" />
      </div>
    ) : (
      <>
        <p className="text-2xl font-bold font-num mb-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        {sub && <p className="text-xs mt-1 text-brand-500 font-medium">{sub}</p>}
      </>
    )}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="card px-4 py-3 shadow-xl">
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'];
  const pieData = data ? [
    { name: 'Paid', value: data.statusBreakdown.paid },
    { name: 'Pending', value: data.statusBreakdown.pending },
    { name: 'Overdue', value: data.statusBreakdown.overdue },
    { name: 'Cancelled', value: data.statusBreakdown.cancelled },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Here's what's happening with your business today.</p>
        </div>
        <Link to="/invoices/new" className="btn-primary hidden sm:inline-flex">
          <Plus size={16} /> New Invoice
        </Link>
      </div>

      {/* Overdue alert */}
      {stats.overdueCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl animate-fade-in">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            You have <strong>{stats.overdueCount}</strong> overdue invoice{stats.overdueCount > 1 ? 's' : ''} that need attention.
          </p>
          <Link to="/invoices?status=overdue" className="ml-auto text-xs font-semibold text-red-600 dark:text-red-400 hover:underline whitespace-nowrap">
            View →
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total Revenue" value={formatCurrency(stats.totalRevenue)} color="bg-brand-500" loading={loading} sub="All time earnings" />
        <StatCard icon={Clock} label="Pending Amount" value={formatCurrency(stats.pendingAmount)} color="bg-amber-500" loading={loading} sub={`${stats.overdueCount || 0} overdue`} />
        <StatCard icon={FileText} label="Total Invoices" value={stats.totalInvoices || 0} color="bg-violet-500" loading={loading} />
        <StatCard icon={Users} label="Total Clients" value={stats.totalClients || 0} color="bg-emerald-500" loading={loading} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Revenue Overview</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Monthly revenue for the past 12 months</p>
            </div>
          </div>
          {loading ? (
            <div className="skeleton h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data?.monthlyData || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 5, fill: '#0ea5e9' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status breakdown */}
        <div className="card p-6">
          <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Invoice Status</h2>
          <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)' }}>Distribution by status</p>
          {loading ? (
            <div className="skeleton h-48 w-full" />
          ) : pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                    </div>
                    <span className="font-semibold font-num" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No invoices yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent invoices */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Invoices</h2>
            <Link to="/invoices" className="text-xs font-semibold text-brand-500 hover:text-brand-600 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-12 w-full" />)}</div>
          ) : data?.recentInvoices?.length > 0 ? (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {data.recentInvoices.map(inv => (
                <Link key={inv._id} to={`/invoices/${inv._id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 ${avatarColor(inv.clientId?.name)} rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {getInitials(inv.clientId?.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{inv.clientId?.name || 'Unknown'}</p>
                      <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{inv.invoiceNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-sm font-semibold font-num hidden sm:block" style={{ color: 'var(--text-primary)' }}>{formatCurrency(inv.totalAmount)}</span>
                    <StatusBadge status={inv.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No invoices yet</p>
                <Link to="/invoices/new" className="text-xs text-brand-500 hover:text-brand-600 font-semibold">Create your first invoice →</Link>
              </div>
            </div>
          )}
        </div>

        {/* Top clients */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Top Clients</h2>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 w-full" />)}</div>
          ) : data?.topClients?.length > 0 ? (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {data.topClients.map((c, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-semibold w-4 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>#{i + 1}</span>
                    <div className={`w-7 h-7 ${avatarColor(c.name)} rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {getInitials(c.name)}
                    </div>
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                  </div>
                  <p className="text-xs font-semibold font-num text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-2">{formatCurrency(c.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No paid invoices yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
