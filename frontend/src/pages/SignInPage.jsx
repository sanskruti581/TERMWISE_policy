import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Scale } from 'lucide-react';
import { useTheme } from '../hooks/useTheme.js';


const SignInPage = () => {
  useTheme();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

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
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        // ignore JSON parse errors
      }

      if (!response.ok) {
        setError(data?.message || `Sign in failed (${response.status})`);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] px-4 py-7 text-white">
      <div className="pointer-events-none absolute bottom-[-10rem] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(52,211,153,0.14),transparent_40%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[29rem] flex-col justify-center">
        <Link
          to="/"
          className="mb-6 inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition duration-200 hover:text-emerald-200"
        >
          <ArrowLeft size={15} />
          Back
        </Link>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-2xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/15">
            <Scale size={19} />
          </div>
          <p className="mb-2 text-sm font-semibold text-emerald-200">TermsWise</p>
          <h1 className="text-[1.7rem] font-semibold tracking-tight text-white">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Continue your document review workflow.
          </p>
        </div>

        <div className="animate-[fadeIn_240ms_ease-out] rounded-[1.5rem] bg-[#0b1220]/95 p-6 shadow-[0_20px_70px_-35px_rgba(0,0,0,0.9)] ring-1 ring-white/10 backdrop-blur-[6px] border border-white/10">
          {error && (
            <div className="mb-5 rounded-2xl bg-red-500/10 p-3 text-sm text-red-100 ring-1 ring-red-400/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Mail size={15} /> Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.07] px-4 py-2.5 text-white outline-none transition duration-200 placeholder:text-slate-500 hover:bg-white/[0.09] focus:border-emerald-300/50 focus:bg-white/[0.105] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.08)]"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Lock size={15} /> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.07] px-4 py-2.5 pr-12 text-white outline-none transition duration-200 placeholder:text-slate-500 hover:bg-white/[0.09] focus:border-emerald-300/50 focus:bg-white/[0.105] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.08)]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-emerald-200"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} /> }
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-emerald-400 py-2.5 font-semibold text-slate-950 shadow-lg shadow-emerald-500/10 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-300 hover:shadow-emerald-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-emerald-200 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
        <div className="mt-5 text-center text-xs text-slate-500">
          Your analyses stay private.
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
