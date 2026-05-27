/**
 * Convert numeric confidence/dominance/relevance values to qualitative signal labels
 * Eliminates false precision and improves trust in analysis
 */

/**
 * Convert a numeric value (0-1 or 0-100) to a signal strength label
 * @param {number} value - The value to convert (0-1 or 0-100)
 * @param {string} scale - 'decimal' (0-1) or 'percent' (0-100)
 * @returns {string} Signal strength label
 */
export const getSignalStrength = (value, scale = 'decimal') => {
  const normalized = scale === 'percent' ? value / 100 : value;
  const clamped = Math.max(0, Math.min(1, normalized));

  if (clamped >= 0.85) return 'Strong signal';
  if (clamped >= 0.65) return 'Moderate signal';
  if (clamped >= 0.45) return 'Weak signal';
  return 'Detected';
};

/**
 * Convert a numeric value to a confidence level label
 * @param {number} value - The value to convert (0-1 or 0-100)
 * @param {string} scale - 'decimal' (0-1) or 'percent' (0-100)
 * @returns {string} Confidence level
 */
export const getConfidenceLevel = (value, scale = 'decimal') => {
  const normalized = scale === 'percent' ? value / 100 : value;
  const clamped = Math.max(0, Math.min(1, normalized));

  if (clamped >= 0.85) return 'High confidence';
  if (clamped >= 0.65) return 'Moderate confidence';
  if (clamped >= 0.45) return 'Low confidence';
  return 'Tentative';
};

/**
 * Convert a numeric value to evidence strength label
 * Emphasizes factual grounding
 * @param {number} value - The value to convert
 * @param {string} scale - 'decimal' (0-1) or 'percent' (0-100)
 * @returns {string} Evidence strength
 */
export const getEvidenceStrength = (value, scale = 'decimal') => {
  const normalized = scale === 'percent' ? value / 100 : value;
  const clamped = Math.max(0, Math.min(1, normalized));

  if (clamped >= 0.85) return 'Strong evidence';
  if (clamped >= 0.65) return 'Moderate evidence';
  if (clamped >= 0.45) return 'Supporting evidence';
  return 'Weak evidence';
};

/**
 * Get the CSS color class for a signal strength
 * @param {number} value
 * @param {string} scale - 'decimal' or 'percent'
 * @returns {object} {bg: bgClass, text: textClass, border: borderClass}
 */
export const getSignalColors = (value, scale = 'decimal') => {
  const strength = getSignalStrength(value, scale);

  const colorMap = {
    'Strong signal': {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      text: 'text-emerald-900 dark:text-emerald-100',
      border: 'border-emerald-200 dark:border-emerald-800',
      badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200'
    },
    'Moderate signal': {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      text: 'text-amber-900 dark:text-amber-100',
      border: 'border-amber-200 dark:border-amber-800',
      badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200'
    },
    'Weak signal': {
      bg: 'bg-slate-50 dark:bg-slate-950/30',
      text: 'text-slate-600 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-800',
      badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
    },
    'Detected': {
      bg: 'bg-slate-50 dark:bg-slate-950/30',
      text: 'text-slate-500 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-800',
      badge: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
    }
  };

  return colorMap[strength] || colorMap['Detected'];
};

/**
 * Format percentage as qualitative for display
 * Only show exact % when user specifically asks
 * @param {number} value
 * @param {string} scale - 'decimal' or 'percent'
 * @param {boolean} showPercent - Whether to append exact percentage
 * @returns {string} Formatted label with optional percentage
 */
export const formatSignal = (value, scale = 'decimal', showPercent = false) => {
  const strength = getSignalStrength(value, scale);
  if (!showPercent) return strength;

  const percent = scale === 'percent' ? value : Math.round(value * 100);
  return `${strength} (${percent}%)`;
};

/**
 * Get severity badge for risk levels
 * @param {string} severity - 'Critical', 'High', 'Medium', 'Low'
 * @returns {object} Badge styling
 */
export const getSeverityColors = (severity) => {
  const severityMap = {
    'Critical': {
      bg: 'bg-rose-100 dark:bg-rose-900/40',
      text: 'text-rose-800 dark:text-rose-200',
      border: 'border-rose-200 dark:border-rose-800',
      dot: 'bg-rose-600'
    },
    'High': {
      bg: 'bg-orange-100 dark:bg-orange-900/40',
      text: 'text-orange-800 dark:text-orange-200',
      border: 'border-orange-200 dark:border-orange-800',
      dot: 'bg-orange-600'
    },
    'Medium': {
      bg: 'bg-amber-100 dark:bg-amber-900/40',
      text: 'text-amber-800 dark:text-amber-200',
      border: 'border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-600'
    },
    'Low': {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-200',
      border: 'border-slate-200 dark:border-slate-700',
      dot: 'bg-slate-500'
    }
  };

  return severityMap[severity] || severityMap['Low'];
};

/**
 * Enterprise UX terminology replacements
 * Map from academic/semantic jargon to clear business language
 */
export const TERMINOLOGY_MAP = {
  'semantic dominance': 'primary signal',
  'intent classification': 'clause purpose',
  'consumer-sensitive': 'high impact',
  'dominant domain': 'main document type',
  'classification reasoning': 'why this classification',
  'context signals': 'detection signals',
  'adaptive recommendations': 'key action items',
  'positive indicators': 'protective clauses',
  'theme confidence': 'detection strength',
  'domain confidence': 'classification certainty',
  'subtype confidence': 'document type clarity',
  'semantic contradictions': 'suppressed alternatives',
  'narrative summary': 'plain language summary'
};

/**
 * Replace academic jargon with enterprise UX language
 * @param {string} text
 * @returns {string} Cleansed text
 */
export const cleanJargon = (text) => {
  if (!text) return '';
  let result = text;
  for (const [jargon, replacement] of Object.entries(TERMINOLOGY_MAP)) {
    const regex = new RegExp(jargon, 'gi');
    result = result.replace(regex, replacement);
  }
  return result;
};
