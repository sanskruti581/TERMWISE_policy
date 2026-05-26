import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';

const SignUpPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Sign up failed');
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
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <h1 className="mb-6 text-center text-2xl font-bold">Create Account</h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <User size={16} /> Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Mail size={16} /> Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Lock size={16} /> Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Lock size={16} /> Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-emerald-600 dark:border-slate-600 dark:bg-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-600 py-2 text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link to="/signin" className="text-emerald-600 hover:underline dark:text-emerald-400">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
