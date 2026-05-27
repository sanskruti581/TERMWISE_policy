import { AlertCircle, BookOpen, Zap } from 'lucide-react';
import { getSeverityColors } from '../utils/signalStrength.js';

/**
 * EvidencePanel - Displays evidence for a finding
 * Shows source clause, location, and evidence strength
 * 
 * Usage:
 * <EvidencePanel
 *   clause="penalty will be imposed"
 *   location="Section 4.2 - Enforcement"
 *   severity="HIGH"
 *   relevance={94}
 *   evidence={['8 similar clauses', 'Average severity: HIGH']}
 * />
 */
const EvidencePanel = ({
  clause,
  location,
  severity = 'Medium',
  relevance = null,
  evidence = [],
  matchCount = null,
  actionable = true,
  className = ''
}) => {
  const severityColors = getSeverityColors(severity);

  return (
    <div className={`rounded-lg border ${severityColors.border} ${severityColors.bg} p-4 ${className}`}>
      {/* Header with severity */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className={`${severityColors.text} flex-shrink-0 mt-0.5`} />
          <div>
            <h4 className={`font-semibold ${severityColors.text}`}>Triggered by</h4>
            <p className={`text-sm mt-1 ${severityColors.text} font-medium`}>
              {clause}
            </p>
          </div>
        </div>
        <span className={`${severityColors.bg} rounded-md px-2.5 py-1 text-xs font-bold ${severityColors.text} whitespace-nowrap`}>
          {severity}
        </span>
      </div>

      {/* Location */}
      {location && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <BookOpen size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <span className="text-slate-600 dark:text-slate-300">{location}</span>
        </div>
      )}

      {/* Relevance signal (qualitative; avoid fake precision) */}
      {relevance !== null && (
        <div className="mb-3 flex items-center gap-2">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Evidence strength:
          </div>
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-50">
            {relevance >= 75 ? 'Strong signal' : relevance >= 45 ? 'Moderate signal' : 'Weak signal'}
          </span>
        </div>
      )}

      {/* Evidence list */}
      {evidence.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
            <Zap size={12} />
            Linked Evidence
          </div>
          <ul className="space-y-1.5">
            {evidence.map((item, index) => (
              <li key={index} className="text-sm text-slate-700 dark:text-slate-200 flex items-start gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Meta info */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-300 dark:border-slate-700/50 text-xs">
        {matchCount && (
          <span className="text-slate-600 dark:text-slate-400">
            {matchCount} similar pattern{matchCount !== 1 ? 's' : ''} detected
          </span>
        )}
        {actionable && (
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
            ✓ Actionable
          </span>
        )}
      </div>
    </div>
  );
};

export default EvidencePanel;
