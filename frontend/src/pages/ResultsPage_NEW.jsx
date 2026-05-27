import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen } from 'lucide-react';

import { getAnalysis } from '../services/api.js';
import { formatDate } from '../utils/formatters.js';
import { groupClausesByCategory } from '../utils/clauseGrouping.js';
import AdaptiveScoreCard from '../components/AdaptiveScoreCard.jsx';
import CollapsibleSection from '../components/CollapsibleSection.jsx';
import SignalIndicator from '../components/SignalIndicator.jsx';
import ClassificationReasoningPanel from '../components/ClassificationReasoningPanel.jsx';
import ClauseGrouping from '../components/ClauseGrouping.jsx';

import EvidenceLinkedRecommendation from '../components/EvidenceLinkedRecommendation.jsx';
import ExportDropdown from '../components/ExportDropdown.jsx';
import RiskBreakdown from '../components/RiskBreakdown.jsx';

/**
 * Normalize and validate analysis data
 */
const normalizeReport = (analysis) => {
  const risks = Array.isArray(analysis.risks)
    ? analysis.risks.filter((r) => r?.category).filter((r, idx, arr) => arr.findIndex((x) => x.category === r.category) === idx)
    : [];

  const highlights = Array.isArray(analysis.highlights) ? analysis.highlights.slice(0, 12) : [];
  const positives = Array.isArray(analysis.positives) ? analysis.positives.slice(0, 6) : [];
  const recommendations = Array.isArray(analysis.recommendations) ? analysis.recommendations.filter(Boolean) : [];

  return {
    id: analysis.id,
    title: analysis.title || 'Untitled analysis',
    createdAt: analysis.createdAt,
    score: analysis.score || 0,
    grade: analysis.grade || 'N/A',
    riskLevel: analysis.riskLevel || 'Unknown',
    documentType: analysis.documentType || 'Unknown',
    documentDomain: analysis.documentDomain || analysis.documentType || 'Unknown',
    documentSubtype: analysis.documentSubtype || analysis.documentType || 'Unknown',
    semanticNarrative: String(analysis.semanticNarrative || '').trim(),
    summary: String(analysis.summary || '').trim(),
    classificationReasoning: analysis.classificationReasoning || null,
    themeDominance: Array.isArray(analysis.themeDominance) ? analysis.themeDominance : [],
    contextSignals: Array.isArray(analysis.contextSignals) ? analysis.contextSignals : [],
    dominantLegalThemes: Array.isArray(analysis.dominantLegalThemes) ? analysis.dominantLegalThemes : [],
    pipelineStages: Array.isArray(analysis.pipelineStages) ? analysis.pipelineStages : [],
    risks,
    highlights,
    positives,
    recommendations,
    adaptiveRecommendations: Array.isArray(analysis.adaptiveRecommendations) ? analysis.adaptiveRecommendations : [],
  };
};

/**
 * PipelineStages component
 */
const PipelineStages = ({ stages = [] }) => {
  if (!stages.length) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {stages.map((stage, index) => (
        <div
          key={stage.label || index}
          className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/30"
        >
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{stage.label}</span>
        </div>
      ))}
    </div>
  );
};

const pickTopRiskFindings = (risks, max = 4) => {
  if (!Array.isArray(risks)) return [];
  // Keep ordering from backend; truncate to keep the decision surface fast.
  return risks.slice(0, max);
};

const toBriefLabel = (risk) => {
  if (!risk) return '';
  return risk.category || risk.label || risk.name || 'Finding';
};

const toBriefDetail = (risk) => {
  if (!risk) return '';
  return risk.description || risk.explanation || risk.summary || risk.detail || '';
};

const clampText = (value, maxLen = 120) => {
  const s = String(value || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen).trim()}…`;
};

const normalizeSeverity = (s) => {
  const v = String(s || '').toLowerCase();
  if (v.includes('critical')) return 'Critical';
  if (v.includes('high')) return 'High';
  if (v.includes('medium')) return 'Moderate';
  if (v.includes('low')) return 'Low';
  if (v.includes('safe')) return 'Low';
  return 'Unknown';
};

const exposureLabelFrom = (score, riskLevel) => {
  // Keep it calm and non-technical.
  const s = typeof score === 'number' ? score : Number(score);
  if (!Number.isFinite(s) && riskLevel) {
    const rl = String(riskLevel).toLowerCase();
    if (rl.includes('high') || rl.includes('elevated') || rl.includes('risk')) return 'Elevated exposure';
    if (rl.includes('moderate') || rl.includes('medium')) return 'Moderate exposure';
    if (rl.includes('low') || rl.includes('minimal')) return 'Low exposure';
  }

  if (Number.isFinite(s)) {
    if (s >= 75) return 'Elevated exposure';
    if (s >= 50) return 'Moderate exposure';
    if (s >= 25) return 'Standard exposure';
    return 'Low exposure';
  }

  return String(riskLevel || 'Unknown');
};

const concernToOneLiner = (r) => {
  const label = toBriefLabel(r);
  const detail = clampText(toBriefDetail(r), 110);
  if (!label && !detail) return '';
  if (label && detail) return `${label}: ${detail}`;
  return label || detail;
};

const buildExecutiveParagraph = (report, topRisksForParagraph) => {
  const domain = report.documentDomain || report.documentType || 'This document';
  const docType = report.documentType || domain;

  const categories = Array.from(
    new Set((topRisksForParagraph || []).map((r) => String(r?.category || r?.label || '').trim()).filter(Boolean))
  );
  const mainCategory = categories.slice(0, 2).join(' + ');

  const exposure = exposureLabelFrom(report.score, report.riskLevel);

  const hasRisks = Array.isArray(topRisksForParagraph) && topRisksForParagraph.length > 0;
  if (!hasRisks) {
    return `This ${docType.toLowerCase()} appears to contain limited risk triggers. Overall, exposure is ${exposure.toLowerCase()}, with no major concerns rising to the top.`;
  }

  const riskSentence = mainCategory ? `The main concerns cluster around ${mainCategory}.` : `The main concerns are concentrated in the highest-impact areas flagged by the analysis.`;

  return `This ${docType.toLowerCase()} includes operational/legal risk triggers that may affect enforcement, obligations, or termination outcomes. ${riskSentence} Overall exposure is ${exposure.toLowerCase()}, so focus your review on the clauses called out first.`;
};


const ResultsPage = () => {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const data = await getAnalysis(id);
        setAnalysis(data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load analysis.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [id]);

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 text-center text-slate-600 dark:text-slate-300">
        Loading analysis...
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 text-center text-slate-600 dark:text-slate-300">
        Analysis not found.
      </div>
    );
  }

  const report = normalizeReport(analysis);
  const clauseGroups = groupClausesByCategory(report.highlights);
  
  // Executive summary: decision-first, minimal surface area.
  const topRisks = pickTopRiskFindings(report.risks, 4);

  // Priority clauses: show high-impact first using existing severity fields if present.
  const sortedHighlights = [...report.highlights].sort((a, b) => {
    const sevRank = (s) => {
      const v = String(s || '').toLowerCase();
      if (v.includes('critical')) return 4;
      if (v.includes('high')) return 3;
      if (v.includes('medium')) return 2;
      if (v.includes('low')) return 1;
      return 0;
    };
    return sevRank(b?.severity) - sevRank(a?.severity);
  });

  const topHighlights = sortedHighlights.slice(0, 6);
  const topClauseGroups = groupClausesByCategory(topHighlights);

  // Recommended actions: keep evidence support; reduce surface to the first few if present.
  const adaptiveRecs = Array.isArray(report.adaptiveRecommendations) ? report.adaptiveRecommendations : [];
  const primaryRecs = adaptiveRecs.length > 0 ? adaptiveRecs : report.recommendations;
  const topRecs = Array.isArray(primaryRecs) ? primaryRecs.slice(0, 4) : [];

  const navItems = [
    { id: 'executive', label: 'Brief' },
    { id: 'findings', label: 'Findings' },
    { id: 'clauses', label: 'Clauses' },
    { id: 'actions', label: 'Actions' },
    { id: 'advanced', label: 'Advanced' },
  ];

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-950/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                TermsWise Report
              </span>
              <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">Jump to sections</span>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:opacity-90"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div className="md:hidden mt-2 flex items-center gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="shrink-0 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:opacity-90"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 1 — Executive Summary */}
      <div id="executive" className="scroll-mt-24 mx-auto max-w-7xl px-4">
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(report.createdAt)}</p>
              <h1 className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-slate-50">{report.title}</h1>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-100">{report.documentDomain}</span>
              {report.documentSubtype && report.documentSubtype !== report.documentDomain && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  {report.documentSubtype}
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <AdaptiveScoreCard
              score={report.score}
              documentType={report.documentType}
              grade={report.grade}
              riskLevel={report.riskLevel}
            />

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
              <h2 className="text-xs uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400 mb-2">Executive summary</h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                {buildExecutiveParagraph(report, topRisks)}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-900/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">What is this?</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">{report.documentType}</p>
                  {report.documentSubtype && report.documentSubtype !== report.documentType && (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{report.documentSubtype}</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-900/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">How concerning?</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">{exposureLabelFrom(report.score, report.riskLevel)}</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{report.riskLevel}</p>
                </div>

                <div className="sm:col-span-2 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-900/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Main concerns</p>
                  {topRisks.length > 0 ? (
                    <ul className="mt-2 space-y-1.5">
                      {topRisks.slice(0, 3).map((r, idx) => (
                        <li key={idx} className="text-sm text-slate-700 dark:text-slate-300">
                          <span className="font-semibold text-slate-900 dark:text-slate-50">{toBriefLabel(r)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">No major concerns highlighted.</p>
                  )}
                </div>

                <div className="sm:col-span-2 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">What to review first</p>
                  {report.summary ? (
                    <p className="mt-1 text-sm font-semibold text-emerald-900 dark:text-emerald-100">{report.summary}</p>
                  ) : (
                    <p className="mt-1 text-sm text-emerald-900 dark:text-emerald-100">
                      Start with the clauses highlighted in the next section.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <ExportDropdown analysis={analysis} />
          </div>
        </div>
      </div>

      {/* SECTION 2 — Key Findings */}
      <div id="findings" className="scroll-mt-24 mx-auto max-w-7xl px-4">
        <CollapsibleSection title="Key Findings" defaultOpen={true} borderColor="border-emerald-200 dark:border-emerald-900">
          <div className="space-y-4">
            {topRisks.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {topRisks.map((r, idx) => {
                  const impact = normalizeSeverity(r?.severity);
                  return (
                    <div key={idx} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-50">{toBriefLabel(r)}</h3>
                          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{clampText(toBriefDetail(r) || 'Review for impact', 95)}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-900/30 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {impact === 'Unknown' ? 'Review' : impact}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-sm text-emerald-900 dark:text-emerald-100">
                No major concerns highlighted in this document.
              </div>
            )}

            {/* Keep evidence support available without overwhelming the flow */}
            {report.risks.length > 0 && (
              <div className="hidden">{/** de-emphasize; keep for future expansion */}
                <RiskBreakdown risks={report.risks} />
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>

      {/* SECTION 3 — Important Clauses To Review */}
      <div id="clauses" className="scroll-mt-24 mx-auto max-w-7xl px-4">
        <CollapsibleSection
          title="Important Clauses To Review"
          defaultOpen={false}
          borderColor="border-slate-200 dark:border-slate-800"
        >
          <div className="space-y-4">
            {topClauseGroups.length > 0 ? (
              <div className="space-y-4">
                {topClauseGroups.slice(0, 3).map((group, idx) => {
                  const clauses = Array.isArray(group?.clauses) ? group.clauses : [];
                  if (!clauses.length) return null;

                  return (
                    <div key={idx} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
                        <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">
                          {group?.name || 'Clause topic'}
                        </p>
                      </div>

                      <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                        {clauses.slice(0, 4).map((clause, cIdx) => (
                          <div key={cIdx} className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 leading-6">
                                  {clause?.sentence}
                                </p>
                                {clause?.explanation && (
                                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                                    {clampText(clause.explanation, 120)}
                                  </p>
                                )}
                              </div>

                              <div className="shrink-0">
                                {clause?.severity && (
                                  <span className="rounded-full bg-slate-100 dark:bg-slate-900/30 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                    {normalizeSeverity(clause.severity)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Evidence source placeholder (optional, non-technical) */}
                            {Array.isArray(clause?.evidence) && clause.evidence.length > 0 && (
                              <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                                Evidence linked: {clause.evidence[0]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {clauses.length > 4 && (
                        <div className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                          Showing the most impactful clauses from this group.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 p-4 text-center text-slate-600 dark:text-slate-300 text-sm">
                No high-impact clauses detected.
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>

      {/* SECTION 4 — Recommended Actions */}
      <div id="actions" className="scroll-mt-24 mx-auto max-w-7xl px-4">
        {(adaptiveRecs.length > 0 || report.recommendations.length > 0) && (
          <CollapsibleSection title="Recommended Actions" defaultOpen={true} icon={BookOpen}>
            <div className="space-y-3">
              {adaptiveRecs.length > 0 ? (
                topRecs.map((rec, index) => (
                  <EvidenceLinkedRecommendation
                    key={index}
                    recommendation={rec.text || rec}
                    triggeringClause={rec.triggeringClause || 'Analysis finding'}
                    location={rec.location}
                    severity={rec.severity || 'Medium'}
                    relevance={rec.relevance}
                    evidence={rec.evidence || []}
                    category={rec.category}
                  />
                ))
              ) : (
                topRecs.map((rec, index) => (
                  <div key={index} className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4">
                    <p className="text-sm text-emerald-900 dark:text-emerald-100">{rec}</p>
                  </div>
                ))
              )}
            </div>
          </CollapsibleSection>
        )}
      </div>

      {/* SECTION 5 — Advanced Analysis (collapsed by default) */}
      <div id="advanced" className="scroll-mt-24 mx-auto max-w-7xl px-4">
        <CollapsibleSection title="Advanced Analysis" defaultOpen={false}>
          <div className="space-y-4">
            {report.pipelineStages.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-2">Analysis Pipeline</h3>
                <PipelineStages stages={report.pipelineStages} />
              </div>
            )}

            {report.classificationReasoning && (
              <ClassificationReasoningPanel
                documentType={report.documentType}
                strongSignals={report.classificationReasoning.strongSignals || []}
                rejectedAlternatives={report.classificationReasoning.suppressedCategories || []}
                dominantContext={report.classificationReasoning.conclusion}
                semanticRationale={report.classificationReasoning.riskSummary}
              />
            )}

            {report.themeDominance.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-2">Theme Strength</h3>
                <div className="space-y-3">
                  {report.themeDominance.slice(0, 3).map((theme) => (
                    <div key={theme.label || theme.key} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
                      <div className="mb-2">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-50">{theme.label}</h4>
                      </div>
                      <SignalIndicator value={theme.confidence || theme.share} label="Primary signal" size="md" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.contextSignals.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-2">Detection Signals</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {report.contextSignals.slice(0, 6).map((signal, index) => {
                    const label = typeof signal === 'string' ? signal : signal.label;
                    return (
                      <div key={index} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{label}</p>
                        {typeof signal !== 'string' && signal.confidence && <SignalIndicator value={signal.confidence} size="sm" showExactPercent={false} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {report.dominantLegalThemes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-2">Dominant Legal Themes</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {report.dominantLegalThemes.slice(0, 4).map((theme) => (
                    <div key={theme.label || theme.key} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">{theme.label}</h4>
                      <SignalIndicator value={theme.confidence || theme.share} label="Signal strength" size="md" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>

      {/* Keep protective indicators, but do not surface unless the user expands advanced */}
      {report.positives.length > 0 && (
        <CollapsibleSection title="Protective Language Detected" defaultOpen={false}>
          <div className="grid gap-3 md:grid-cols-2">
            {report.positives.map((indicator) => (
              <div key={indicator.label} className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">{indicator.label}</h4>
                  {indicator.reduction && <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">-{indicator.reduction}</span>}
                </div>
                {indicator.matches?.length > 0 && (
                  <p className="text-xs text-emerald-800 dark:text-emerald-200">{indicator.matches.slice(0, 2).join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
};

export default ResultsPage;

