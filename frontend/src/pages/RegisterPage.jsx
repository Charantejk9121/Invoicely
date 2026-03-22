import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.company);
      toast.success('Account created! Welcome to Invoicely 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-secondary)' }}>
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-glow">
            <Zap size={15} className="text-white fill-white" />
          </div>
          <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Invoicely</span>
        </div>

        <h2 className="text-2xl font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>Create your account</h2>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>Start managing invoices professionally for free</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Full Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="input" placeholder="Rahul Sharma" required />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Company Name</label>
              <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                className="input" placeholder="Acme Pvt Ltd" />
            </div>
          </div>
          <div>
            <label className="label">Email address *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="input" placeholder="you@company.com" required />
          </div>
          <div>
            <label className="label">Password *</label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input pr-11" placeholder="Min. 6 characters" required />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: 'var(--text-secondary)' }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><span>Create Account</span><ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" className="text-brand-500 font-semibold hover:text-brand-600">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
