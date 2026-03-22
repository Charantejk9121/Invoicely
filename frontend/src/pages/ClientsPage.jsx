import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users, Edit2, Trash2, Mail, Phone, Building2 } from 'lucide-react';
import api from '@/utils/api';
import { getInitials, avatarColor, truncate } from '@/utils/format';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EmptyState from '@/components/shared/EmptyState';
import toast from 'react-hot-toast';

const defaultForm = { name: '', email: '', phone: '', company: '', address: '', gstNumber: '' };

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/clients', { params: { search, limit: 50 } });
      setClients(data.clients); setTotal(data.total);
    } catch { toast.error('Failed to load clients'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => { setEditClient(null); setForm(defaultForm); setShowModal(true); };
  const openEdit = (c, e) => { e.preventDefault(); setEditClient(c); setForm({ name: c.name, email: c.email, phone: c.phone || '', company: c.company || '', address: c.address || '', gstNumber: c.gstNumber || '' }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editClient) {
        await api.put(`/clients/${editClient._id}`, form);
        toast.success('Client updated');
      } else {
        await api.post('/clients', form);
        toast.success('Client added ✓');
      }
      setShowModal(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/clients/${deleteId}`);
      toast.success('Client deleted');
      setDeleteId(null);
      fetch();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Clients</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{total} client{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Client</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="input pl-10" placeholder="Search clients..." />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-40 w-full rounded-2xl" />)}
        </div>
      ) : clients.length === 0 ? (
        <div className="card">
          <EmptyState icon={Users} title="No clients yet" description="Add your first client to start creating invoices."
            action={<button onClick={openCreate} className="btn-primary"><Plus size={15} /> Add Client</button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(c => (
            <Link key={c._id} to={`/clients/${c._id}`} className="card p-5 hover:shadow-md group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 ${avatarColor(c.name)} rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {getInitials(c.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                    {c.company && <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{c.company}</p>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => openEdit(c, e)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    <Edit2 size={13} />
                  </button>
                  <button onClick={e => { e.preventDefault(); setDeleteId(c._id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center gap-2"><Mail size={11} /><span className="truncate">{c.email}</span></div>
                {c.phone && <div className="flex items-center gap-2"><Phone size={11} /><span>{c.phone}</span></div>}
                {c.gstNumber && <div className="flex items-center gap-2"><Building2 size={11} /><span className="font-mono">{c.gstNumber}</span></div>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editClient ? 'Edit Client' : 'Add New Client'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Full Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input" placeholder="Rahul Sharma" required />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input" placeholder="rahul@company.com" required />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="input" placeholder="+91 98765 43210" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Company</label>
              <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                className="input" placeholder="Acme Corp" />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="input" placeholder="123 Street, City, State, PIN" />
            </div>
            <div className="col-span-2">
              <label className="label">GST Number</label>
              <input value={form.gstNumber} onChange={e => setForm(f => ({ ...f, gstNumber: e.target.value }))}
                className="input font-mono" placeholder="22AAAAA0000A1Z5" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (editClient ? 'Save Changes' : 'Add Client')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Client" message="This will delete the client. Invoices linked to this client won't be deleted."
        loading={deleting} />
    </div>
  );
}
