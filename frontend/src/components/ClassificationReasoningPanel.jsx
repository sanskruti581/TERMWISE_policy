import { Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';
import SignalIndicator from './SignalIndicator.jsx';

/**
 * ClassificationReasoningPanel - Explains WHY a document was classified
 * Builds trust by showing evidence and reasoning
 * 
 * Usage:
 * <ClassificationReasoningPanel
 *   documentType="Loan Agreement"
 *   strongSignals={[...]}
 *   rejectedAlternatives={[...]}
 *   dominantContext="..."
 *   semanticRationale="..."
 * />
 */
const ClassificationReasoningPanel = ({
  documentType,
  strongSignals = [],
  rejectedAlternatives = [],
  dominantContext,
  semanticRationale,
  className = ''
}) => {
  return (
    <div className={`space-y-5 ${className}`}>
      {/* Main classification */}
      <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle size={20} className="text-emerald-700 dark:text-emerald-300 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Classification</h3>
            <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
              This document is classified as a <span className="font-semibold">{documentType}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Strongest signals */}
      {strongSignals.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
            <Lightbulb size={16} className="text-amber-600 dark:text-amber-400" />
            Strongest Detection Signals
          </h4>
          <div className="space-y-3">
            {strongSignals.map((signal, index) => (
              <div key={index} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {signal.label}
                    </p>
                    {signal.occurrences && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {signal.occurrences} occurrences found
                      </p>
                    )}
                  </div>
                </div>

                {/* Signal indicators */}
                <div className="space-y-2">
                  {signal.confidence !== undefined && (
                    <SignalIndicator
                      value={signal.confidence}
                      label="Signal strength"
                      scale="decimal"
                      size="sm"
                      showExactPercent={false}
                    />
                  )}
                  {signal.dominance !== undefined && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Primary signal</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {signal.dominance >= 0.75 ? 'Dominant' : signal.dominance >= 0.45 ? 'Detected' : 'Weak signal'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why not alternatives */}
      {rejectedAlternatives.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-slate-500 dark:text-slate-400" />
            Why Not Other Classifications
          </h4>
          <div className="space-y-2">
            {rejectedAlternatives.map((alt, index) => (
              <div key={index} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">{alt.type}</span>: {alt.reason}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {alt.score}% match
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dominant context */}
      {dominantContext && (
        <div className="rounded-lg border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/30 p-4">
          <h4 className="font-semibold text-sky-900 dark:text-sky-100 mb-2">Dominant Context</h4>
          <p className="text-sm text-sky-800 dark:text-sky-200 leading-6">
            {dominantContext}
          </p>
        </div>
      )}

      {/* Semantic rationale */}
      {semanticRationale && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
          <h4 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">Semantic Rationale</h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-6">
            {semanticRationale}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClassificationReasoningPanel;
