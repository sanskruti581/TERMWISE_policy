const DOMAIN_CATEGORIES = {
  privacy: new Set(['privacy', 'advertising']),
  financial: new Set(['repayment', 'mortgage', 'penalties', 'loanServicing', 'creditDisclosure', 'collectionRecovery', 'payment']),
  legal: new Set(['commercial', 'payment', 'liability', 'indemnification', 'termination', 'confidentiality', 'governingLaw', 'disputeResolution', 'intellectualProperty', 'forceMajeure', 'delivery', 'compliance', 'operational']),
  research: new Set(['researchFunding', 'compliance', 'confidentiality'])
};

const SUPPRESSED_BY_DOMAIN = {
  financial: new Set(['export', 'researchFunding', 'commercial']),
  privacy: new Set(['export', 'researchFunding', 'mortgage', 'repayment', 'penalties']),
  legal: new Set(['advertising']),
  research: new Set(['advertising', 'mortgage', 'penalties'])
};

const inferDomainKey = ({ classification = {}, subtype = {}, themeSummary = {} }) => {
  const label = `${classification.documentType || ''} ${subtype.documentDomain || ''} ${themeSummary.dominantDomain?.key || ''}`.toLowerCase();
  if (/financial|loan|mortgage|banking/.test(label)) return 'financial';
  if (/privacy/.test(label)) return 'privacy';
  if (/research|funding/.test(label)) return 'research';
  return 'legal';
};

const shouldSuppress = (theme, domainKey) => {
  if (!theme) return false;
  const allowed = DOMAIN_CATEGORIES[domainKey] || DOMAIN_CATEGORIES.legal;
  const blocked = SUPPRESSED_BY_DOMAIN[domainKey] || new Set();
  if (allowed.has(theme.key)) return false;
  if (blocked.has(theme.key)) return theme.share < 0.16;
  return domainKey === 'financial' && theme.share < 0.04;
};

export const isolateSemanticThemes = ({ themeSummary, classification, subtype }) => {
  const domainKey = inferDomainKey({ classification, subtype, themeSummary });
  const suppressedThemes = [];
  const themeDominance = (themeSummary.themeDominance || [])
    .map((theme) => {
      if (!shouldSuppress(theme, domainKey)) return theme;
      const suppressed = {
        ...theme,
        share: Number(Math.max(0.01, theme.share * 0.22).toFixed(2)),
        confidence: Number(Math.max(0.08, (theme.confidence || theme.share) * 0.42).toFixed(2)),
        relevance: Number(Math.max(0.01, (theme.relevance || theme.share) * 0.3).toFixed(2)),
        semanticDominance: Number(Math.max(0.02, (theme.semanticDominance || theme.share) * 0.28).toFixed(2)),
        suppressed: true,
        suppressionReason: `${theme.label} was suppressed because it is weakly supported inside a dominant ${domainKey} document.`
      };
      suppressedThemes.push(suppressed);
      return suppressed;
    })
    .sort((a, b) => b.share - a.share);

  const dominantTheme = themeDominance.find((theme) => !theme.suppressed) || themeDominance[0] || null;
  const dominantLegalThemes = (themeSummary.dominantLegalThemes || [])
    .map((theme) => themeDominance.find((item) => item.key === theme.key) || theme)
    .filter((theme) => !theme.suppressed || theme.share >= 0.04);

  return {
    ...themeSummary,
    themeDominance,
    dominantTheme,
    dominantLegalThemes,
    suppressedThemes,
    semanticIsolation: {
      domainKey,
      suppressedThemes: suppressedThemes.map((theme) => ({
        key: theme.key,
        label: theme.label,
        share: theme.share,
        reason: theme.suppressionReason
      }))
    }
  };
};
