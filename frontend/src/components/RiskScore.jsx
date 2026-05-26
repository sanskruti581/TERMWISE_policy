const RiskScore = ({ score = 0 }) => {
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="9" fill="none" className="text-slate-200 dark:text-slate-800" />
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="currentColor"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-emerald-600 transition-all"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-3xl font-bold">{score}</div>
      </div>
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Risk score</p>
        <p className="mt-1 text-2xl font-bold">{score}/100</p>
        <p className="mt-2 max-w-xs text-sm text-slate-600 dark:text-slate-300">Higher scores indicate more concerning privacy language.</p>
      </div>
    </div>
  );
};

export default RiskScore;
