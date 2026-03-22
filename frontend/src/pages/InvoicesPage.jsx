import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, FileText, Download, Trash2, Edit2, CheckCircle } from 'lucide-react';
import api from '@/utils/api';
import { formatCurrency, formatDate, getInitials, avatarColor } from '@/utils/format';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EmptyState from '@/components/shared/EmptyState';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const STATUSES = ['all', 'paid', 'pending', 'overdue', 'cancelled'];

export default function InvoicesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (status !== 'all') params.status = status;
      if (search) params.search = search;
      const { data } = await api.get('/invoices', { params });
      setInvoices(data.invoices);
      setTotal(data.total);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  }, [status, search, page]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [status, search]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/invoices/${deleteId}`);
      toast.success('Invoice deleted');
      setDeleteId(null);
      fetch();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const markPaid = async (id, e) => {
    e.preventDefault(); e.stopPropagation();
    try {
      await api.patch(`/invoices/${id}/status`, { status: 'paid' });
      toast.success('Marked as paid ✓');
      fetch();
    } catch { toast.error('Failed to update'); }
  };

  const downloadPDF = async (inv, e) => {
    e.preventDefault(); e.stopPropagation();
    try {
      const { data } = await api.get(`/invoices/${inv._id}`);
      generateInvoicePDF(data.invoice, user);
    } catch { toast.error('PDF generation failed'); }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Invoices</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{total} invoice{total !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/invoices/new" className="btn-primary">
          <Plus size={16} /> New Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-10" placeholder="Search by invoice number..." />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-xl capitalize border transition-all duration-150 ${status === s ? 'bg-brand-500 text-white border-brand-500' : 'border-[var(--border)] hover:border-brand-500/50'}`}
              style={{ color: status === s ? 'white' : 'var(--text-secondary)' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
              <tr>
                <th className="table-head text-left">Invoice</th>
                <th className="table-head text-left">Client</th>
                <th className="table-head text-left hidden md:table-cell">Date</th>
                <th className="table-head text-left hidden lg:table-cell">Due Date</th>
                <th className="table-head text-right">Amount</th>
                <th className="table-head text-center">Status</th>
                <th className="table-head text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'var(--border)' }}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="skeleton h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon={FileText} title="No invoices found" description="Create your first invoice to get started."
                      action={<Link to="/invoices/new" className="btn-primary"><Plus size={15} /> Create Invoice</Link>} />
                  </td>
                </tr>
              ) : invoices.map(inv => (
                <tr key={inv._id} className="table-row">
                  <td className="table-cell">
                    <Link to={`/invoices/${inv._id}`} className="font-mono text-xs font-semibold text-brand-500 hover:text-brand-600">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 ${avatarColor(inv.clientId?.name)} rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {getInitials(inv.clientId?.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{inv.clientId?.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{inv.clientId?.company}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell hidden md:table-cell text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(inv.createdAt)}</td>
                  <td className="table-cell hidden lg:table-cell text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(inv.dueDate)}</td>
                  <td className="table-cell text-right font-semibold font-num text-sm">{formatCurrency(inv.totalAmount)}</td>
                  <td className="table-cell text-center"><StatusBadge status={inv.status} /></td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-1">
                      {inv.status === 'pending' && (
                        <button onClick={(e) => markPaid(inv._id, e)} title="Mark as paid"
                          className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500 transition-colors">
                          <CheckCircle size={15} />
                        </button>
                      )}
                      <button onClick={(e) => downloadPDF(inv, e)} title="Download PDF"
                        className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500 transition-colors">
                        <Download size={15} />
                      </button>
                      <Link to={`/invoices/${inv._id}/edit`}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                        <Edit2 size={15} />
                      </Link>
                      <button onClick={() => setDeleteId(inv._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 15 && (
          <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Showing {Math.min((page - 1) * 15 + 1, total)}–{Math.min(page * 15, total)} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 15 >= total} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Invoice" message="This action cannot be undone. The invoice will be permanently deleted."
        loading={deleting} />
    </div>
  );
}
