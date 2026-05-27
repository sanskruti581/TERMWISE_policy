import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * CollapsibleSection - Accordion-style collapsible container
 * Enables progressive disclosure of complex information
 * 
 * Usage:
 * <CollapsibleSection title="Advanced Analysis" defaultOpen={false}>
 *   <p>Content here</p>
 * </CollapsibleSection>
 */
const CollapsibleSection = ({
  title,
  icon: Icon = null,
  children,
  defaultOpen = false,
  className = '',
  titleClassName = '',
  contentClassName = '',
  borderColor = 'border-slate-200 dark:border-slate-800'
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-2xl border ${borderColor} bg-white dark:bg-slate-950 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
        aria-expanded={isOpen}
        aria-label={title}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className="text-emerald-600 dark:text-emerald-300 flex-shrink-0" />}
          <h2 className={`text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50 text-left ${titleClassName}`}>
            {title}
          </h2>
        </div>
        <ChevronDown
          size={20}
          className={`text-slate-400 dark:text-slate-500 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <div className={isOpen ? 'block' : 'hidden'}>
        <div className={`divider px-6 py-5 ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
};


export default CollapsibleSection;
