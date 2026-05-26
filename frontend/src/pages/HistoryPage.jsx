import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Trash2 } from 'lucide-react';
import { deleteAnalysis, getHistory } from '../services/api.js';
import { formatDate, gradeClass } from '../utils/formatters.js';

const HistoryPage = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setItems(await getHistory(search));
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load history.');
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  const emptyMessage = useMemo(() => search ? 'No analyses match your search.' : 'No saved analyses yet.', [search]);

  const removeItem = async (id) => {
    try {
      await deleteAnalysis(id);
      setItems((current) => current.filter((item) => (item.id || item._id) !== id));
      toast.success('Analysis deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete analysis.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analysis history</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Review, search, and reopen previous TermsWise reports.</p>
        </div>
        <label className="relative block w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input className="input pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search analyses" />
        </label>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-slate-600 dark:text-slate-300">Loading history...</div>
      ) : items.length ? (
        <div className="grid gap-4">
          {items.map((item) => {
            const id = item.id || item._id;
            const grade = item.grade || item.privacyGrade;
            const score = item.score ?? item.riskScore;

            return (
              <article key={id} className="card p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <Link to={`/results/${id}`} className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="truncate text-lg font-semibold hover:text-emerald-700 dark:hover:text-emerald-300">{item.title}</h2>
                      <span className={`rounded-md px-2.5 py-1 text-sm font-bold ${gradeClass(grade)}`}>{grade}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{item.excerpt || item.summary || 'No summary available.'}</p>
                    <p className="mt-3 text-xs text-slate-500">{formatDate(item.createdAt)} - Score {score}/100 - {item.riskLevel}</p>
                  </Link>
                  <button type="button" className="btn-secondary px-3 text-rose-700 dark:text-rose-300" onClick={() => removeItem(id)} aria-label="Delete analysis">
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <h2 className="text-xl font-semibold">{emptyMessage}</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Run an analysis from the home page and it will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
