import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ChevronDown, AlertCircle } from 'lucide-react';
import api from '@/utils/api';
import { formatCurrency } from '@/utils/format';
import toast from 'react-hot-toast';

const emptyItem = { name: '', description: '', quantity: 1, price: '' };
const GST_RATES = [0, 5, 12, 18, 28];

export default function CreateInvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [clients, setClients] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const [form, setForm] = useState({
    clientId: '',
    items: [{ ...emptyItem }],
    gstRate: 18,
    isInterState: false,
    dueDate: '',
    notes: '',
  });

  // Load clients
  useEffect(() => {
    api.get('/clients', { params: { limit: 200 } })
      .then(r => setClients(r.data.clients || []))
      .catch(err => console.error('Failed to load clients:', err));
  }, []);

  // Load invoice data when editing
  useEffect(() => {
    if (!isEdit) return;
    setPageLoading(true);
    api.get(`/invoices/${id}`)
      .then(r => {
        const inv = r.data.invoice;
        setForm({
          clientId: inv.clientId?._id || inv.clientId || '',
          items: inv.items.map(i => ({
            name: i.name || '',
            description: i.description || '',
            quantity: i.quantity,
            price: i.price,
          })),
          gstRate: inv.gstRate ?? 18,
          isInterState: inv.isInterState ?? false,
          dueDate: inv.dueDate ? inv.dueDate.split('T')[0] : '',
          notes: inv.notes || '',
        });
      })
      .catch(() => navigate('/invoices'))
      .finally(() => setPageLoading(false));
  }, [id]);

  const updateItem = (index, field, value) => {
    setForm(f => {
      const items = f.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      return { ...f, items };
    });
  };

  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { ...emptyItem }] }));
  };

  const removeItem = (index) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  // Live totals
  const subtotal = form.items.reduce((s, i) => {
    return s + (Number(i.quantity) || 0) * (Number(i.price) || 0);
  }, 0);
  const totalGst = (subtotal * Number(form.gstRate)) / 100;
  const cgst = form.isInterState ? 0 : totalGst / 2;
  const sgst = form.isInterState ? 0 : totalGst / 2;
  const igst = form.isInterState ? totalGst : 0;
  const totalAmount = subtotal + totalGst;

  const validate = () => {
    if (!form.clientId) return 'Please select a client.';
    for (let i = 0; i < form.items.length; i++) {
      const item = form.items[i];
      if (!item.name || !String(item.name).trim()) return `Item ${i + 1}: name is required.`;
      if (item.price === '' || item.price === null || item.price === undefined) return `Item ${i + 1}: price is required.`;
      if (Number(item.price) < 0) return `Item ${i + 1}: price cannot be negative.`;
      if (!item.quantity || Number(item.quantity) < 1) return `Item ${i + 1}: quantity must be at least 1.`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);

    // Build clean payload — cast all numbers explicitly
    const payload = {
      clientId: form.clientId,
      items: form.items.map(item => ({
        name: String(item.name).trim(),
        description: String(item.description || '').trim(),
        quantity: Number(item.quantity),
        price: Number(item.price),
        total: Number(item.quantity) * Number(item.price),
      })),
      gstRate: Number(form.gstRate),
      isInterState: Boolean(form.isInterState),
      dueDate: form.dueDate || '',
      notes: form.notes || '',
    };

    console.log('Submitting invoice payload:', payload);

    try {
      if (isEdit) {
        await api.put(`/invoices/${id}`, payload);
        toast.success('Invoice updated ✓');
        navigate(`/invoices/${id}`);
      } else {
        const { data } = await api.post('/invoices', payload);
        toast.success('Invoice created ✓');
        navigate(`/invoices/${data.invoice._id}`);
      }
    } catch (err) {
      console.error('Invoice save error:', err);
      // Extract the most descriptive error message available
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        err.message ||
        'Failed to save invoice. Please try again.';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/invoices" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit Invoice' : 'New Invoice'}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {isEdit ? 'Update invoice details below' : 'Fill in the details to create an invoice'}
          </p>
        </div>
      </div>

      {/* Server error banner */}
      {serverError && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client & Meta */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Invoice Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Client *</label>
              <div className="relative">
                <select
                  value={form.clientId}
                  onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                  className="input appearance-none pr-9"
                >
                  <option value="">— Select a client —</option>
                  {clients.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name}{c.company ? ` (${c.company})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-secondary)' }} />
              </div>
              {clients.length === 0 && (
                <p className="text-xs mt-1.5 text-amber-500 font-medium">
                  No clients yet.{' '}
                  <Link to="/clients" className="underline font-semibold">Add a client first →</Link>
                </p>
              )}
            </div>
            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Line Items</h2>

          <div className="space-y-3">
            {form.items.map((item, i) => (
              <div key={i} className="p-4 rounded-xl border space-y-3"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                <div className="grid grid-cols-12 gap-3 items-end">
                  {/* Name */}
                  <div className="col-span-12 sm:col-span-5">
                    <label className="label">Item Name *</label>
                    <input
                      value={item.name}
                      onChange={e => updateItem(i, 'name', e.target.value)}
                      className="input"
                      placeholder="e.g. Web Design, Consulting..."
                      required
                    />
                  </div>
                  {/* Qty */}
                  <div className="col-span-4 sm:col-span-2">
                    <label className="label">Qty *</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={e => updateItem(i, 'quantity', e.target.value)}
                      className="input text-center"
                      required
                    />
                  </div>
                  {/* Price */}
                  <div className="col-span-8 sm:col-span-3">
                    <label className="label">Rate (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={e => updateItem(i, 'price', e.target.value)}
                      className="input"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  {/* Total */}
                  <div className="col-span-10 sm:col-span-2">
                    <label className="label">Total</label>
                    <div className="input font-semibold font-num text-brand-500 bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800/40 cursor-default">
                      {formatCurrency((Number(item.quantity) || 0) * (Number(item.price) || 0))}
                    </div>
                  </div>
                  {/* Remove */}
                  <div className="col-span-2 sm:col-span-1 flex items-end justify-center pb-0.5">
                    {form.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
                {/* Description */}
                <input
                  value={item.description}
                  onChange={e => updateItem(i, 'description', e.target.value)}
                  className="input text-xs"
                  placeholder="Description (optional)"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-all hover:border-brand-500 hover:text-brand-500"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <Plus size={16} /> Add Line Item
          </button>
        </div>

        {/* GST & Totals */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Tax & Summary</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GST controls */}
            <div className="space-y-4">
              <div>
                <label className="label">GST Rate</label>
                <div className="flex gap-2 flex-wrap">
                  {GST_RATES.map(r => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setForm(f => ({ ...f, gstRate: r }))}
                      className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-all
                        ${form.gstRate === r
                          ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                          : 'border-[var(--border)] hover:border-brand-400'}`}
                      style={{ color: form.gstRate === r ? 'white' : 'var(--text-secondary)' }}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isInterState: !f.isInterState }))}
                  className={`relative inline-flex w-11 h-6 rounded-full transition-colors flex-shrink-0
                    ${form.isInterState ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform
                    ${form.isInterState ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Inter-State Transaction
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {form.isInterState ? 'IGST applies' : 'CGST + SGST applies'}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary box */}
            <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-secondary)' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span className="font-semibold font-num" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(subtotal)}
                </span>
              </div>
              {form.isInterState ? (
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>IGST ({form.gstRate}%)</span>
                  <span className="font-num" style={{ color: 'var(--text-secondary)' }}>
                    {formatCurrency(igst)}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>CGST ({form.gstRate / 2}%)</span>
                    <span className="font-num" style={{ color: 'var(--text-secondary)' }}>
                      {formatCurrency(cgst)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>SGST ({form.gstRate / 2}%)</span>
                    <span className="font-num" style={{ color: 'var(--text-secondary)' }}>
                      {formatCurrency(sgst)}
                    </span>
                  </div>
                </>
              )}
              <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-between">
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Total Amount</span>
                  <span className="text-xl font-bold font-num text-brand-500">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6">
          <label className="label">Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="input min-h-[80px] resize-none"
            placeholder="Payment terms, bank details, or any additional notes..."
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pb-8">
          <Link to="/invoices" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary px-8">
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              isEdit ? 'Update Invoice' : 'Create Invoice'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
