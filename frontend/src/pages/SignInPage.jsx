import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileSearch, Lock, Mail, Scale, ShieldCheck } from 'lucide-react';

const SignInPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Sign in failed');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#064e3b_0%,#020617_34%,#020617_100%)] px-4 py-8 text-white">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="w-full max-w-md justify-self-center rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl md:p-8">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-emerald-200"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <div className="mb-7">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-sm font-semibold text-emerald-100">
              <Scale size={15} />
              TermsWise
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Welcome back</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Continue your TermsWise workflow.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Mail size={16} /> Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-emerald-300/70 focus:bg-white/[0.13] focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Lock size={16} /> Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-emerald-300/70 focus:bg-white/[0.13] focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3 font-bold text-slate-950 shadow-xl shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-emerald-500/25 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-300">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-emerald-200 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>

        <div className="hidden lg:block">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-semibold text-slate-200">
              <FileSearch size={16} />
              Privacy intelligence
            </div>
            <h2 className="max-w-xl text-4xl font-black leading-tight tracking-tight text-white">
              Clear policy review, saved in one place.
            </h2>

            <div className="mt-8 grid gap-3">
              {[
                ['Saved analyses', 'Return anytime.'],
                ['Plain-English briefs', 'No legal clutter.'],
                ['Evidence linked', 'Sources stay visible.'],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 rounded-xl bg-emerald-400/10 p-2 text-emerald-200">
                      <ShieldCheck size={18} />
                    </span>
                    <div>
                      <p className="font-semibold text-white">{title}</p>
                      <p className="mt-1 text-sm text-slate-400">{detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
