const RiskBreakdown = ({ risks = [] }) => {
  const cleanRisks = Array.isArray(risks)
    ? risks.filter((risk) => risk?.category).filter((risk, index, list) => list.findIndex((item) => item.category === risk.category) === index)
    : [];

  if (!cleanRisks.length) {
    return <div className="card p-5 text-sm text-slate-600 dark:text-slate-300">No major rule-based risks were detected.</div>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {cleanRisks.map((risk) => (
        <div key={risk.category} className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{risk.category}</h3>
              <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span>{risk.severity}</span>
                {typeof risk.certainty === 'number' && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">Risk confidence: {risk.certainty}%</span>
                )}
              </div>
            </div>
            <span className="rounded-md bg-rose-100 px-2.5 py-1 text-sm font-semibold text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">+{risk.points}</span>
          </div>
          {risk.matches?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {[...new Set(risk.matches)].slice(0, 5).map((match) => (
                <span key={match} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">{match}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RiskBreakdown;
