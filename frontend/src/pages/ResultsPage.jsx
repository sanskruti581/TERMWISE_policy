import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';
import { getAnalysis } from '../services/api.js';
import { formatDate } from '../utils/formatters.js';
import {
  pickTopFindings,
  pickTopClauses,
  pickTopRecommendations,
  buildOpeningNarrative,
  getExposureAssessment,
  getMostImportantItems,
  getFindingsSectionTitle,
  findingToReadableLabel,
  findingToDetailText,
  severityToLabel,
  severityToBgColor,
  prepareClauseForDisplay,
  prepareRecommendationForDisplay,
} from '../utils/executiveSummary.js';
import AdaptiveScoreCard from '../components/AdaptiveScoreCard.jsx';
import CollapsibleSection from '../components/CollapsibleSection.jsx';
import SignalIndicator from '../components/SignalIndicator.jsx';
import ClassificationReasoningPanel from '../components/ClassificationReasoningPanel.jsx';
import EvidenceLinkedRecommendation from '../components/EvidenceLinkedRecommendation.jsx';
import ExportDropdown from '../components/ExportDropdown.jsx';

/**
 * Normalize and validate analysis data for interpretation-first display
 */
const normalizeReport = (analysis) => {
  const risks = Array.isArray(analysis.risks)
    ? analysis.risks.filter(r => r?.category).filter((r, idx, arr) => arr.findIndex(x => x.category === r.category) === idx)
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
    adaptiveRecommendations: Array.isArray(analysis.adaptiveRecommendations) ? analysis.adaptiveRecommendations : []
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
        <div key={stage.label || index} className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/30">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{index + 1}</span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{stage.label}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * MostImportantToReview component
 * Shows prioritized areas requiring attention (not just "risks")
 */
const MostImportantToReview = ({ areas = [] }) => {
  if (!Array.isArray(areas) || areas.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200/70 dark:border-amber-900/70 bg-amber-50/50 dark:bg-amber-950/20 p-5">
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="flex-shrink-0 text-amber-700 dark:text-amber-300 mt-0.5" size={20} />
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
            Most Important To Review
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            Start here before reading the full clause set
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {areas.slice(0, 5).map((area, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-100">
            <span className="flex-shrink-0 font-bold text-amber-700 dark:text-amber-300">{idx + 1}.</span>
            <span>{area}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * ResultsPage - Interpretation-first legal intelligence dashboard
 * 
 * Core principle: Answer "What does this mean for me?" not "What did we detect?"
 * 
 * 5-Section Architecture:
 * 1. Executive Summary (Interpretive, decision-first)
 * 2. Key Review Areas (Top findings, severity-prioritized)
 * 3. Most Important to Review (Specific focus areas)
 * 4. Important Clauses (Severity-sorted, evidence-linked)
 * 5. Recommended Actions (Evidence-aware recommendations)
 * 6. Advanced Analysis (Collapsed, technical details)
 * 7. Protective Language (Collapsed, if present)
 */
const ResultsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [analysis, setAnalysis] = useState(location.state?.analysis || null);
  const [loading, setLoading] = useState(!location.state?.analysis);

  useEffect(() => {
    if (analysis) return;

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
  }, [analysis, id]);

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
  // Interpretation-first calculations
  const openingNarrative = buildOpeningNarrative(report);
  const exposureAssessment = getExposureAssessment(report);
  const topFindings = pickTopFindings(report.risks, 4);
  const mostImportantAreas = getMostImportantItems(report);
  const topClauses = pickTopClauses(report.highlights, 6);
  const topRecommendations = pickTopRecommendations(report.adaptiveRecommendations.length > 0 ? report.adaptiveRecommendations : report.recommendations, 4)
    .map(prepareRecommendationForDisplay);
  const reviewAreaTitle = getFindingsSectionTitle(report.risks, report.documentDomain);

  return (
    <div className="space-y-6">
      {/* ===== SECTION 1: EXECUTIVE SUMMARY (Interpretive, Decision-First) ===== */}
      <div id="executive" className="scroll-mt-24 space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <ArrowLeft size={17} />
          Back to analyze
        </Link>

        {/* Header: Title, Date, Classification */}
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(report.createdAt)}</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-50">{report.title}</h1>
        </div>

        {/* Classification Badges */}
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-100">
            {report.documentType}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-100">
            {report.documentDomain}
          </span>
          {report.documentSubtype && report.documentSubtype !== report.documentType && (
            <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-100">
              {report.documentSubtype}
            </span>
          )}
        </div>

        {/* Score Card + Executive Interpretation */}
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <AdaptiveScoreCard
            score={report.score}
            documentType={report.documentType}
            grade={report.grade}
          />

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
            <h2 className="text-xs uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400 mb-3">
              Exposure Level
            </h2>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
              {exposureAssessment.level}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
              This document relates to {exposureAssessment.contextArea}.
            </p>
          </div>
        </div>

        {/* Opening Narrative - What This Means */}
        <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-900/70 bg-emerald-50/50 dark:bg-emerald-950/20 p-5">
          <h2 className="text-xs uppercase tracking-wide font-semibold text-emerald-800 dark:text-emerald-200 mb-3">
            What This Means
          </h2>
          <p className="text-sm leading-6 text-emerald-900 dark:text-emerald-100">
            {openingNarrative}
          </p>
        </div>

        {/* Most Important Areas - Quick Prioritization */}
        {mostImportantAreas.length > 0 && (
          <MostImportantToReview areas={mostImportantAreas} />
        )}

        {/* Export */}
        <div className="flex gap-2">
          <ExportDropdown analysis={analysis} />
        </div>
      </div>

      {/* ===== SECTION 2: KEY REVIEW AREAS (Severity-Prioritized, Not "Top Risks") ===== */}
      {topFindings.length > 0 && (
        <div id="findings" className="scroll-mt-24">
          <CollapsibleSection
            title={reviewAreaTitle}
            defaultOpen={true}
            borderColor="border-emerald-200 dark:border-emerald-900"
          >
            <div className="grid gap-3 md:grid-cols-2">
              {topFindings.map((finding, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                      {findingToReadableLabel(finding)}
                    </h3>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${severityToBgColor(finding?.severity)}`}>
                      {severityToLabel(finding?.severity)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {findingToDetailText(finding)}
                  </p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* ===== SECTION 3: IMPORTANT CLAUSES TO REVIEW (Severity-First, Evidence-Linked) ===== */}
      {topClauses.length > 0 && (
        <div id="clauses" className="scroll-mt-24">
          <CollapsibleSection
            title="Important Clauses To Review"
            defaultOpen={false}
            borderColor="border-slate-200 dark:border-slate-800"
          >
            <div className="space-y-4">
              {topClauses.map((clause, idx) => {
                const prepared = prepareClauseForDisplay(clause, idx);
                return (
                  <div key={idx} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 leading-6">
                        {prepared.sentence}
                      </p>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${prepared.severityColor}`}>
                        {prepared.severity}
                      </span>
                    </div>

                    {prepared.explanation && (
                      <div className="mb-3 rounded-lg border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/20 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                          Why it matters
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {prepared.explanation}
                        </p>
                      </div>
                    )}

                    {prepared.evidence.filter(Boolean).length > 0 && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Evidence: {prepared.evidence.filter(Boolean)[0]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* ===== SECTION 4: RECOMMENDED ACTIONS (Evidence-Linked) ===== */}
      {topRecommendations.length > 0 && (
        <div id="actions" className="scroll-mt-24">
          <CollapsibleSection
            title="Recommended Actions"
            defaultOpen={true}
            icon={BookOpen}
          >
            <div className="space-y-3">
              {topRecommendations.map((rec, index) => (
                <EvidenceLinkedRecommendation
                  key={index}
                  recommendation={rec.text}
                  triggeringClause={rec.triggeringClause || rec.originalText || 'Analysis finding'}
                  location={rec.location}
                  severity={rec.severity || 'Medium'}
                  relevance={rec.relevance}
                  evidence={rec.evidence || []}
                  category={rec.category || 'Review area'}
                />
              ))}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* ===== SECTION 5: ADVANCED ANALYSIS (Collapsed - Technical Details) ===== */}
      <div id="advanced" className="scroll-mt-24">
        <CollapsibleSection
          title="Advanced Analysis"
          defaultOpen={false}
        >
          <div className="space-y-6">
            {/* Classification Reasoning */}
            {report.classificationReasoning && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-4">
                  Classification Rationale
                </h3>
                <ClassificationReasoningPanel
                  documentType={report.documentType}
                  strongSignals={report.classificationReasoning.strongSignals || []}
                  rejectedAlternatives={report.classificationReasoning.suppressedCategories || []}
                  dominantContext={report.classificationReasoning.conclusion}
                  semanticRationale={report.classificationReasoning.riskSummary}
                />
              </div>
            )}

            {/* Pipeline stages */}
            {report.pipelineStages.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-3">
                  Analysis Pipeline
                </h3>
                <PipelineStages stages={report.pipelineStages} />
              </div>
            )}

            {/* Theme dominance */}
            {report.themeDominance.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-3">
                  Theme Strength
                </h3>
                <div className="space-y-3">
                  {report.themeDominance.slice(0, 3).map((theme) => (
                    <div key={theme.label || theme.key} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">{theme.label}</h4>
                      <SignalIndicator
                        value={theme.confidence || theme.share}
                        label="Strength"
                        size="md"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Context signals */}
            {report.contextSignals.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-3">
                  Detection Signals
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {report.contextSignals.slice(0, 6).map((signal, index) => {
                    const label = typeof signal === 'string' ? signal : signal.label;
                    return (
                      <div key={index} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{label}</p>
                        {typeof signal !== 'string' && signal.confidence && (
                          <SignalIndicator
                            value={signal.confidence}
                            size="sm"
                            showExactPercent={false}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dominant legal themes */}
            {report.dominantLegalThemes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-3">
                  Dominant Legal Themes
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {report.dominantLegalThemes.slice(0, 4).map((theme) => (
                    <div key={theme.label || theme.key} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">{theme.label}</h4>
                      <SignalIndicator
                        value={theme.confidence || theme.share}
                        label="Presence"
                        size="md"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>

      {/* ===== SECTION 6: PROTECTIVE LANGUAGE (Collapsed, If Present) ===== */}
      {report.positives.length > 0 && (
        <CollapsibleSection
          title="Protective Language Detected"
          defaultOpen={false}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {report.positives.map((indicator) => (
              <div key={indicator.label} className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">{indicator.label}</h4>
                  {indicator.reduction && (
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      -{indicator.reduction}
                    </span>
                  )}
                </div>
                {indicator.matches?.length > 0 && (
                  <p className="text-xs text-emerald-800 dark:text-emerald-200">
                    {indicator.matches.slice(0, 2).join(', ')}
                  </p>
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
