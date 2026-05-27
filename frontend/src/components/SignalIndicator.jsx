import { getSignalStrength, getSignalColors } from '../utils/signalStrength.js';

/**
 * SignalIndicator - Replaces percentage-based confidence bars
 * Shows qualitative signal strength with visual intensity
 * 
 * Usage:
 * <SignalIndicator value={0.87} />  // "Strong signal"
 * <SignalIndicator value={65} scale="percent" />  // "Moderate signal"
 * <SignalIndicator value={0.5} label="Detection confidence" />
 */
const SignalIndicator = ({ 
  value = 0, 
  scale = 'decimal',
  label,
  showExactPercent = false,
  size = 'md',
  className = ''
}) => {
  const normalized = scale === 'percent' ? value / 100 : value;
  const clamped = Math.max(0, Math.min(1, normalized));
  const strength = getSignalStrength(clamped, 'decimal');
  const colors = getSignalColors(clamped, 'decimal');
  
  const percent = Math.round(clamped * 100);
  const displayPercent = scale === 'percent' ? value : percent;

  // Size variants
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={className}>
      {(label || showExactPercent) && (
        <div className="mb-2 flex items-center justify-between">
          {label && <span className={`font-medium ${colors.text}`}>{label}</span>}
          {showExactPercent && (
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {displayPercent}%
            </span>
          )}
        </div>
      )}
      
      {/* Bar indicator */}
      <div className={`overflow-hidden rounded-full ${colors.bg} border ${colors.border} ${sizeClasses[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${strength === 'Strong signal' ? 'bg-emerald-500' : strength === 'Moderate signal' ? 'bg-amber-500' : 'bg-slate-400'}`}
          style={{
            width: `${Math.max(4, percent)}%`
          }}
        />
      </div>

      {/* Label */}
      <div className={`mt-2 ${textSizes[size]} font-medium ${colors.text}`}>
        {strength}
      </div>
    </div>
  );
};

export default SignalIndicator;
