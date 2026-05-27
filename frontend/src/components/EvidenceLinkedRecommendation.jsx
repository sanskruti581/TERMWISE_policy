import { AlertCircle, Lightbulb, BookOpen, Zap, CheckCircle2 } from 'lucide-react';

/**
 * EvidenceLinkedRecommendation - Shows a recommendation with triggering evidence
 * Maintains connection between action items and their source
 * 
 * Usage:
 * <EvidenceLinkedRecommendation
 *   recommendation="Review penalty clauses for enforceability"
 *   triggeringClause="penalty will be imposed on contractor"
 *   location="Section 4.2"
 *   severity="HIGH"
 *   evidence={['8 similar clauses', 'Average severity: HIGH']}
 *   actionable={true}
 * />
 */
const EvidenceLinkedRecommendation = ({
  recommendation,
  triggeringClause,
  location,
  severity = 'Medium',
  relevance,
  evidence = [],
  actionable = true,
  category = 'General',
  className = ''
}) => {
  const severityKey = severity === 'Moderate' ? 'Medium' : severity;
  const evidenceItems = Array.isArray(evidence)
    ? evidence.map((item) => {
        if (typeof item === 'string') return item;
        if (!item || typeof item !== 'object') return String(item || '');
        return item.snippet || item.text || item.sentence || item.evidenceSource || item.triggerType || 'Linked source evidence';
      }).filter(Boolean)
    : [];
  // Severity colors
  const severityColors = {
    'Critical': 'border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100',
    'High': 'border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/30 text-orange-900 dark:text-orange-100',
    'Medium': 'border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100',
    'Low': 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-300'
  };

  const severityBadges = {
    'Critical': 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200',
    'High': 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200',
    'Medium': 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200',
    'Low': 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
  };

  const severityDots = {
    'Critical': 'bg-rose-600',
    'High': 'bg-orange-600',
    'Medium': 'bg-amber-600',
    'Low': 'bg-slate-500'
  };

  return (
    <div className={`rounded-lg border ${severityColors[severityKey] || severityColors.Medium} p-4 ${className}`}>
      {/* Header: Recommendation */}
      <div className="flex items-start gap-3 mb-4">
        <Lightbulb size={18} className={`${severityKey === 'Critical' ? 'text-rose-600 dark:text-rose-400' : severityKey === 'High' ? 'text-orange-600 dark:text-orange-400' : 'text-amber-600 dark:text-amber-400'} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{recommendation}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${severityBadges[severityKey] || severityBadges.Medium}`}>
              {severity}
            </span>
            <span className="text-xs opacity-75">{category}</span>
          </div>
        </div>
      </div>

      {/* Triggering Evidence */}
      <div className="space-y-3 mb-4 pb-4 border-b border-current opacity-40">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-75 mb-2 flex items-center gap-2">
            <AlertCircle size={12} />
            Why this matters
          </p>
          <p className="text-sm font-medium">{triggeringClause}</p>
        </div>

        {location && (
          <div className="flex items-center gap-2 text-xs">
            <BookOpen size={12} className="opacity-60 flex-shrink-0" />
            <span className="opacity-75">{location}</span>
          </div>
        )}

        {relevance && (
          <div className="flex items-center justify-between text-xs">
            <span className="opacity-75">Evidence strength</span>
            <span className="font-semibold">
              {relevance >= 75 ? 'Strong signal' : relevance >= 45 ? 'Moderate signal' : 'Weak signal'}
            </span>
          </div>
        )}
      </div>

      {/* Linked Evidence */}
      {evidenceItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-75 flex items-center gap-2">
            <Zap size={12} />
            Linked Evidence
          </p>
          <ul className="space-y-1.5 ml-4">
            {evidenceItems.map((item, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <span className={`${severityDots[severityKey] || severityDots.Medium} h-2 w-2 rounded-full flex-shrink-0 mt-1.5`} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actionable indicator */}
      {actionable && (
        <div className="mt-4 pt-3 border-t border-current opacity-40">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 size={12} />
            Review priority
          </p>
        </div>
      )}
    </div>
  );
};

export default EvidenceLinkedRecommendation;
