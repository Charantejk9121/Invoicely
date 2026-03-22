import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building2, MapPin, Edit2, FileText, Plus } from 'lucide-react';
import api from '@/utils/api';
import { formatCurrency, formatDate, getInitials, avatarColor } from '@/utils/format';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/clients/${id}`).then(r => setData(r.data)).catch(() => navigate('/clients')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-96"><LoadingSpinner size="lg" /></div>;
  if (!data) return null;

  const { client, invoices, totalRevenue } = data;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/clients" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
        </Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Client Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client card */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 ${avatarColor(client.name)} rounded-2xl flex items-center justify-center text-white text-xl font-bold`}>
              {getInitials(client.name)}
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{client.name}</h2>
              {client.company && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{client.company}</p>}
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Mail size={15} style={{ color: 'var(--text-secondary)' }} />
              <a href={`mailto:${client.email}`} className="text-brand-500 hover:underline">{client.email}</a>
            </div>
            {client.phone && (
              <div className="flex items-center gap-3">
                <Phone size={15} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ color: 'var(--text-primary)' }}>{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-3">
                <MapPin size={15} style={{ color: 'var(--text-secondary)' }} className="mt-0.5 flex-shrink-0" />
                <span style={{ color: 'var(--text-primary)' }}>{client.address}</span>
              </div>
            )}
            {client.gstNumber && (
              <div className="flex items-center gap-3">
                <Building2 size={15} style={{ color: 'var(--text-secondary)' }} />
                <span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{client.gstNumber}</span>
              </div>
            )}
          </div>

          <div className="border-t pt-4 grid grid-cols-2 gap-4" style={{ borderColor: 'var(--border)' }}>
            <div className="text-center">
              <p className="text-xl font-bold text-brand-500">{invoices.length}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Invoices</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-500">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Revenue</p>
            </div>
          </div>

          <Link to={`/invoices/new`} className="btn-primary w-full justify-center">
            <Plus size={15} /> Create Invoice
          </Link>
        </div>

        {/* Invoice history */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Invoice History</h3>
            <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{invoices.length}</span>
          </div>
          {invoices.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <FileText size={32} className="mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No invoices yet</p>
              </div>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {invoices.map(inv => (
                <Link key={inv._id} to={`/invoices/${inv._id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>{inv.invoiceNumber}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{formatDate(inv.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold font-num" style={{ color: 'var(--text-primary)' }}>{formatCurrency(inv.totalAmount)}</span>
                    <StatusBadge status={inv.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
