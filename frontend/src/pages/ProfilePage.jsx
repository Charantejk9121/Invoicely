import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Building2, Phone, MapPin, Hash, Globe, Save, Shield } from 'lucide-react';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { getInitials, avatarColor } from '@/utils/format';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    company: user?.company || '',
    phone: user?.phone || '',
    address: user?.address || '',
    gstNumber: user?.gstNumber || '',
    currency: user?.currency || 'INR',
  });
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated ✓');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    if (pwForm.next.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setPwSaving(true);
    try {
      await api.put('/auth/profile', { password: pwForm.next });
      toast.success('Password changed ✓');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Change failed');
    } finally { setPwSaving(false); }
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage your account and business profile</p>
      </div>

      {/* Avatar + name */}
      <div className="card p-6">
        <div className="flex items-center gap-5">
          <div className={`w-16 h-16 ${avatarColor(user?.name)} rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0`}>
            {getInitials(user?.name)}
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
            {user?.company && <p className="text-xs mt-1 text-brand-500 font-medium">{user.company}</p>}
          </div>
        </div>
      </div>

      {/* Business profile */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center">
            <Building2 size={16} className="text-brand-500" />
          </div>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Business Profile</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input pl-9" placeholder="Your name" required />
              </div>
            </div>
            <div>
              <label className="label">Company Name</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
                <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  className="input pl-9" placeholder="Acme Pvt Ltd" />
              </div>
            </div>
            <div>
              <label className="label">Phone</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="input pl-9" placeholder="+91 98765 43210" />
              </div>
            </div>
            <div>
              <label className="label">GST Number</label>
              <div className="relative">
                <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
                <input value={form.gstNumber} onChange={e => setForm(f => ({ ...f, gstNumber: e.target.value }))}
                  className="input pl-9 font-mono" placeholder="22AAAAA0000A1Z5" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Business Address</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3.5 top-3.5 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
                <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="input pl-9 resize-none" placeholder="123 Street, City, State, PIN" rows={2} />
              </div>
            </div>
            <div>
              <label className="label">Default Currency</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className="input pl-9 appearance-none">
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Save size={15} /> Save Changes</>
              }
            </button>
          </div>
        </form>
      </div>

      {/* Security */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-violet-500" />
          </div>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Change Password</h2>
        </div>

        <form onSubmit={handlePwChange} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <input type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
              className="input" placeholder="Min. 6 characters" required />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              className="input" placeholder="Repeat new password" required />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={pwSaving} className="btn-secondary">
              {pwSaving
                ? <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                : <><Shield size={15} /> Update Password</>
              }
            </button>
          </div>
        </form>
      </div>

      {/* Account info */}
      <div className="card p-6">
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Account Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Email</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{user?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Member Since</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '—'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span style={{ color: 'var(--text-secondary)' }}>Plan</span>
            <span className="text-xs font-semibold px-2.5 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full">Free</span>
          </div>
        </div>
      </div>
    </div>
  );
}
