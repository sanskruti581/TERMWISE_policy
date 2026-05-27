import { AlertCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { getClauseSemanticColors } from '../utils/clauseSemanticColors.js';

/**
 * ClauseGrouping - Groups related clauses by semantic category
 * Reduces repetition and improves information density
 * 
 * Usage:
 * <ClauseGrouping
 *   category="Penalty & Enforcement"
 *   description="Terms related to penalties and enforcement mechanisms"
 *   clauses={[...]}
 * />
 */
const ClauseGroup = ({
  categoryName,
  categoryDescription,
  categoryColor = 'emerald',
  clauses = []
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!clauses.length) return null;

  const colors = getClauseSemanticColors(categoryColor);

  return (
    <section className={`rounded-2xl border ${colors.border} ${colors.subtleBg} shadow-sm`} aria-label={categoryName}>

      {/* Category header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3.5 flex items-start justify-between gap-3 hover:bg-white/25 dark:hover:bg-slate-950/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
        aria-expanded={isExpanded}
      >


        <div className="flex items-start gap-3">
          <AlertCircle size={18} className={`${colors.text} flex-shrink-0 mt-1`} />
          <div className="text-left">
            <h3 className={`font-semibold ${colors.text} text-[15px] leading-5`}>{categoryName}</h3>
            {categoryDescription && (
              <p className={`text-sm ${colors.text} opacity-80 mt-0.5 leading-5`}>{categoryDescription}</p>
            )}
          </div>
        </div>

        <ChevronDown
          size={18}
          className={`${colors.text} flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Clauses list */}
      {isExpanded && (
        <div>
          <div className="space-y-3 p-5 pt-4">
            {clauses.map((clause, index) => (
              <article
                key={index}
                className="group relative overflow-hidden rounded-xl bg-white/60 p-5 shadow-[0_10px_30px_-18px_rgba(2,6,23,0.45)] ring-1 ring-slate-200/70 transition-shadow hover:shadow-[0_18px_40px_-22px_rgba(2,6,23,0.6)] dark:bg-slate-950/35 dark:ring-slate-800/70"
              >
                {/* Semantic accent line */}
                <div className={`absolute left-0 top-0 h-full w-1 ${colors.accent} opacity-75`} aria-hidden="true" />

                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Main clause text */}
                    <p className={`text-[14px] font-semibold ${colors.text} mb-3 leading-6 pr-2`}>
                      {clause.sentence}
                    </p>

                    {/* Badge row */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {clause.severity && (
                        <span className={`rounded-full px-2.5 py-1 font-semibold ${colors.accent} text-[11.5px]`}> 
                          {clause.severity}
                        </span>
                      )}

                      {clause.category && (
                        <span className={`rounded-full px-2.5 py-1 font-semibold ${colors.accent} text-[11.5px] bg-opacity-70`}> 
                          {clause.category}
                        </span>
                      )}

                      {clause.clauseType && (
                        <span className={`rounded-full px-2.5 py-1 text-[11.5px] ${colors.text} opacity-80`}> 
                          {clause.clauseType}
                        </span>
                      )}
                    </div>

                    {/* Supporting explanation */}
                    {clause.explanation && (
                      <p className={`text-[12.5px] ${colors.text} opacity-85 mt-3 leading-5`}> 
                        {clause.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}


      {/* Count badge */}
      <div className="px-4 py-2 border-t border-current/10 text-xs font-semibold text-slate-600 dark:text-slate-400">
        {clauses.length} clause{clauses.length !== 1 ? 's' : ''} in this group
      </div>
    </section>
  );
};

/**
 * ClauseGrouping - Container for grouped clauses
 * Organizes clauses by semantic category to reduce repetition
 */
const ClauseGrouping = ({ groups = [], noGroupsMessage = 'No highlighted clauses were detected.' }) => {
  if (!groups || groups.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 p-4 text-center text-slate-600 dark:text-slate-300 text-sm">
        {noGroupsMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4" role="list" aria-label="Highlighted clauses">
      {groups.map((group, index) => (
        <ClauseGroup
          key={index}
          categoryName={group.name}
          categoryDescription={group.description}
          categoryColor={group.color}
          clauses={group.clauses}
        />
      ))}
    </div>
  );
};

export { ClauseGroup };
export default ClauseGrouping;

