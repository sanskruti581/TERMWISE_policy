// Semantic UI palette for clause categories.
// Keep it calm/enterprise: subtle borders + text, minimal overlays.

export const CLAUSE_SEMANTIC_COLORS = {
  // Penalties / enforcement style -> amber
  'Penalty and default clauses': {
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-900 dark:text-amber-100',
    subtleBg: 'bg-amber-50 dark:bg-amber-950/20',
    accent: 'bg-amber-100 dark:bg-amber-900/30',
  },
  'Repayment obligations': {
    border: 'border-teal-200 dark:border-teal-800',
    text: 'text-teal-900 dark:text-teal-100',
    subtleBg: 'bg-teal-50 dark:bg-teal-950/20',
    accent: 'bg-teal-100 dark:bg-teal-900/30',
  },
  'Termination and enforcement triggers': {
    border: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-900 dark:text-rose-100',
    subtleBg: 'bg-rose-50 dark:bg-rose-950/20',
    accent: 'bg-rose-100 dark:bg-rose-900/25',
  },
  'Collection and recovery activity': {
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-900 dark:text-orange-100',
    subtleBg: 'bg-orange-50 dark:bg-orange-950/20',
    accent: 'bg-orange-100 dark:bg-orange-900/25',
  },

  // Privacy style -> purple
  'Data selling': {
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-900 dark:text-purple-100',
    subtleBg: 'bg-purple-50 dark:bg-purple-950/20',
    accent: 'bg-purple-100 dark:bg-purple-900/30',
  },
  'Biometric collection': {
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-900 dark:text-purple-100',
    subtleBg: 'bg-purple-50 dark:bg-purple-950/20',
    accent: 'bg-purple-100 dark:bg-purple-900/30',
  },
  'Third-party sharing and marketing partners': {
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-900 dark:text-indigo-100',
    subtleBg: 'bg-indigo-50 dark:bg-indigo-950/20',
    accent: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  'Location tracking': {
    border: 'border-sky-200 dark:border-sky-800',
    text: 'text-sky-900 dark:text-sky-100',
    subtleBg: 'bg-sky-50 dark:bg-sky-950/20',
    accent: 'bg-sky-100 dark:bg-sky-900/30',
  },
  'Cookies and advertising tracking': {
    border: 'border-slate-200 dark:border-slate-800',
    text: 'text-slate-900 dark:text-slate-100',
    subtleBg: 'bg-slate-50 dark:bg-slate-950/20',
    accent: 'bg-slate-100 dark:bg-slate-900/30',
  },
  'Permanent data retention': {
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-900 dark:text-purple-100',
    subtleBg: 'bg-purple-50 dark:bg-purple-950/20',
    accent: 'bg-purple-100 dark:bg-purple-900/30',
  },
  'Weak user consent': {
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-900 dark:text-amber-100',
    subtleBg: 'bg-amber-50 dark:bg-amber-950/20',
    accent: 'bg-amber-100 dark:bg-amber-900/30',
  },
};

export const getClauseSemanticColors = (categoryColorOrName) => {
  if (!categoryColorOrName) {
    return {
      border: 'border-slate-200 dark:border-slate-800',
      text: 'text-slate-900 dark:text-slate-100',
      subtleBg: 'bg-slate-50 dark:bg-slate-950/20',
      accent: 'bg-slate-100 dark:bg-slate-900/30',
    };
  }

  // Prefer matching by category name (new scoring rules)
  if (CLAUSE_SEMANTIC_COLORS[categoryColorOrName]) return CLAUSE_SEMANTIC_COLORS[categoryColorOrName];

  // Fallback: old mapping uses color keys like emerald/rose...
  const legacy = String(categoryColorOrName).toLowerCase();
  if (legacy === 'emerald') {
    return {
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-900 dark:text-emerald-100',
      subtleBg: 'bg-emerald-50 dark:bg-emerald-950/20',
      accent: 'bg-emerald-100 dark:bg-emerald-900/30',
    };
  }
  if (legacy === 'rose') {
    return {
      border: 'border-rose-200 dark:border-rose-800',
      text: 'text-rose-900 dark:text-rose-100',
      subtleBg: 'bg-rose-50 dark:bg-rose-950/20',
      accent: 'bg-rose-100 dark:bg-rose-900/25',
    };
  }
  if (legacy === 'amber') {
    return {
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-900 dark:text-amber-100',
      subtleBg: 'bg-amber-50 dark:bg-amber-950/20',
      accent: 'bg-amber-100 dark:bg-amber-900/30',
    };
  }
  if (legacy === 'purple') {
    return {
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-900 dark:text-purple-100',
      subtleBg: 'bg-purple-50 dark:bg-purple-950/20',
      accent: 'bg-purple-100 dark:bg-purple-900/30',
    };
  }

  return {
    border: 'border-slate-200 dark:border-slate-800',
    text: 'text-slate-900 dark:text-slate-100',
    subtleBg: 'bg-slate-50 dark:bg-slate-950/20',
    accent: 'bg-slate-100 dark:bg-slate-900/30',
  };
};

