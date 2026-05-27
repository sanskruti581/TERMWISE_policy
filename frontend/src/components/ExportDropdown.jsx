import { Download, FileJson, Copy, Share2, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { downloadPdfReport, downloadTextReport } from '../utils/report.js';

/**
 * ExportDropdown - Unified export menu for reports
 * Consolidates PDF, JSON, summary copy, and sharing options
 * 
 * Usage:
 * <ExportDropdown analysis={analysis} />
 */
const ExportDropdown = ({ analysis, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportPdf = async () => {
    try {
      await downloadPdfReport(analysis);
      toast.success('PDF report generated');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const handleExportText = async () => {
    try {
      await downloadTextReport(analysis);
      toast.success('Text report downloaded');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to export text');
    }
  };

  const handleExportJson = async () => {
    try {
      const json = JSON.stringify(analysis, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${analysis.title || 'analysis'}-data.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('JSON exported');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to export JSON');
    }
  };

  const handleCopySummary = async () => {
    try {
      const summary = analysis.summary || analysis.semanticNarrative || 'No summary available';
      await navigator.clipboard.writeText(summary);
      toast.success('Summary copied to clipboard');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to copy summary');
    }
  };

  const handleGenerateLink = () => {
    try {
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/results/${analysis.id}`;
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to generate link');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 font-semibold text-sm transition-colors"
      >
        <Download size={17} />
        Export
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute top-full right-0 mt-2 w-56 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-20 overflow-hidden">
            {/* Export PDF */}
            <button
              type="button"
              onClick={handleExportPdf}
              className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 border-b border-slate-200 dark:border-slate-800"
            >
              <Download size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm">Export PDF Report</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Full report with all findings</p>
              </div>
            </button>

            {/* Export Text */}
            <button
              type="button"
              onClick={handleExportText}
              className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 border-b border-slate-200 dark:border-slate-800"
            >
              <Download size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm">Export as Text</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Plain text format</p>
              </div>
            </button>

            {/* Export JSON */}
            <button
              type="button"
              onClick={handleExportJson}
              className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 border-b border-slate-200 dark:border-slate-800"
            >
              <FileJson size={16} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm">Export JSON</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Raw data for integration</p>
              </div>
            </button>

            {/* Copy Summary */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 border-b border-slate-200 dark:border-slate-800"
            >
              <Copy size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm">Copy Summary</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">To clipboard</p>
              </div>
            </button>

            {/* Generate Link */}
            <button
              type="button"
              onClick={handleGenerateLink}
              className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
            >
              <Share2 size={16} className="text-sky-600 dark:text-sky-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm">Copy Shareable Link</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Share this analysis</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportDropdown;
