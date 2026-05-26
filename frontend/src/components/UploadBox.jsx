import { CheckCircle2, FileText, FileUp, Image, X } from 'lucide-react';
import { useRef, useState } from 'react';

const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
const maxFileSize = 10 * 1024 * 1024;

const UploadBox = ({ file, onFileChange, disabled, progress = 0, status = '' }) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const chooseFile = (selectedFile) => {
    if (selectedFile) onFileChange(selectedFile);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  };

  const isValidType = !file || allowedTypes.includes(file.type);
  const isValidSize = !file || file.size <= maxFileSize;
  const isValid = isValidType && isValidSize;

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`group flex min-h-[14rem] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed p-5 text-center transition duration-300 ${
          isDragging
            ? 'scale-[1.01] border-emerald-500 bg-emerald-50/90 shadow-xl shadow-emerald-600/10 dark:bg-emerald-950/30'
            : 'border-slate-300/80 bg-gradient-to-b from-white to-slate-50 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-xl hover:shadow-slate-900/10 dark:border-slate-700 dark:from-slate-900 dark:to-slate-950 dark:hover:border-emerald-500'
        }`}
      >
        <span className="relative mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-lg shadow-emerald-600/15 transition group-hover:scale-105 dark:bg-emerald-950 dark:text-emerald-200">
          <span className="absolute inset-0 rounded-2xl bg-emerald-400/20 blur-xl" />
          <FileUp className="relative" size={30} />
        </span>
        <span className="text-lg font-bold text-slate-950 dark:text-white">Drop a policy file here</span>
        <span className="mt-2 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">Upload PDF documents or OCR-ready screenshots for clause extraction.</span>
        <span className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-200"><FileText size={13} /> PDF</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-200"><Image size={13} /> JPG</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-200"><Image size={13} /> PNG</span>
          <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-200">10 MB max</span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(event) => chooseFile(event.target.files?.[0])}
      />
      {file && (
        <div className={`mt-3 flex items-center justify-between rounded-2xl border px-3 py-2.5 text-sm shadow-sm ${isValid ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-100' : 'border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/30'}`}>
          <span className="truncate font-medium">{file.name}</span>
          {isValid && <CheckCircle2 size={16} className="ml-2 shrink-0 text-emerald-600 dark:text-emerald-300" />}
          <button type="button" onClick={() => onFileChange(null)} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Remove file">
            <X size={16} />
          </button>
        </div>
      )}
      {file && !isValidType && <p className="mt-2 text-sm text-rose-600">Only PDF, JPG, JPEG, and PNG files are supported.</p>}
      {file && !isValidSize && <p className="mt-2 text-sm text-rose-600">File size must be 10 MB or less.</p>}
      {status && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{status}</span>
            {progress > 0 && <span>{progress}%</span>}
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all" style={{ width: `${Math.max(progress, status ? 12 : 0)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadBox;
