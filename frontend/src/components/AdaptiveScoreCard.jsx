import { getAdaptiveScoreLabel } from '../utils/scoreLabelMapping.js';
import { FileSearch } from 'lucide-react';
import { getExposureLevel, getExposureLevelExplanation } from '../utils/semanticFraming.js';

/**
 * AdaptiveScoreCard - Smart score display with adaptive naming
 * Replaces generic "Risk Score" with context-aware labels
 * 
 * Usage:
 * <AdaptiveScoreCard
 *   score={75}
 *   documentType="Loan Agreement"
 *   grade="B+"
 * />
 */
const AdaptiveScoreCard = ({
  score = 0,
  documentType = 'Unknown',
  grade = 'N/A',
  className = ''
}) => {
  const scoreConfig = getAdaptiveScoreLabel(documentType);
  const exposureLevel = getExposureLevel(score, documentType);
  const exposureExplanation = getExposureLevelExplanation(score, documentType);
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (score / 100) * circumference;

  const getAssessmentColors = () => {
    if (score >= 75) return { circle: 'text-rose-600', dot: 'bg-rose-600', accent: 'text-rose-700' };
    if (score >= 50) return { circle: 'text-orange-600', dot: 'bg-orange-600', accent: 'text-orange-700' };
    if (score >= 25) return { circle: 'text-amber-600', dot: 'bg-amber-600', accent: 'text-amber-700' };
    return { circle: 'text-emerald-600', dot: 'bg-emerald-600', accent: 'text-emerald-700' };
  };

  const assessmentColors = getAssessmentColors();

  return (
    <div className={`rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 ${className}`}>
      {/* Header */}
      <p className="text-sm uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400 mb-4">
        {scoreConfig.label}
      </p>

      {/* Score circle + info */}
      <div className="flex items-start gap-6 mb-6">
        {/* Circular progress */}
        <div className="flex-shrink-0">
          <div className="relative h-32 w-32">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-slate-200 dark:text-slate-800"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className={`${assessmentColors.circle} transition-all duration-700`}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{score}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">/ 100</p>
              </div>
            </div>
          </div>
        </div>

        {/* Text info */}
        <div className="flex-1">
          <div className="space-y-3">
            {/* Grade */}
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-black ${assessmentColors.accent}`}>{grade}</span>
              <div className="text-sm">
                <p className="font-semibold text-slate-900 dark:text-slate-50">Review Grade</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Executive assessment</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${assessmentColors.dot}`} />
              <div className="text-sm">
                <p className="font-semibold text-slate-900 dark:text-slate-50">{exposureLevel}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Review posture</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-6">
        {scoreConfig.description}
      </p>

      {/* Document type note */}
      {documentType && documentType !== 'Unknown' && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold">Document Type:</span> {documentType}
          </p>
        </div>
      )}

      {/* Interpretation */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-2">
          <FileSearch size={14} className="text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {exposureExplanation}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveScoreCard;
