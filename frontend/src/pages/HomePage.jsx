import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, BarChart3, CheckCircle2, FileText, LockKeyhole, ShieldAlert, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react';
import UploadBox from '../components/UploadBox.jsx';
import LoadingButton from '../components/LoadingButton.jsx';
import { analyzeText, uploadDocument } from '../services/api.js';

const sampleRisks = [
  { label: 'Cookies + ads', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100' },
  { label: 'Third-party sharing', tone: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-100' },
  { label: 'Location signals', tone: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-100' }
];

const pipelineLabels = [
  'Extracting text',
  'Parsing sections',
  'Detecting document type',
  'Running semantic balancing',
  'Evaluating risks',
  'Generating report'
];

const HomePage = () => {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!file && text.trim().length < 30) {
      toast.error('Upload a document or paste at least 30 characters.');
      return;
    }

    if (file && !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Choose a PDF, JPG, JPEG, or PNG file.');
      return;
    }

    if (file && file.size > 10 * 1024 * 1024) {
      toast.error('File must be 10 MB or less.');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    try {
      let policyText = text;
      let sourceType = 'text';

      if (file) {
        setStep('Extracting text');
        const uploadResult = await uploadDocument(file, (event) => {
          if (event.total) {
            setUploadProgress(Math.round((event.loaded * 100) / event.total));
          }
        });
        setStep('Parsing sections');
        policyText = `${uploadResult.extractedText}\n\n${text}`.trim();
        sourceType = 'file';
      }

      setStep('Running semantic balancing');
      const analysis = await analyzeText({ text: policyText, title, sourceType });
      toast.success('Analysis complete');
      navigate(`/results/${analysis.id || analysis._id}`, { state: { analysis } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to analyze this document.');
    } finally {
      setLoading(false);
      setStep('');
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-[linear-gradient(135deg,#f8fffb_0%,#eefcf6_36%,#f8fafc_100%)] px-5 py-4 shadow-2xl shadow-emerald-950/10 dark:border-slate-800/80 dark:bg-[linear-gradient(135deg,#020617_0%,#052e2b_42%,#111827_100%)] md:px-7 md:py-5 lg:px-8 lg:py-5">
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-emerald-300/30 via-cyan-200/30 to-transparent blur-3xl dark:from-emerald-500/15 dark:via-cyan-500/10" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

        <div className="relative grid items-start gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/75 px-3 py-1.5 text-sm font-medium text-emerald-800 shadow-sm backdrop-blur dark:border-emerald-400/20 dark:bg-white/10 dark:text-emerald-100">
              <Sparkles size={15} /> AI-assisted policy intelligence
            </div>
            <h1 className="text-balance text-3xl font-black leading-tight text-slate-950 md:text-4xl lg:text-5xl dark:text-white">
              Understand privacy policies before accepting them.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base dark:text-slate-300">
              TermsWise turns dense policies into a clean risk report with tracking, cookies, data selling, retention, and third-party sharing insights.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a href="#analyze" className="btn-primary h-11 rounded-xl px-5 shadow-xl shadow-emerald-600/20 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-emerald-600/25">
                <UploadCloud size={18} /> Analyze Policy
              </a>
              <a href="#sample-report" className="btn-secondary h-11 rounded-xl border-slate-200/80 bg-white/80 px-5 shadow-lg shadow-slate-900/5 backdrop-blur hover:-translate-y-0.5 dark:border-slate-700/80 dark:bg-slate-900/70">
                <BarChart3 size={18} /> View Sample Report
              </a>
            </div>

            <div className="mt-5 grid max-w-xl grid-cols-2 gap-2.5 sm:grid-cols-3">
              {[
                ['8', 'risk signals'],
                ['PDF', 'image OCR'],
                ['0-100', 'score']
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/75 bg-white/60 p-2.5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-black text-slate-950 dark:text-white">{value}</p>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="sample-report" className="rounded-3xl border border-white/80 bg-white/70 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55 dark:shadow-black/30">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-950 p-3 text-white shadow-xl dark:border-slate-800">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Sample privacy report</p>
                  <h2 className="mt-0.5 text-lg font-bold">Policy risk overview</h2>
                </div>
                <span className="rounded-xl bg-amber-300 px-3 py-1.5 text-sm font-black text-amber-950">Grade C</span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[0.72fr_1fr]">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5">
                  <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full bg-[conic-gradient(#f59e0b_0_58%,rgba(255,255,255,0.12)_58%_100%)]">
                    <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-slate-950">
                      <div className="text-center">
                        <p className="text-2xl font-black">58</p>
                        <p className="text-xs text-slate-400">risk score</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold"><ShieldAlert size={16} className="text-amber-300" /> Detected clauses</span>
                      <span className="text-xs text-slate-400">3 categories</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sampleRisks.map((risk) => (
                        <span key={risk.label} className={`rounded-full px-2.5 py-1 text-xs font-bold ${risk.tone}`}>{risk.label}</span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Highlighted evidence</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">"We may share device identifiers with advertising partners."</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
              {[
                [LockKeyhole, 'Encrypted mention', 'positive'],
                [ShieldCheck, 'Deletion rights', 'found'],
                [FileText, 'Plain summary', 'ready']
              ].map(([Icon, label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200/80 bg-white/75 p-2.5 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <Icon size={17} className="text-emerald-600 dark:text-emerald-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="analyze" className="relative -mt-10 scroll-mt-20 rounded-3xl border border-white/70 bg-white/45 p-3 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/35 md:p-4">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Analyze</p>
            <h2 className="mt-0.5 text-xl font-black text-slate-950 md:text-2xl dark:text-white">Upload a policy or paste the text</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">Run a local rule-based scan first. Groq summaries are optional when an API key is configured.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="card group overflow-hidden rounded-3xl border-slate-200/80 bg-white/80 p-4 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold">Upload document</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">Images use OCR. Text PDFs are parsed directly.</p>
            </div>
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
              <UploadCloud size={20} />
            </span>
          </div>
          <div className="mt-3">
            <UploadBox file={file} onFileChange={setFile} disabled={loading} progress={uploadProgress} status={loading && file ? step || 'Preparing upload' : ''} />
          </div>
        </div>

        <div className="card overflow-hidden rounded-3xl border-slate-200/80 bg-white/80 p-4 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold">Paste policy text</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">Add raw policy text for the fastest analysis.</p>
            </div>
            <span className="rounded-xl bg-sky-50 p-2 text-sky-700 dark:bg-sky-950/50 dark:text-sky-200">
              <FileText size={20} />
            </span>
          </div>
          <div className="mt-3 space-y-2.5">
            <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Optional title" />
            <textarea
              className="input min-h-[12rem] resize-y leading-7 lg:min-h-[13rem]"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste privacy policy or terms text here..."
            />
            {loading && (
              <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                {pipelineLabels.map((label) => {
                  const activeIndex = Math.max(0, pipelineLabels.indexOf(step));
                  const index = pipelineLabels.indexOf(label);
                  const isComplete = index < activeIndex;
                  const isActive = index === activeIndex;
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${isComplete ? 'bg-emerald-500' : isActive ? 'animate-pulse bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <span className={`text-xs font-semibold ${isComplete || isActive ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>{label}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <LoadingButton loading={loading} onClick={handleAnalyze} className="h-11 w-full rounded-xl shadow-xl shadow-emerald-600/15 hover:-translate-y-0.5">
              {loading ? step || 'Analyzing...' : <><ShieldCheck size={18} /> Analyze policy <ArrowRight size={18} /></>}
            </LoadingButton>
          </div>
        </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
