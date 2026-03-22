import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Edit2, Trash2, CheckCircle, XCircle, Printer } from 'lucide-react';
import api from '@/utils/api';
import { formatCurrency, formatDate, getInitials, avatarColor } from '@/utils/format';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    api.get(`/invoices/${id}`).then(r => setInvoice(r.data.invoice)).catch(() => navigate('/invoices')).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try { await api.delete(`/invoices/${id}`); toast.success('Deleted'); navigate('/invoices'); }
    catch { toast.error('Delete failed'); setDeleting(false); }
  };

  const changeStatus = async (status) => {
    setStatusLoading(true);
    try {
      const { data } = await api.patch(`/invoices/${id}/status`, { status });
      setInvoice(data.invoice);
      toast.success(`Status updated to ${status}`);
    } catch { toast.error('Update failed'); }
    finally { setStatusLoading(false); }
  };

  const downloadPDF = () => generateInvoicePDF(invoice, user);

  if (loading) return <div className="flex items-center justify-center h-96"><LoadingSpinner size="lg" /></div>;
  if (!invoice) return null;

  const client = invoice.clientId || {};

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link to="/invoices" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{invoice.invoiceNumber}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Created {formatDate(invoice.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === 'pending' && (
            <button onClick={() => changeStatus('paid')} disabled={statusLoading}
              className="btn-primary text-sm py-2 bg-emerald-500 hover:bg-emerald-600">
              <CheckCircle size={15} /> Mark Paid
            </button>
          )}
          {invoice.status === 'paid' && (
            <button onClick={() => changeStatus('pending')} disabled={statusLoading}
              className="btn-secondary text-sm py-2">
              <XCircle size={15} /> Mark Pending
            </button>
          )}
          <button onClick={downloadPDF} className="btn-secondary text-sm py-2">
            <Download size={15} /> PDF
          </button>
          <Link to={`/invoices/${id}/edit`} className="btn-secondary text-sm py-2">
            <Edit2 size={15} /> Edit
          </Link>
          <button onClick={() => setShowDelete(true)} className="p-2 rounded-xl border hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 transition-colors" style={{ borderColor: 'var(--border)' }}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Invoice card */}
      <div className="card overflow-hidden">
        {/* Top band */}
        <div className="h-2 bg-gradient-to-r from-brand-500 to-cyan-400" />

        <div className="p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>From</p>
              <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{invoice.userId?.company || invoice.userId?.name}</h3>
              <div className="text-sm space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                {invoice.userId?.email && <p>{invoice.userId.email}</p>}
                {invoice.userId?.phone && <p>{invoice.userId.phone}</p>}
                {invoice.userId?.address && <p>{invoice.userId.address}</p>}
                {invoice.userId?.gstNumber && <p className="font-mono text-xs">GSTIN: {invoice.userId.gstNumber}</p>}
              </div>
            </div>

            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Bill To</p>
              <div className="flex sm:justify-end items-center gap-2 mb-2">
                <div className={`w-9 h-9 ${avatarColor(client.name)} rounded-xl flex items-center justify-center text-white text-sm font-bold`}>
                  {getInitials(client.name)}
                </div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{client.name}</h3>
              </div>
              <div className="text-sm space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                {client.company && <p>{client.company}</p>}
                {client.email && <p>{client.email}</p>}
                {client.phone && <p>{client.phone}</p>}
                {client.gstNumber && <p className="font-mono text-xs">GSTIN: {client.gstNumber}</p>}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4 mb-8 p-4 rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Issue Date</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDate(invoice.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Due Date</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDate(invoice.dueDate)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Status</p>
              <StatusBadge status={invoice.status} />
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-x-auto rounded-xl border mb-6" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Item</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Qty</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Rate</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                      {item.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>}
                    </td>
                    <td className="px-4 py-3.5 text-right font-num" style={{ color: 'var(--text-secondary)' }}>{item.quantity}</td>
                    <td className="px-4 py-3.5 text-right font-num" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(item.price)}</td>
                    <td className="px-4 py-3.5 text-right font-semibold font-num" style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span className="font-num font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.isInterState ? (
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>IGST ({invoice.gstRate}%)</span>
                  <span className="font-num" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(invoice.igst)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>CGST ({invoice.gstRate / 2}%)</span>
                    <span className="font-num" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(invoice.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>SGST ({invoice.gstRate / 2}%)</span>
                    <span className="font-num" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(invoice.sgst)}</span>
                  </div>
                </>
              )}
              <div className="border-t pt-3 flex justify-between" style={{ borderColor: 'var(--border)' }}>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Total Amount</span>
                <span className="text-xl font-bold font-num text-brand-500">{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Notes</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog open={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete}
        title="Delete Invoice" message={`Delete ${invoice.invoiceNumber}? This cannot be undone.`} loading={deleting} />
    </div>
  );
}
