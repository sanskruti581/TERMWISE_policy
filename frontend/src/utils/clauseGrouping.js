/**
 * Utilities for grouping clauses by semantic category
 * Reduces repetition and improves information density
 */

/**
 * Clause category definitions with keywords and metadata
 */
const CLAUSE_CATEGORIES = [
  {
    name: 'Penalties & Enforcement',
    description: 'Terms related to penalties, enforcement mechanisms, and consequences',
    color: 'rose',
    keywords: ['penalty', 'enforcement', 'fine', 'liability', 'default', 'breach', 'violat', 'sanction', 'consequence', 'enforce'],
    intentPatterns: ['penalty', 'enforcement', 'liability']
  },
  {
    name: 'Compliance & Obligations',
    description: 'Requirements, compliance terms, and operational obligations',
    color: 'amber',
    keywords: ['comply', 'obligation', 'require', 'shall', 'must', 'compliance', 'adherence', 'conform', 'responsible', 'accountable'],
    intentPatterns: ['compliance', 'obligation', 'requirement']
  },
  {
    name: 'Data & Privacy Rights',
    description: 'Clauses governing data handling, privacy, and consumer rights',
    color: 'sky',
    keywords: ['data', 'personal', 'privacy', 'collect', 'process', 'consent', 'share', 'tracking', 'cookie', 'personal information'],
    intentPatterns: ['data-collection', 'privacy', 'consent', 'tracking']
  },
  {
    name: 'Financial & Payment Terms',
    description: 'Payment obligations, financial conditions, and pricing terms',
    color: 'purple',
    keywords: ['payment', 'fee', 'charge', 'price', 'cost', 'financial', 'interest', 'repayment', 'loan', 'borrow'],
    intentPatterns: ['payment', 'financial', 'repayment', 'interest']
  },
  {
    name: 'Termination & Rights',
    description: 'Termination conditions, cancellation rights, and relationship end terms',
    color: 'emerald',
    keywords: ['terminate', 'cancell', 'discontinu', 'ending', 'expire', 'right to cancel', 'exit', 'rescind', 'release'],
    intentPatterns: ['termination', 'cancellation', 'rights']
  },
  {
    name: 'Limitation of Liability',
    description: 'Disclaimers, liability limitations, and risk exclusions',
    color: 'slate',
    keywords: ['limit', 'liable', 'disclaim', 'warranty', 'exclude', 'exempt', 'not responsible', 'no liability', 'indemnif'],
    intentPatterns: ['limitation', 'disclaimer', 'warranty']
  }
];

/**
 * Categorize a clause based on keywords and intent
 * @param {object} clause - The clause object {sentence, intentTypes, category, etc}
 * @returns {object} Category object {name, color, keywords} or null if uncategorized
 */
const categorizeSingleClause = (clause) => {
  if (!clause) return null;

  const clauseText = (clause.sentence || '').toLowerCase();
  const clauseIntents = clause.intentTypes || [];

  // Check intent patterns first (higher priority)
  for (const category of CLAUSE_CATEGORIES) {
    for (const pattern of category.intentPatterns) {
      if (clauseIntents.some(intent => intent.toLowerCase().includes(pattern))) {
        return category;
      }
    }
  }

  // Then check keyword patterns
  for (const category of CLAUSE_CATEGORIES) {
    for (const keyword of category.keywords) {
      if (clauseText.includes(keyword)) {
        return category;
      }
    }
  }

  return null;
};

/**
 * Group clauses by semantic category
 * @param {array} clauses - Array of clause objects
 * @returns {array} Grouped clauses: [{name, description, color, clauses: [...]}, ...]
 */
export const groupClausesByCategory = (clauses = []) => {
  if (!Array.isArray(clauses) || clauses.length === 0) {
    return [];
  }

  // Initialize category map
  const groupedMap = {};
  CLAUSE_CATEGORIES.forEach(cat => {
    groupedMap[cat.name] = {
      name: cat.name,
      description: cat.description,
      color: cat.color,
      clauses: []
    };
  });

  // Add uncategorized group
  groupedMap['Other'] = {
    name: 'Other Clauses',
    description: 'Clauses that don\'t fit other categories',
    color: 'slate',
    clauses: []
  };

  // Group clauses
  clauses.forEach(clause => {
    const category = categorizeSingleClause(clause);
    if (category) {
      groupedMap[category.name].clauses.push(clause);
    } else {
      groupedMap['Other'].clauses.push(clause);
    }
  });

  // Return only groups with clauses, in order
  return CLAUSE_CATEGORIES
    .filter(cat => groupedMap[cat.name]?.clauses.length > 0)
    .map(cat => groupedMap[cat.name])
    .concat(groupedMap['Other'].clauses.length > 0 ? [groupedMap['Other']] : []);
};

/**
 * Get merged explanation for a clause category
 * Combines explanations from multiple similar clauses
 * @param {array} clauses - Clauses in the category
 * @returns {string} Merged explanation
 */
export const getMergedExplanation = (clauses = []) => {
  const explanations = clauses
    .filter(c => c.explanation)
    .map(c => c.explanation.trim())
    .filter(Boolean);

  if (explanations.length === 0) return null;
  if (explanations.length === 1) return explanations[0];

  // Find unique explanations
  const uniqueExplanations = [...new Set(explanations)];
  return uniqueExplanations.join(' ');
};

/**
 * Get category statistics
 * @param {array} groups - Grouped clauses
 * @returns {object} Statistics
 */
export const getCategoryStats = (groups = []) => {
  return {
    totalClauses: groups.reduce((sum, group) => sum + group.clauses.length, 0),
    categoryCount: groups.length,
    highestSeverityPerGroup: groups.map(group => ({
      category: group.name,
      severity: getHighestSeverity(group.clauses)
    }))
  };
};

/**
 * Get highest severity from clauses
 * @param {array} clauses
 * @returns {string} Severity level
 */
const getHighestSeverity = (clauses = []) => {
  const severityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
  const severities = clauses
    .map(c => c.severity || 'Medium')
    .map(s => severityOrder[s] || 2);

  if (severities.length === 0) return 'Medium';
  const max = Math.max(...severities);
  return Object.entries(severityOrder).find(([_, val]) => val === max)?.[0] || 'Medium';
};

/**
 * Get dominant clause patterns in a group
 * @param {array} clauses
 * @returns {array} Pattern objects
 */
export const getDominantPatterns = (clauses = []) => {
  const patterns = {};

  clauses.forEach(clause => {
    if (clause.category) {
      patterns[clause.category] = (patterns[clause.category] || 0) + 1;
    }
  });

  return Object.entries(patterns)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
};
