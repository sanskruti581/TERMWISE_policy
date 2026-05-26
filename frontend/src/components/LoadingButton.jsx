import { Loader2 } from 'lucide-react';

const LoadingButton = ({ loading, children, ...props }) => (
  <button {...props} disabled={loading || props.disabled} className={`btn-primary ${props.className || ''}`}>
    {loading && <Loader2 size={17} className="animate-spin" />}
    {children}
  </button>
);

export default LoadingButton;
