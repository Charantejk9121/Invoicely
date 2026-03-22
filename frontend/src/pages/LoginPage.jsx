import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-secondary)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-500 to-cyan-400 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white/40"
              style={{ width: `${(i + 1) * 120}px`, height: `${(i + 1) * 120}px`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          ))}
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Zap size={20} className="text-white fill-white" />
            </div>
            <span className="text-white text-xl font-bold">Invoicely</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Invoicing made<br />
            <span className="text-white/70">effortlessly simple.</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Create professional invoices, track payments, and manage your clients — all in one place.
          </p>
        </div>
        <div className="relative grid grid-cols-3 gap-4">
          {[
            { label: 'Invoices Created', value: '12K+' },
            { label: 'Revenue Tracked', value: '₹2.4Cr' },
            { label: 'Happy Businesses', value: '3K+' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-white/60 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Zap size={15} className="text-white fill-white" />
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Invoicely</span>
          </div>

          <h2 className="text-2xl font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="input" placeholder="you@company.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input pr-11" placeholder="••••••••" required />
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
                <><span>Sign In</span><ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-500 font-semibold hover:text-brand-600">Create one free</Link>
          </p>

          {/* Demo hint */}
          <div className="mt-4 p-3 rounded-xl text-xs text-center" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
            Demo: register a new account to get started instantly
          </div>
        </div>
      </div>
    </div>
  );
}
