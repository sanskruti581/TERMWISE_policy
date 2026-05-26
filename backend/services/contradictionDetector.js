const contradictionRules = [
  {
    domain: 'financial',
    categories: ['export', 'researchFunding', 'advertising'],
    message: 'This theme conflicts with the financial agreement context and was treated as incidental unless strongly supported.'
  },
  {
    domain: 'privacy',
    categories: ['mortgage', 'repayment', 'penalties', 'export'],
    message: 'This theme conflicts with a privacy-policy context and was treated as supporting evidence only.'
  },
  {
    domain: 'legal',
    categories: ['advertising'],
    message: 'Advertising language appears weak relative to the contract context and was not allowed to dominate classification.'
  }
];

export const detectSemanticContradictions = ({ themeSummary = {}, semanticIsolation = {} }) => {
  const domain = semanticIsolation.domainKey || themeSummary.semanticIsolation?.domainKey || 'legal';
  const activeRule = contradictionRules.find((rule) => rule.domain === domain);
  if (!activeRule) return [];

  return (themeSummary.themeDominance || [])
    .filter((theme) => activeRule.categories.includes(theme.key) && (theme.share || 0) < 0.12)
    .map((theme) => ({
      key: theme.key,
      label: theme.label,
      share: theme.share,
      message: activeRule.message
    }));
};
