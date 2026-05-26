import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { History, Moon, Scale, Sun, LogOut } from 'lucide-react';
import { useTheme } from '../hooks/useTheme.js';
import { useState, useEffect } from 'react';

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-100'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

const AppLayout = () => {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const ThemeIcon = theme === 'dark' ? Sun : Moon;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/signin');
  };

  return (
    <div className="min-h-screen text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-emerald-600 text-white">
              <Scale size={19} />
            </span>
            <span>TermsWise</span>
          </Link>
          <nav className="flex items-center gap-2">
            <NavLink to="/" className={navLinkClass}>
              Analyze
            </NavLink>
            {user && (
              <NavLink to="/history" className={navLinkClass}>
                <span className="inline-flex items-center gap-2"><History size={16} /> History</span>
              </NavLink>
            )}
            <button type="button" onClick={toggleTheme} className="btn-secondary px-3" aria-label="Toggle theme">
              <ThemeIcon size={17} />
            </button>
            
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">{user.name}</span>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/signin"
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
